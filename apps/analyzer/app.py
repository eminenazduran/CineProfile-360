from flask import Flask, request, jsonify
from flask_cors import CORS
import os, re
from typing import Dict, List, Tuple

PORT = int(os.getenv("PORT", 5001))

app = Flask(__name__)
CORS(app)

# =========================
#  Gün 5 – Kurallar / Desenler
# =========================
# Not: violence ve fear varolan alanlarla geriye uyumluluk için zorunlu.
# Diğer kategoriler (profanity, sexual) opsiyoneldir – tüketen servis yoksayabilir.
CATEGORY_PATTERNS: Dict[str, re.Pattern] = {
    # EN + TR basit kökler (kısa listeler, MVP amaçlı)
    "violence": re.compile(
        r"\b(blood|kill|gun|knife|shoot|attack|stab|punch|dead|death|murder|violence|kan|öldür|silah|bıçak|vur|saldır|ölü(m)?)\b",
        re.IGNORECASE,
    ),
    "fear": re.compile(
        r"\b(scream|terror|horror|scare|panic|fear|cry|çığlık|korku|dehşet|panik)\b",
        re.IGNORECASE,
    ),
    # Ek kategoriler (opsiyonel)
    "profanity": re.compile(
        r"\b(damn|hell|shit|fuck|lanet|kahrol|siktir|bok)\b",
        re.IGNORECASE,
    ),
    "sexual": re.compile(
        r"\b(sex|sexual|kiss|nude|naked|öper|öpücük|çıplak|seks)\b",
        re.IGNORECASE,
    ),
}

# Tokenizer (TR karakter desteği)
TOKENIZER = re.compile(r"[A-Za-z0-9çğıöşüÇĞİÖŞÜ']+")

# =========================
#  Yardımcılar (Gün 5)
# =========================
def tokenize(text: str) -> List[Tuple[str, int]]:
    return [(m.group(), m.start()) for m in TOKENIZER.finditer(text or "")]

def bucket_seconds(word_index: int, bucket_size_words: int = 10, bucket_seconds_val: int = 10) -> Tuple[int, int]:
    """
    Kelime indeksine göre zaman dilimi: 10 kelime ≈ 10 sn (MVP kabulu).
    """
    bucket = word_index // bucket_size_words
    start_sec = bucket * bucket_seconds_val
    end_sec = start_sec + bucket_seconds_val
    return start_sec, end_sec

def count_matches(text: str) -> Dict[str, int]:
    """
    Tüm kategoriler için metindeki eşleşme sayıları (ham frekans).
    """
    txt = text or ""
    return {cat: len(p.findall(txt)) for cat, p in CATEGORY_PATTERNS.items()}

def normalize_score(count: int, factor: float = 2.0, cap: int = 10) -> int:
    """
    Ham frekansı 0–10 aralığına basitçe ölçekle (MVP).
    """
    return min(cap, int(round(count * factor)))

def add_spans_by_words(plain: str, tokens: List[Tuple[str, int]]) -> List[Dict]:
    """
    Serbest metinde eşleşen kelimeleri bul, 10 kelime ≈ 10 sn kovalarına düşürüp span üret.
    Her eşleşme 1 puan, aynı kovada birden fazla eşleşme varsa skor artar (min 10).
    """
    spans: List[Dict] = []
    word_offsets = [off for (_, off) in tokens]  # kelime başlangıç ofsetleri

    # Kovada kategori başına toplayarak biraz daha makul skor çıkar
    bucket_cat_counter: Dict[Tuple[int, str], int] = {}

    for cat, pattern in CATEGORY_PATTERNS.items():
        for m in pattern.finditer(plain):
            off = m.start()
            idx = 0
            while idx + 1 < len(word_offsets) and word_offsets[idx + 1] <= off:
                idx += 1
            st, en = bucket_seconds(idx)
            bucket_key = (st, cat)
            bucket_cat_counter[bucket_key] = bucket_cat_counter.get(bucket_key, 0) + 1

    # Kovalanmış sonuçları risk_spans olarak üret
    for (st, cat), c in bucket_cat_counter.items():
        spans.append({
            "start": st,
            "end": st + 10,
            "type": cat,
            "score": min(10, c)  # aynı kovada kaç kez geçtiğine göre basit skor
        })

    # Zaman sırasına göre
    spans.sort(key=lambda x: (x["start"], x["type"]))
    return spans

# =========================
#  Analizciler
# =========================
def analyze_plain_text(text: str) -> Tuple[Dict[str, int], List[Dict]]:
    """
    Serbest metin için kategori skorları + risk_spans üretir.
    - skorlar: tüm kategoriler (violence/fear + opsiyoneller)
    - spans: kovaya düşen uyarılar
    """
    tokens = tokenize(text or "")
    plain = text or ""

    raw_counts = count_matches(plain)
    scores_all = {cat: normalize_score(cnt) for cat, cnt in raw_counts.items()}

    spans = add_spans_by_words(plain, tokens)

    # Geriye uyumluluk: violence/fear anahtarları düz seviyede de olsun
    scores = {
        "violence": scores_all.get("violence", 0),
        "fear": scores_all.get("fear", 0),
    }
    # Ek kategorileri toplam "scores_all" içinde ayrıca döndürüyoruz (tüketen yok sayabilir)
    scores["__all__"] = scores_all

    return scores, spans

# ---- Tek satır SRT (Gün 2 uyumu) ----
def parse_srt_line(srt_line: str) -> Tuple[int, int, str]:
    m = re.match(
        r"\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*(.*)$",
        (srt_line or "").strip()
    )
    if not m:
        return 0, 10, (srt_line or "")
    h1, m1, s1, ms1, h2, m2, s2, ms2, text = m.groups()
    start = int(h1)*3600 + int(m1)*60 + int(s1)
    end   = int(h2)*3600 + int(m2)*60 + int(s2)
    if end <= start:
        end = start + 10
    return start, end, text

def analyze_srt_line(srt_line: str) -> Tuple[Dict[str, int], List[Dict]]:
    start, end, text = parse_srt_line(srt_line)
    scores, spans = analyze_plain_text(text)
    # Kovalanmış spans varsa blok zamanına sabitle
    block_spans: List[Dict] = []
    for sp in spans:
        block_spans.append({
            "start": start,
            "end": end,
            "type": sp["type"],
            "score": sp.get("score", 1)
        })
    return scores, block_spans

# ---- Çok satırlı SRT (Gün 3+) ----
def parse_srt_blocks(srt_text: str) -> List[Tuple[int, int, str]]:
    """
    SRT blokları:
      index
      HH:MM:SS,mmm --> HH:MM:SS,mmm
      (1+ metin satırı)
      boş satır
    """
    blocks: List[Tuple[int, int, str]] = []
    lines = (srt_text or "").splitlines()
    i = 0
    time_re = re.compile(r"^\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})")
    while i < len(lines):
        # indeks satırı (sadece sayı) ise atla
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

        text_lines: List[str] = []
        while i < len(lines) and lines[i].strip() != "":
            text_lines.append(lines[i]); i += 1
        text = " ".join(text_lines).strip()
        blocks.append((start, end, text))

        while i < len(lines) and lines[i].strip() == "":
            i += 1
    return blocks

def analyze_srt_file_text(srt_text: str) -> Tuple[Dict[str, int], List[Dict]]:
    """
    Tüm .srt dosyasını blok blok analiz et:
      - blok içi kategori frekanslarından span üret
      - toplam kategori skorları normalize edilerek üst seviyeye yazılır
    """
    blocks = parse_srt_blocks(srt_text)

    # toplam sayımlar (ham)
    totals_raw = {cat: 0 for cat in CATEGORY_PATTERNS.keys()}
    spans: List[Dict] = []

    for start, end, text in blocks:
        raw_counts = count_matches(text)
        # toplam ham sayıları biriktir
        for cat, cnt in raw_counts.items():
            totals_raw[cat] += cnt

        # Blok içi span puanları – o bloktaki her kategori için ham sayıyı skor olarak yaz
        for cat, cnt in raw_counts.items():
            if cnt > 0:
                spans.append({
                    "start": start,
                    "end": end,
                    "type": cat,
                    "score": min(10, cnt)  # blok içi yoğunluğa göre basit skor
                })

    # normalize toplam skorlar
    scores_all = {cat: normalize_score(cnt) for cat, cnt in totals_raw.items()}
    # geriye uyum alanlar
    scores = {
        "violence": scores_all.get("violence", 0),
        "fear": scores_all.get("fear", 0),
    }
    scores["__all__"] = scores_all

    # zaman sırasına diz
    spans.sort(key=lambda x: (x["start"], x["type"]))
    return scores, spans

# =========================
#  Endpoint'ler
# =========================
@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "analyzer"}), 200

@app.post("/analyze")
def analyze():
    """
    Desteklenen istek tipleri:
      1) multipart/form-data       → file=@sample.srt
      2) application/json          → {"text":"..."}  veya {"srt_line":"00:00:10,000 --> 00:00:20,000 hello blood"}

    Dönen şema (MVP):
    {
      "violence": int,                 # geriye uyum
      "fear": int,                     # geriye uyum
      "scores": { ... tüm kategoriler },
      "risk_spans": [
         {"start":sec, "end":sec, "type":"violence|fear|...", "score":int}
      ]
    }
    """
    # 1) .srt dosyası
    if "file" in request.files:
        f = request.files["file"]
        content = f.read().decode("utf-8", errors="ignore")
        scores, spans = analyze_srt_file_text(content)
        payload = {
            "violence": scores.get("violence", 0),
            "fear": scores.get("fear", 0),
            "scores": scores.get("__all__", {}),
            "risk_spans": spans
        }
        return jsonify(payload), 200

    # 2) JSON body
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    srt_line = data.get("srt_line")

    if srt_line:
        scores, spans = analyze_srt_line(srt_line)
    else:
        scores, spans = analyze_plain_text(text or "")

    payload = {
        "violence": scores.get("violence", 0),
        "fear": scores.get("fear", 0),
        "scores": scores.get("__all__", {}),
        "risk_spans": spans
    }
    return jsonify(payload), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
