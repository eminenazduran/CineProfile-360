from flask import Flask, request, jsonify
from flask_cors import CORS
import os, re

PORT = int(os.getenv("PORT", 5001))

app = Flask(__name__)
CORS(app)

# --- Kurallar ---
VIOLENCE_WORDS = re.compile(r"\b(blood|kill|gun)s?\b", re.IGNORECASE)
FEAR_WORDS     = re.compile(r"\b(scream)s?\b", re.IGNORECASE)
TOKENIZER      = re.compile(r"[A-Za-z0-9çğıöşüÇĞİÖŞÜ']+")

def tokenize(text: str):
    return [(m.group(), m.start()) for m in TOKENIZER.finditer(text or "")]

def bucket_seconds(word_index: int, bucket_size_words: int = 10, bucket_seconds: int = 10):
    bucket = word_index // bucket_size_words
    start_sec = bucket * bucket_seconds
    end_sec = start_sec + bucket_seconds
    return start_sec, end_sec

def analyze_plain_text(text: str):
    tokens = tokenize(text or "")
    plain = text or ""
    spans = []
    word_offsets = [off for (_, off) in tokens]

    def add_spans(pattern, span_type):
        for m in pattern.finditer(plain):
            off = m.start()
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

@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "analyzer"}), 200

@app.post("/analyze")
def analyze():
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
