import { useState } from "react";
import { Link } from "react-router-dom";
import { analyzeTest } from "../services/api";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleAnalyze() {
    try {
      setLoading(true);
      const data = await analyzeTest();
      console.log("analyzeTest →", data); // DoD: console'da JSON
      setResult(data);                     // ekranda da göster
    } catch (err) {
      console.error(err);
      alert("Analiz çağrısı hata verdi: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-400">Hoş geldin 👋</h1>

      <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-2">Film/İçerik Analizi</h2>
        <p className="text-sm text-gray-300 mb-4">
          Metni Analyzer'a gönderip skorları ve <code>risk_spans</code> sonuçlarını al.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="rounded-xl px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? "Analiz ediliyor..." : "Analizi Test Et"}
          </button>

          <Link
            to="/watch"
            className="rounded-xl px-4 py-2 border border-white/15 hover:bg-white/10"
          >
            İzleme
          </Link>
        </div>

        {result && (
          <pre className="mt-4 max-h-72 overflow-auto rounded-lg bg-black/40 p-3 text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
