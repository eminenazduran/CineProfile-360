from flask import Flask, request, jsonify
from flask_cors import CORS
import os, re, math, time

# ==== Ayarlar ====
PORT = int(os.getenv("PORT", 5001))
MAX_UPLOAD_BYTES = 2_000_000     # ~2MB sınırı (Gün 6 gereği: büyük dosya notu)

app = Flask(__name__)
CORS(app)

# ==== KATEGORİ SÖZLÜKLERİ (TR/EN varyasyonları, kök bazlı) ====
# Not: \w* ile temel ek/çekim varyasyonlarını kapsıyoruz.
VIOLENCE_PATTERNS = [
    r"blood", r"kan",
    r"(kill|öldür)\w*", r"(knife|bıçak)\w*",
    r"(gun|silah)\w*", r"(shoot|ateş)\w*", r"vur\w*",
    r"(explode|patla)\w*"
]

FEAR_PATTERNS = [
    r"(scream|çığlık)\w*", r"(fear|kork)\w*", r"(panic|panik)\w*",
    r"dehşet", r"ürper\w*", r"kaç\w*"
]

# İstersen ileride toparlamak için hazır dursun (şimdilik skor=0 dönecek)
PROFANITY_PATTERNS = [
    # ör: r"(fuck|shit|lanet)\w*"
]
SEXUAL_PATTERNS = [
    # ör: r"(sex|seks|erotik)\w*"
]

def _compile_any(patterns):
    return re.compile(r"\b(?:%s)\b" % "|".join(patterns), re.IGNORECASE)

RE_VIOLENCE = _compile_any(VIOLENCE_PATTERNS)
RE_FEAR     = _compile_any(FEAR_PATTERNS)
RE_PROF     = _compile_any(PROFANITY_PATTERNS) if PROFANITY_PATTERNS else re.compile(r"(?!x)x")
RE_SEX      = _compile_any(SEXUAL_PATTERNS)    if SEXUAL_PATTERNS else re.compile(r"(?!x)x")

# Türkçe karakterleri de kapsayan kelime ayracı
TOKENIZER = re.compile(r"[A-Za-z0-9çğıöşüÇĞİÖŞÜ']+")

# ==== Yardımcılar ====
def tokenize(text: str):
    return [(m.group(), m.start()) for m in TOKENIZER.finditer(text or "")]

def bucket_seconds(word_index: int, bucket_size_words: int = 10, bucket_seconds: int = 10):
    """Kelime indeksine göre 10 kelime ≈ 10 sn dilimi."""
    bucket = word_index // bucket_size_words
    start_sec = bucket * bucket_seconds
    end_sec = start_sec + bucket_seconds
    return start_sec, end_sec

def stable_score(count: int, total_tokens: int) -> float:
    """
    Gün 6: skoru 0–10 aralığında daha 'stabil' ver.
    Düşük sıklıkta düşük, arttıkça 10'a yakınsayan yumuşak bir eğri.
    """
    if total_tokens <= 0:
        return 0.0
    density = count / total_tokens           # 0..1 arası çok küçük bir değer
    raw = 10.0 * (1 - math.exp(-density * 50))  # yoğunluk arttıkça 10'a yaklaşır
    return round(min(10.0, raw), 1)

def _collect_spans(plain: str, tokens, pattern, span_type: str):
    """
    Eşleşen her kelimenin geçtiği kelime indeksine bak,
    10 kelime ~ 10 saniye kovasına çevir ve span ekle.
    score = 1 (basit bir olay skoru, istersen artırılabilir).
    """
    spans = []
    # Kelime offset listesi (hızlı index bulmak için)
    word_offsets = [off for _, off in tokens]

    for m in pattern.finditer(plain):
        off = m.start()
        # küçük metinlerde lineer index araması yeter
        idx = 0
        while idx + 1 < len(word_offsets) and word_offsets[idx + 1] <= off:
            idx += 1
        s, e = bucket_seconds(idx)
        spans.append({"start": s, "end": e, "type": span_type, "score": 1})
    return spans

def analyze_plain_text(text: str):
    """Serbest metin için skor + risk_spans üret."""
    plain = text or ""
    tokens = tokenize(plain)
    total_tokens = max(1, len(tokens))

    v_spans = _collect_spans(plain, tokens, RE_VIOLENCE, "violence")
    f_spans = _collect_spans(plain, tokens, RE_FEAR,     "fear")
    p_spans = _collect_spans(plain, tokens, RE_PROF,     "profanity")
    s_spans = _collect_spans(plain, tokens, RE_SEX,      "sexual")

    # sayımlar
    v_count = len(v_spans)
    f_count = len(f_spans)
    p_count = len(p_spans)
    s_count = len(s_spans)

    scores = {
        "violence": stable_score(v_count, total_tokens),
        "fear":     stable_score(f_count, total_tokens),
        "profanity":stable_score(p_count, total_tokens),
        "sexual":   stable_score(s_count, total_tokens),
    }

    spans = v_spans + f_spans + p_spans + s_spans
    return scores, spans

# ==== SRT Parsleme (blok bazlı) ====
def parse_srt_blocks(srt_text: str):
    """
    index
    HH:MM:SS,mmm --> HH:MM:SS,mmm
    text...
    (boş satır)
    """
    blocks = []
    lines = (srt_text or "").splitlines()
    i = 0
    time_re = re.compile(r"^\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})")
    while i < len(lines):
        if lines[i].strip().isdigit():
            i += 1
        if i >= len(lines):
            break

        m = time_re.match(lines[i].strip())
        if not m:
            i += 1
            continue

        h1, m1, s1, ms1, h2, m2, s2, ms2 = m.groups()
        start = int(h1)*3600 + int(m1)*60 + int(s1)
        end   = int(h2)*3600 + int(m2)*60 + int(s2)
        i += 1

        text_lines = []
        while i < len(lines) and lines[i].strip() != "":
            text_lines.append(lines[i])
            i += 1
        text = " ".join(text_lines).strip()

        blocks.append((start, end, text))

        while i < len(lines) and lines[i].strip() == "":
            i += 1

    return blocks

def merge_overlaps(spans):
    """
    Gün 5/6: risk_spans temizliği — çakışan aralıkları birleştir.
    Tip önceliği basit: violence > fear > profanity > sexual
    (eşitlikte ilk gelen).
    """
    if not spans:
        return []

    priority = {"violence": 4, "fear": 3, "profanity": 2, "sexual": 1}
    spans_sorted = sorted(spans, key=lambda x: (x["start"], -priority.get(x["type"], 0)))

    merged = [spans_sorted[0].copy()]
    for cur in spans_sorted[1:]:
        last = merged[-1]
        if cur["start"] <= last["end"]:
            # overlap — birleştir
            last["end"] = max(last["end"], cur["end"])
            # tip önceliği — yüksek öncelikli tipi koru
            if priority.get(cur["type"], 0) > priority.get(last["type"], 0):
                last["type"] = cur["type"]
            # skorları toplayıp yumuşat
            last["score"] = min(10, (last.get("score", 1) + cur.get("score", 1)))
        else:
            merged.append(cur.copy())
    return merged

def analyze_srt_file_text(srt_text: str):
    """Tüm .srt dosyasını blok bazlı analiz et; birleştirilmiş span listesi ve skorlar döndür."""
    blocks = parse_srt_blocks(srt_text)
    agg_spans = []
    total_tokens = 0
    v_count = f_count = p_count = s_count = 0

    for start, end, text in blocks:
        scores_line, spans_line = analyze_plain_text(text)
        # sayımlar: span sayısı ile yaklaş (alternatif: findall count)
        v_count += sum(1 for sp in spans_line if sp["type"] == "violence")
        f_count += sum(1 for sp in spans_line if sp["type"] == "fear")
        p_count += sum(1 for sp in spans_line if sp["type"] == "profanity")
        s_count += sum(1 for sp in spans_line if sp["type"] == "sexual")

        for sp in spans_line:
            agg_spans.append({"start": start, "end": end, "type": sp["type"], "score": sp.get("score", 1)})

        total_tokens += max(1, len(tokenize(text)))

    # birleştir/temizle
    clean_spans = merge_overlaps(agg_spans)

    # stabil skorlar
    scores = {
        "violence": stable_score(v_count, total_tokens),
        "fear":     stable_score(f_count, total_tokens),
        "profanity":stable_score(p_count, total_tokens),
        "sexual":   stable_score(s_count, total_tokens),
    }
    return scores, clean_spans

# ==== Endpoints ====
@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "analyzer"}), 200

@app.post("/analyze")
def analyze():
    """
    Desteklenen istekler:
      1) multipart/form-data  → file=@sample.srt  (Gün 6: boyut sınırı, latency ölçümü)
      2) application/json     → {"text":"..."}
    Şema:
      {
        "scores": {"violence":0..10,"fear":0..10,"profanity":0..10,"sexual":0..10},
        "risk_spans":[{"start":sec,"end":sec,"type":"...","score":int}],
        "latency_ms": float
      }
    """
    t0 = time.perf_counter()

    # 1) SRT upload
    if "file" in request.files:
        f = request.files["file"]
        raw = f.read()
        if len(raw) > MAX_UPLOAD_BYTES:
            return jsonify({"error": "file too large", "limit_bytes": MAX_UPLOAD_BYTES}), 413
        content = raw.decode("utf-8", errors="ignore")

        scores, spans = analyze_srt_file_text(content)
        elapsed = round((time.perf_counter() - t0) * 1000.0, 2)
        return jsonify({"scores": scores, "risk_spans": spans, "latency_ms": elapsed}), 200

    # 2) JSON body (plain text)
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    scores, spans = analyze_plain_text(text)

    elapsed = round((time.perf_counter() - t0) * 1000.0, 2)
    return jsonify({"scores": scores, "risk_spans": spans, "latency_ms": elapsed}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
