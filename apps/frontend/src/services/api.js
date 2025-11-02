import { API_URL } from "../lib/config";

// Backend: POST /api/analyze-test → Analyzer'dan gelen JSON'u aynen döndürür
export async function analyzeTest(text = "he saw a gun and started to scream") {
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

export default { analyzeTest };
