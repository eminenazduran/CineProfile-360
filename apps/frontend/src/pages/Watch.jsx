import { useRef, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";

/**
 * Watch page — timeline stub (risk işaretleri tıklanınca videoda ilgili saniyeye atlar)
 * - riskSpans: [{ start, end, type }]
 * - totalDuration: saniye cinsinden toplam süre (yoksa 120s varsayılan)
 */
export default function Watch({
  // Test için tarayıcı-dostu video. İstersen "/sample_h264.mp4" gibi yerel bir dosya da verebilirsin.
  src = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
  riskSpans = null,
  totalDuration = 120,
}) {
  // Örnek risk span'ları (ekip JSON’undan gelecek)
  const demoSpans = [
    { start: 10, end: 20, type: "violence" },
    { start: 42, end: 45, type: "fear" },
    { start: 78, end: 80, type: "violence" },
  ];
  const spans = riskSpans ?? demoSpans;

  const playerRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [hoverLeft, setHoverLeft] = useState(0);

  const colorClass = (t) =>
    t === "violence"
      ? "bg-red-500 focus:ring-red-400"
      : t === "fear"
      ? "bg-yellow-500 focus:ring-yellow-400"
      : "bg-purple-400 focus:ring-purple-400";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">İzleme</h1>

      {/* Video */}
      <VideoPlayer ref={playerRef} src={src} />

      {/* Timeline Stub (ileride risk işaretleri eklenecek) */}
      <div className="mt-6 p-4 bg-gray-900 rounded-lg text-gray-400">
        <div className="text-sm mb-2">Zaman çizelgesi (risk işaretleri için yer tutucu)</div>

        <div className="relative h-3 w-full bg-gray-800 rounded-full overflow-hidden">
          {spans.map((s, i) => {
            const leftPct = Math.min(100, Math.max(0, (s.start / totalDuration) * 100));

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
                onClick={() => playerRef.current?.seekTo(s.start)}
                className={`absolute -translate-x-1/2 top-0 h-3 w-1 ${colorClass(
                  s.type
                )} focus:outline-none focus:ring-2 focus:ring-offset-1`}
                title={`${s.type} — ${s.start}s`}
              />
            );
          })}

          {/* Hover bilgisi (işaretin üstünde) */}
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
