from flask import Flask, request, jsonify
from flask_cors import CORS
import os, re

PORT = int(os.getenv("PORT", 5001))

app = Flask(__name__)
CORS(app)

# --- Kurallar / Desenler ---
VIOLENCE_WORDS = re.compile(r"\b(blood|kill|gun)s?\b", re.IGNORECASE)
FEAR_WORDS     = re.compile(r"\b(scream)s?\b", re.IGNORECASE)
TOKENIZER      = re.compile(r"[A-Za-z0-9çğıöşüÇĞİÖŞÜ']+")

def tokenize(text: str):
    return [(m.group(), m.start()) for m in TOKENIZER.finditer(text or "")]

def bucket_seconds(word_index: int, bucket_size_words: int = 10, bucket_seconds: int = 10):
    """Kelime indeksine göre 10 kelime ≈ 10 sn dilimi üret."""
    bucket = word_index // bucket_size_words
    start_sec = bucket * bucket_seconds
    end_sec = start_sec + bucket_seconds
    return start_sec, end_sec

def analyze_plain_text(text: str):
    """Serbest metin için skor ve risk_spans üret (10 kelime = 10 sn)."""
    tokens = tokenize(text or "")
    plain = text or ""
    spans = []
    word_offsets = [off for (_, off) in tokens]

    def add_spans(pattern, span_type):
        for m in pattern.finditer(plain):
            off = m.start()
            # küçük metinlerde lineer arama yeterli
            idx = 0
            while idx + 1 < len(word_offsets) and word_offsets[idx + 1] <= off:
                idx += 1
            s, e = bucket_seconds(idx)
            spans.append({"start": s, "end": e, "type": span_type})

    add_spans(VIOLENCE_WORDS, "violence")
    add_spans(FEAR_WORDS, "fear")

    violence_count = len(VIOLENCE_WORDS.findall(plain))
    fear_count     = len(FEAR_WORDS.findall(plain))

    scores = {
        "violence": min(10, violence_count * 2),
        "fear":     min(10, fear_count * 2),
    }
    return scores, spans

# --- Tek satır SRT desteği (Gün 2) ---
def parse_srt_line(srt_line: str):
    m = re.match(
        r"\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*(.*)$",
        (srt_line or "").strip()
    )
    if not m:
        return 0, 10, (srt_line or "")
    h1,m1,s1,ms1,h2,m2,s2,ms2,text = m.groups()
    start = int(h1)*3600 + int(m1)*60 + int(s1)
    end   = int(h2)*3600 + int(m2)*60 + int(s2)
    if end <= start: end = start + 10
    return start, end, text

def analyze_srt_line(srt_line: str):
    start, end, text = parse_srt_line(srt_line)
    scores, spans = analyze_plain_text(text)
    if spans:
        spans = [{"start": start, "end": end, "type": sp["type"]} for sp in spans]
    return scores, spans

# --- Çok satırlı SRT dosyası desteği (Gün 3) ---
def parse_srt_blocks(srt_text: str):
    """
    SRT bloklarını ayrıştır:
      index
      HH:MM:SS,mmm --> HH:MM:SS,mmm
      bir veya daha fazla metin satırı
      (boş satır)
    """
    blocks = []
    lines = (srt_text or "").splitlines()
    i = 0
    time_re = re.compile(r"^\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})")
    while i < len(lines):
        # index satırı (sayı) ise atla
        if lines[i].strip().isdigit():
            i += 1
        if i >= len(lines): break

        m = time_re.match(lines[i].strip())
        if not m:
            i += 1
            continue

        h1,m1,s1,ms1,h2,m2,s2,ms2 = m.groups()
        start = int(h1)*3600 + int(m1)*60 + int(s1)
        end   = int(h2)*3600 + int(m2)*60 + int(s2)
        i += 1

        text_lines = []
        while i < len(lines) and lines[i].strip() != "":
            text_lines.append(lines[i]); i += 1
        text = " ".join(text_lines).strip()
        blocks.append((start, end, text))

        # boş satır(lar)ı atla
        while i < len(lines) and lines[i].strip() == "":
            i += 1
    return blocks

def analyze_srt_file_text(srt_text: str):
    """Tüm .srt dosyasını satır satır analiz et, eşleşen her satırı kendi zaman aralığıyla işaretle."""
    blocks = parse_srt_blocks(srt_text)
    total_viol = 0
    total_fear = 0
    spans = []
    for start, end, text in blocks:
        scores, line_spans = analyze_plain_text(text)
        total_viol += scores["violence"]
        total_fear += scores["fear"]
        if line_spans:
            for sp in line_spans:
                spans.append({"start": start, "end": end, "type": sp["type"]})
    return {"violence": min(10, total_viol), "fear": min(10, total_fear)}, spans

# --- Endpoint'ler ---
@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "analyzer"}), 200

@app.post("/analyze")
def analyze():
    """
    Desteklenen istek tipleri:
    1) multipart/form-data       → file=@sample.srt
    2) application/json          → {"text":"..."}  veya {"srt_line":"00:00:10,000 --> 00:00:20,000 hello blood"}
    Dönen şema: {"violence":int,"fear":int,"risk_spans":[{"start":sec,"end":sec,"type":"fear|violence"}]}
    """
    # 1) .srt dosya upload'ı geldiyse önce bunu işle
    if "file" in request.files:
        f = request.files["file"]
        content = f.read().decode("utf-8", errors="ignore")
        scores, spans = analyze_srt_file_text(content)
        return jsonify({
            "violence": scores["violence"],
            "fear": scores["fear"],
            "risk_spans": spans
        }), 200

    # 2) JSON body
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    srt_line = data.get("srt_line")

    if srt_line:
        scores, spans = analyze_srt_line(srt_line)
    else:
        scores, spans = analyze_plain_text(text or "")

    return jsonify({
        "violence": scores["violence"],
        "fear": scores["fear"],
        "risk_spans": spans
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
