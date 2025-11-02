import { useState } from "react";
import { Link } from "react-router-dom";
import { analyzeTest } from "../services/api";

export default function Home() {
  const [text, setText] = useState(
    "he saw a gun and started to scream"
  );
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const json = await analyzeTest(text); // /api/analyze-test çağrısı
      setResult(json);
    } catch (e) {
      setError(e.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold text-blue-400">
          Hoş geldin <span className="ml-2">👋</span>
        </h1>
        <div className="space-x-3 text-sm">
          <Link className="hover:underline" to="/">Anasayfa</Link>
          <Link className="hover:underline" to="/watch">İzleme</Link>
          <Link className="hover:underline" to="/settings">Ayarlar</Link>
        </div>
      </div>

      {/* Film/İçerik Analizi Kartı */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-2">Film/İçerik Analizi</h2>
        <p className="text-gray-400 mb-4">
          Metni Analyzer’a gönderip skorları ve <code>risk_spans</code> sonuçlarını al.
        </p>

        <textarea
          className="w-full min-h-[120px] rounded-xl bg-gray-950 border border-gray-800 p-3 text-gray-100 outline-none focus:border-blue-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Analiz etmek istediğin metni gir…"
        />

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analiz ediliyor…" : "Analizi Test Et"}
          </button>

          <Link
            to="/watch"
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700"
          >
            İzleme
          </Link>
        </div>

        {/* Hata */}
        {error && (
          <div className="mt-4 text-red-400 text-sm">
            Analiz çağrısı hata verdi: {error}
          </div>
        )}

        {/* Sonuç JSON */}
        {result && (
          <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl bg-black/60 border border-gray-800 p-4 text-sm">
{JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
