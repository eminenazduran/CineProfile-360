// apps/frontend/src/pages/Home.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { analyzeTest, analyzeSrtUpload } from "../services/api";
import ScoresBar from "../components/ScoresBar"; // ✅ Skor bar bileşeni eklendi

export default function Home() {
  const navigate = useNavigate();

  // metin analiz formu (gün 3)
  const [text, setText] = useState("he saw a gun and started to scream");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const json = await analyzeTest(text);
      setResult(json);
    } catch (e) {
      setError(e.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  // SRT upload (gün 4)
  const [file, setFile] = useState(null);
  const [srtResult, setSrtResult] = useState(null);
  const [srtErr, setSrtErr] = useState("");
  const [srtLoading, setSrtLoading] = useState(false);

  async function handleSrtAnalyze() {
    if (!file) return;
    setSrtLoading(true);
    setSrtErr("");
    setSrtResult(null);
    try {
      const json = await analyzeSrtUpload(file); // POST /api/analyze-srt-upload
      setSrtResult(json);
    } catch (e) {
      setSrtErr(e.message || "SRT analizi hata verdi");
    } finally {
      setSrtLoading(false);
    }
  }

  function goWatch() {
    if (!srtResult) return;
    navigate("/watch", {
      state: {
        src: "/test.mp4",              // public/ içine koyduğun dosya varsa
        riskSpans: srtResult.risk_spans, // analyzer’dan gelen
        scores: srtResult.scores || {},
        totalDuration: 120
      }
    });
  }

  return (
    <div className="space-y-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold text-blue-400">
          Hoş geldin <span className="ml-2">👋</span>
        </h1>
        <nav className="space-x-3 text-sm">
          <Link className="hover:underline" to="/">Anasayfa</Link>
          <Link className="hover:underline" to="/watch">İzleme</Link>
          <Link className="hover:underline" to="/settings">Ayarlar</Link>
        </nav>
      </header>

      {/* Gün 3 — Metin Analizi */}
      <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-2">Film/İçerik Analizi (Metin)</h2>
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

          <Link to="/watch" className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700">
            İzleme
          </Link>
        </div>

        {error && (
          <div className="mt-4 text-red-400 text-sm">
            Analiz çağrısı hata verdi: {error}
          </div>
        )}

        {/* ✅ Skor Barları (hem eski hem yeni şemayı destekler) */}
        {result && (
          <div className="mt-4">
            <ScoresBar
              scores={{
                violence: result.scores?.violence ?? result.violence ?? 0,
                fear: result.scores?.fear ?? result.fear ?? 0,
                jumpscare: result.scores?.jumpscare ?? result.jumpscare ?? 0,
              }}
            />
          </div>
        )}

        {/* JSON çıktısı */}
        {result && (
          <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl bg-black/60 border border-gray-800 p-4 text-sm">
{JSON.stringify(result, null, 2)}
          </pre>
        )}
      </section>

      {/* Gün 4 — SRT Dosyası Analizi */}
      <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <span>📝 SRT Dosyası Analizi</span>
        </h2>
        <p className="text-gray-400 mb-4">
          .srt dosyasını yükleyip Analyzer sonuçlarını al (scores + risk_spans). Ardından Watch sayfasında timeline/uyarıyı gör.
        </p>

        <div className="flex gap-3 items-center">
          <input
            type="file"
            accept=".srt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="file:mr-3 file:px-3 file:py-2 file:rounded-md file:bg-gray-800 file:border file:border-gray-700"
          />
          <button
            onClick={handleSrtAnalyze}
            disabled={!file || srtLoading}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
          >
            {srtLoading ? "Analiz ediliyor…" : "Analiz Et"}
          </button>
          <button
            onClick={goWatch}
            disabled={!srtResult}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
          >
            Watch’ta Gör
          </button>
        </div>

        {srtErr && <div className="mt-4 text-red-400 text-sm">{srtErr}</div>}

        {/* ✅ SRT skor barları */}
        {srtResult && (
          <div className="mt-4">
            <ScoresBar
              scores={{
                violence: srtResult.scores?.violence ?? srtResult.violence ?? 0,
                fear: srtResult.scores?.fear ?? srtResult.fear ?? 0,
                jumpscare: srtResult.scores?.jumpscare ?? srtResult.jumpscare ?? 0,
              }}
            />
          </div>
        )}

        {srtResult && (
          <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl bg-black/60 border border-gray-800 p-4 text-sm">
{JSON.stringify(srtResult, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}
