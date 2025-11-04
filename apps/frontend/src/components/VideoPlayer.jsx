import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const VideoPlayer = forwardRef(function VideoPlayer(
  { src, onTime, volume = 1, dim = false },
  ref
) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");

  useImperativeHandle(ref, () => ({
    seekTo(s) {
      if (videoRef.current) {
        videoRef.current.currentTime = s;
        videoRef.current.play?.();
      }
    },
    currentTime() {
      return videoRef.current?.currentTime || 0;
    },
    get __videoEl() {
      return videoRef.current || null;
    },
  }));

  // 🔊 Ses uygula (0..1)
  useEffect(() => {
    if (!videoRef.current) return;
    const v = Math.max(0, Math.min(1, Number(volume)));
    // tarayıcıda net etki için muted = false ve volume set
    videoRef.current.muted = false;
    try {
      videoRef.current.volume = v;
    } catch (_) {
      /* bazı embed’lerde izin yoksa sessiz geç */
    }
  }, [volume]);

  const onTimeUpdate = (e) => onTime?.(e.currentTarget.currentTime);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-800">
      {/* Karartma overlay (kesin görünür) */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-150`}
        style={{ background: "#000", opacity: dim ? 0.6 : 0 }}
      />
      <video
        ref={videoRef}
        className="w-full aspect-video"
        src={src || ""}
        controls
        preload="metadata"
        onLoadedMetadata={() => setReady(true)}
        onLoadedData={() => setReady(true)}
        onTimeUpdate={onTimeUpdate}
        onError={(e) => {
          const m = e?.currentTarget?.error?.message || "Video yüklenemedi";
          setErr(m);
        }}
      />
      <div className="relative z-10 p-3 text-sm text-gray-300 bg-black/40">
        {err ? `Hata: ${err}` : ready ? "Hazır" : "Video yükleniyor…"}
      </div>
    </div>
  );
});

export default VideoPlayer;
