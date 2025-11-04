// src/services/api.js
import { API_URL } from "../lib/config";

/** Gün 3 — POST /api/analyze-test (JSON body) */
export async function analyzeTest(text) {
  const res = await fetch(`${API_URL}/api/analyze-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`analyzeTest failed (HTTP ${res.status}) ${msg}`);
  }
  return res.json();
}

/** Gün 4 — POST /api/analyze-srt-upload (multipart/form-data) */
export async function analyzeSrtUpload(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/analyze-srt-upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`analyzeSrtUpload failed (HTTP ${res.status}) ${msg}`);
  }
  return res.json();
}

// İstersen default obje de kalsın (isteğe bağlı)
export default { analyzeTest, analyzeSrtUpload };
