// src/pages/Watch.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";

export default function Watch() {
  const location = useLocation();
  const passed = location.state || {};

  // Varsayılanlar
  const src = passed.src || "/sample.mp4"; // public/sample.mp4 varsa
  const riskSpans =
    passed.riskSpans || [
      { start: 10, end: 20, type: "violence" },
      { start: 42, end: 45, type: "fear" },
      { start: 78, end: 80, type: "violence" },
    ];
  const totalDuration = passed.totalDuration || 120;

  const playerRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [hoverLeft, setHoverLeft] = useState(0);
  const [banner, setBanner] = useState(""); // mock uyarı yazısı

  const spans = useMemo(() => riskSpans ?? [], [riskSpans]);

  const colorClass = (t) =>
    t === "violence"
      ? "bg-red-500 focus:ring-red-400"
      : t === "fear"
      ? "bg-yellow-500 focus:ring-yellow-400"
      : "bg-purple-400 focus:ring-purple-400";

  // Mock overlay uyarısı: span başlangıcına 10 sn kala
  useEffect(() => {
    const id = setInterval(() => {
      const now = playerRef.current?.currentTime?.() ?? 0; // <— burada __videoEl yok
      const upcoming = spans.find(
        (s) => s.start - now <= 10 && s.start - now > 0
      );
      if (upcoming) {
        setBanner(
          `${upcoming.type} sahnesi ${Math.ceil(upcoming.start - now)} sn içinde`
        );
      } else {
        setBanner("");
      }
    }, 500);
    return () => clearInterval(id);
  }, [spans]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">İzleme</h1>

      {/* Üstte uyarı banner'ı */}
      {banner && (
        <div className="rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 px-4 py-2">
          ⚠️ {banner}
        </div>
      )}

      {/* Video */}
      <VideoPlayer ref={playerRef} src={src} />

      {/* Timeline */}
      <div className="mt-6 p-4 bg-gray-900 rounded-lg text-gray-400">
        <div className="text-sm mb-2">Zaman çizelgesi</div>

        <div className="relative h-3 w-full bg-gray-800 rounded-full overflow-hidden">
          {spans.map((s, i) => {
            const leftPct = Math.min(
              100,
              Math.max(0, (s.start / totalDuration) * 100)
            );
            return (
              <button
                key={i}
                type="button"
                aria-label={`${s.type} risk markeri: ${s.start}s`}
                style={{ left: `${leftPct}%` }}
                onMouseEnter={() => {
                  setHoverInfo(`${s.type} — ${s.start}s`);
                  setHoverLeft(leftPct);
                }}
                onMouseLeave={() => setHoverInfo(null)}
                onClick={() => playerRef.current?.seekTo?.(s.start)}
                className={`absolute -translate-x-1/2 top-0 h-3 w-1 ${colorClass(
                  s.type
                )} focus:outline-none focus:ring-2 focus:ring-offset-1`}
                title={`${s.type} — ${s.start}s`}
              />
            );
          })}

          {hoverInfo && (
            <div
              className="absolute -top-8 text-xs text-white bg-gray-700 px-2 py-1 rounded pointer-events-none"
              style={{ left: `${hoverLeft}%`, transform: "translateX(-50%)" }}
            >
              {hoverInfo}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
