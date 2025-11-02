from flask import Flask, request, jsonify
from flask_cors import CORS
import os

PORT = int(os.getenv("PORT", 5001))

app = Flask(__name__)
CORS(app)

@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "analyzer"}), 200

@app.post("/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    _ = data.get("text", "")
    return jsonify({
        "violence": 3,
        "fear": 5,
        "risk_spans": [{"start": 20, "end": 40, "type": "fear"}]
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
