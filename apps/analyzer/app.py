from flask import Flask, request, jsonify
from flask_cors import CORS
import os, re, time, json, logging
from logging.handlers import TimedRotatingFileHandler

# --- Opsiyonel: S3'ye log upload için ---
import boto3
from botocore.exceptions import BotoCoreError, ClientError

# ====== Port/Env ======
PORT = int(os.getenv("PORT", 5001))
AWS_REGION = os.getenv("AWS_REGION", "eu-central-1")
S3_BUCKET = os.getenv("S3_BUCKET_NAME")
S3_PREFIX = os.getenv("S3_LOG_PREFIX", "logs/")

# ====== Flask ======
app = Flask(__name__)
CORS(app)

# ====== spaCy yükleme (TR/EN lemma) ======
SPACY_OK = True
try:
    import spacy
    try:
        nlp_tr = spacy.load("tr_core_news_sm")
    except Exception:
        nlp_tr = None
    try:
        nlp_en = spacy.load("en_core_web_sm")
    except Exception:
        nlp_en = None
except Exception:
    SPACY_OK = False
    nlp_tr = nlp_en = None

# ====== Log klasörü ve dosya ======
os.makedirs("logs", exist_ok=True)
logger = logging.getLogger("analyzer")
logger.setLevel(logging.INFO)
handler = TimedRotatingFileHandler("logs/analyzer.log", when="midnight", backupCount=7, encoding="utf-8")
fmt = logging.Formatter("%(asctime)s\tuser=%(user)s\telapsed_ms=%(elapsed_ms)s\ttokens=%(tokens)s\terror=%(error)s\tmsg=%(message)s")
handler.setFormatter(fmt)
logger.addHandler(handler)

def log_request(user_id: str, elapsed_ms: float, token_count: int, error: str = ""):
    # logging.LoggerAdapter ile extra alanlar yazalım
    adapter = logging.LoggerAdapter(logger, {"user": user_id, "elapsed_ms": f"{elapsed_ms:.2f}", "tokens": token_count, "error": error})
    adapter.info("analyze")

def upload_logs_to_s3():
    """Günün log dosyasını S3'e yollar (isteğe bağlı uçtan çağıracağız)."""
    if not S3_BUCKET:
        return {"uploaded": False, "reason": "S3 not configured"}
    s3 = boto3.client("s3", region_name=AWS_REGION)
    path = "logs/analyzer.log"
    key = f"{S3_PREFIX}analyzer.log"
    try:
        s3.upload_file(path, S3_BUCKET, key)
        return {"uploaded": True, "bucket": S3_BUCKET, "key": key}
    except (BotoCoreError, ClientError) as e:
        return {"uploaded": False, "error": str(e)}

# ====== Kurallar / Desenler (lemma + regex) ======
# Not: normalize_text() ile lemma uygulanacak, bu yüzden kök kelimelere odaklanıyoruz.
VIOLENCE_WORDS = re.compile(r"\b(blood|kill|gun|stab|knife|murder|silah|öldür|bıçak)\b", re.IGNORECASE)
FEAR_WORDS     = re.compile(r"\b(scream|fear|scare|scream(ed)?|çığlık|korku|kork)\b", re.IGNORECASE)
PROFANITY_WORDS= re.compile(r"\b(fuck|shit|lanet|kahrol)\b", re.IGNORECASE)
SEXUAL_WORDS   = re.compile(r"\b(sex|sexual|nude|porn|cinsel)\b", re.IGNORECASE)

TOKENIZER      = re.compile(r"[A-Za-z0-9çğıöşüÇĞİÖŞÜ']+")

# ====== Normalizasyon (TR/EN lemma + küçük harf) ======
def normalize_text(text: str) -> str:
    if not text:
        return ""
    t = text.strip()
    if not SPACY_OK or (nlp_tr is None and nlp_en is None):
        return t.lower()

    # basit dille seçim: latin harf yoğunluğu -> EN, Türkçe özel karakter -> TR
    has_tr = any(ch in "çğıöşüÇĞİÖŞÜ" for ch in t)
    doc = (nlp_tr if (has_tr and nlp_tr) else nlp_en if nlp_en else None)
    if not doc:
        return t.lower()
    lemmas = [tok.lemma_.lower() for tok in doc(t)]
    return " ".join(lemmas)

def tokenize(text: str):
    return [(m.group(), m.start()) for m in TOKENIZER.finditer(text or "")]

def bucket_seconds(word_index: int, bucket_size_words: int = 10, bucket_seconds: int = 10):
    bucket = word_index // bucket_size_words
    start_sec = bucket * bucket_seconds
    end_sec = start_sec + bucket_seconds
    return start_sec, end_sec

def score_categories(plain: str):
    """Kategori skorları 0–10 normalize."""
    def norm(c): return max(0, min(10, c * 2))
    return {
        "violence": norm(len(VIOLENCE_WORDS.findall(plain))),
        "fear":     norm(len(FEAR_WORDS.findall(plain))),
        "profanity":norm(len(PROFANITY_WORDS.findall(plain))),
        "sexual":   norm(len(SEXUAL_WORDS.findall(plain))),
    }

def analyze_plain_text(text: str):
    raw = text or ""
    normalized = normalize_text(raw)
    tokens = tokenize(normalized)
    word_offsets = [off for (_, off) in tokens]
    spans = []

    def add_spans(pattern, span_type):
        for m in pattern.finditer(normalized):
            off = m.start()
            idx = 0
            while idx + 1 < len(word_offsets) and word_offsets[idx + 1] <= off:
                idx += 1
            s, e = bucket_seconds(idx)
            # basit bir skor: eşleşme başına 1
            spans.append({"start": s, "end": e, "type": span_type, "score": 1})

    add_spans(VIOLENCE_WORDS, "violence")
    add_spans(FEAR_WORDS, "fear")
    add_spans(PROFANITY_WORDS, "profanity")
    add_spans(SEXUAL_WORDS, "sexual")

    scores = score_categories(normalized)
    return scores, spans, len(tokens)

# ---- SRT yardımcıları (çok satırlı) ----
def parse_srt_blocks(srt_text: str):
    blocks = []
    lines = (srt_text or "").splitlines()
    i = 0
    time_re = re.compile(r"^\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})")
    while i < len(lines):
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
        while i < len(lines) and lines[i].strip() == "":
            i += 1
    return blocks

def analyze_srt_file_text(srt_text: str):
    blocks = parse_srt_blocks(srt_text)
    spans = []
    agg = {"violence":0,"fear":0,"profanity":0,"sexual":0}
    total_tokens = 0

    for start, end, text in blocks:
        scores, line_spans, tok_count = analyze_plain_text(text)
        total_tokens += tok_count
        for k in agg: agg[k] += scores.get(k,0)
        for sp in line_spans:
            spans.append({"start": start, "end": end, "type": sp["type"], "score": sp["score"]})

    # normalize toplamları 0–10 bandına sık
    for k in agg:
        agg[k] = min(10, agg[k])
    return agg, spans, total_tokens

# ====== Endpoint'ler ======
@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "analyzer"}), 200

@app.post("/analyze")
def analyze():
    t0 = time.perf_counter()
    user_id = request.headers.get("X-User-Id", "local")
    error = ""
    token_count = 0
    try:
        if "file" in request.files:
            f = request.files["file"]
            content = f.read().decode("utf-8", errors="ignore")
            scores, spans, token_count = analyze_srt_file_text(content)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            log_request(user_id, elapsed_ms, token_count, error="")
            return jsonify({
                "latency_ms": round(elapsed_ms,2),
                "scores": scores,
                "risk_spans": spans
            }), 200

        data = request.get_json(silent=True) or {}
        text = data.get("text")
        srt_line = data.get("srt_line")
        if srt_line:
            # tek satır srt'yi blok gibi işle
            scores, spans, token_count = analyze_plain_text(srt_line)
        else:
            scores, spans, token_count = analyze_plain_text(text or "")

        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        log_request(user_id, elapsed_ms, token_count, error="")
        return jsonify({
            "latency_ms": round(elapsed_ms,2),
            "scores": scores,
            "risk_spans": spans
        }), 200
    except Exception as e:
        error = str(e)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        log_request(user_id, elapsed_ms, token_count, error=error)
        return jsonify({"error": error}), 500

@app.post("/admin/upload-logs")
def admin_upload_logs():
    """İsteğe bağlı S3'ye log yollama (test için)."""
    res = upload_logs_to_s3()
    code = 200 if res.get("uploaded") else 500
    return jsonify(res), code

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
