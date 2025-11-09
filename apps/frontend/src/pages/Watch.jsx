import { useMemo, useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";

export default function Watch() {
  const { state } = useLocation() || {};
  const src = state?.src || "/test.mp4";
  const fallbackSpans = [
    { start: 10, end: 20, type: "violence" },
    { start: 42, end: 45, type: "fear" },
    { start: 78, end: 80, type: "violence" },
  ];
  const riskSpans = state?.riskSpans || fallbackSpans;
  const totalDuration = state?.totalDuration || 120;

  const spans = useMemo(() => riskSpans ?? [], [riskSpans]);

  const playerRef = useRef(null);
  const [now, setNow] = useState(0);
  const [autoSkip, setAutoSkip] = useState(false);
  const [dim, setDim] = useState(false);
  const [vol, setVol] = useState(1);

  // Türev değerler – state değil (sonsuz döngüye sebep olmaz)
  const active = useMemo(
    () => spans.find((s) => now >= s.start && now <= s.end) || null,
    [now, spans]
  );
  const upcoming = useMemo(
    () =>
      spans
        .filter((s) => s.start - now <= 10 && s.start - now > 0)
        .sort((a, b) => a.start - b.start)[0] || null,
    [now, spans]
  );
  const startsIn = upcoming ? Math.ceil(upcoming.start - now) : null;

  // Sadece seek yapar; setState yok → döngü yok
  useEffect(() => {
    if (autoSkip && upcoming && upcoming.start - now <= 0.25) {
      playerRef.current?.seekTo(upcoming.end + 0.5);
    }
  }, [autoSkip, upcoming, now]);

  // Aktif riskten çıkınca görsel/vol resetle
  useEffect(() => {
    if (!active) {
      setDim(false);
      setVol(1);
    }
  }, [active]);

  const colorClass = (t) =>
    t === "violence" ? "bg-red-500"
      : t === "fear" ? "bg-yellow-500"
      : "bg-purple-400";

  const handleSkip = () => {
    const t = upcoming || active;
    if (!t) return;
    playerRef.current?.seekTo(t.end + 0.5);
  };
  const handleLowerVolume = () => {
    if (!(upcoming || active)) return;
    setVol(0.3);
  };
  const handleDim = () => {
    if (!(upcoming || active)) return;
    setDim(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">İzleme</h1>

      {/* Uyarı kutusu: state set etmiyor, sadece türev gösteriyor */}
      {upcoming && !autoSkip && (
        <div className="rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 px-4 py-3 flex items-center gap-3">
          ⚠️ <b className="mr-2">{upcoming.type}</b> sahnesi <b>{startsIn} sn</b> içinde
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={handleSkip} className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white">Atla</button>
            <button onClick={handleLowerVolume} className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600">Sesi Kıs</button>
            <button onClick={handleDim} className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600">Karart</button>
            <label className="ml-3 text-sm flex items-center gap-2">
              <input type="checkbox" checked={autoSkip} onChange={(e) => setAutoSkip(e.target.checked)} />
              Otomatik atla
            </label>
          </div>
        </div>
      )}

      <VideoPlayer
        ref={playerRef}
        src={src}
        onTime={setNow}
        volume={vol}
        dim={dim}
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
                style={{ left: `${leftPct}%` }}
                onClick={() => playerRef.current?.seekTo?.(s.start)}
                className={`absolute -translate-x-1/2 top-0 h-3 w-1 ${colorClass(s.type)} focus:outline-none`}
                title={`${s.type} — ${s.start}s`}
                aria-label={`${s.type} risk – ${s.start}s`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
