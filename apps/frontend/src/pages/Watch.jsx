// apps/frontend/src/pages/Watch.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";
import { riskColorClass, riskRingClass } from "../lib/ui";

export default function Watch() {
  const location = useLocation();
  const passed = location.state || {};

  // Test videosu (public/test.mp4)
  const src = passed.src || "/test.mp4";

  // Örnek riskler (Analyzer’dan gelecekti)
  const riskSpans = passed.riskSpans || [
    { start: 10, end: 20, type: "violence" },
    { start: 42, end: 45, type: "fear" },
    { start: 78, end: 80, type: "violence" },
  ];
  const totalDuration = passed.totalDuration || 120;
  const spans = useMemo(() => riskSpans ?? [], [riskSpans]);

  const playerRef = useRef(null);
  const [now, setNow] = useState(0);

  // Ayar varsayılanlarını localStorage’tan al
  const defaultAutoSkip = JSON.parse(localStorage.getItem("cfg.autoSkip") || "false");
  const defaultDimLevel = parseFloat(localStorage.getItem("cfg.dimLevel") || "0.6");

  // Banner & durum
  const [autoSkip, setAutoSkip] = useState(defaultAutoSkip);
  const [upcoming, setUpcoming] = useState(null);
  const [active, setActive] = useState(null);

  // Efekt durumları
  const [dim, setDim] = useState(false);
  const [vol, setVol] = useState(1);
  const [dimUntil, setDimUntil] = useState(null);
  const [volUntil, setVolUntil] = useState(null);
  const [dimLevel] = useState(defaultDimLevel);

  const [showBanner, setShowBanner] = useState(false);

  const handleTime = (t) => setNow(t);

  // Zaman akışına göre durumları güncelle
  useEffect(() => {
    const cur = spans.find((s) => now >= s.start && now <= s.end) || null;
    setActive(cur);

    const up = spans
      .filter((s) => s.start - now <= 10 && s.start - now > 0)
      .sort((a, b) => a.start - b.start)[0] || null;
    setUpcoming(up);

    // otomatik atla: risk başlarken
    if (autoSkip && up && up.start - now <= 0.25) {
      playerRef.current?.seekTo(up.end + 0.5);
      setShowBanner(false);
      setUpcoming(null);
    } else {
      setShowBanner(!!up && !autoSkip);
    }

    // efektlerin bitişi
    if (dimUntil != null && now >= dimUntil) {
      setDim(false);
      setDimUntil(null);
    }
    if (volUntil != null && now >= volUntil) {
      setVol(1);
      setVolUntil(null);
    }
  }, [now, spans, autoSkip, dimUntil, volUntil]);

  // Aksiyonlar
  const handleSkip = () => {
    const target = upcoming || active;
    if (!target) return;
    playerRef.current?.seekTo(target.end + 0.5);
    setShowBanner(false);
  };

  const handleLowerVolume = () => {
    const target = upcoming || active;
    if (!target) return;
    setVol(0.3);
    setVolUntil(target.end + 0.01);
    setShowBanner(false);
  };

  const handleDim = () => {
    const target = upcoming || active;
    if (!target) return;
    setDim(true);
    setDimUntil(target.end + 0.01);
    setShowBanner(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">İzleme</h1>

      {/* Uyarı banner'ı */}
      {showBanner && upcoming && (
        <div className="rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 px-4 py-3 flex items-center gap-3">
          ⚠️ <b className="mr-2">{upcoming.type}</b> sahnesi{" "}
          <b>{Math.ceil(upcoming.start - now)} sn</b> içinde
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleSkip}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
            >
              Atla
            </button>
            <button
              onClick={handleLowerVolume}
              className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              Sesi Kıs
            </button>
            <button
              onClick={handleDim}
              className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              Karart
            </button>
            <label className="ml-3 text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoSkip}
                onChange={(e) => {
                  setAutoSkip(e.target.checked);
                  localStorage.setItem("cfg.autoSkip", JSON.stringify(e.target.checked));
                }}
              />
              Otomatik atla
            </label>
          </div>
        </div>
      )}

      {/* Video */}
      <VideoPlayer
        ref={playerRef}
        src={src}
        onTime={handleTime}
        volume={vol}
        dim={dim}
        dimLevel={dimLevel}
      />

      {/* Timeline */}
      <div className="mt-6 p-4 bg-gray-900 rounded-lg text-gray-400">
        <div className="text-sm mb-2">Zaman çizelgesi</div>
        <div className="relative h-3 w-full bg-gray-800 rounded-full overflow-hidden">
          {spans.map((s, i) => {
            const leftPct = Math.min(100, Math.max(0, (s.start / totalDuration) * 100));
            return (
              <button
                key={i}
                type="button"
                aria-label={`${s.type} risk markeri: ${s.start}s`}
                style={{ left: `${leftPct}%` }}
                onClick={() => playerRef.current?.seekTo?.(s.start)}
                className={`absolute -translate-x-1/2 top-0 h-3 w-1 ${riskColorClass(
                  s.type
                )} ${riskRingClass(s.type)} focus:outline-none`}
                title={`${s.type} — ${s.start}s`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
