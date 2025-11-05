import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const VideoPlayer = forwardRef(function VideoPlayer(
  { src, onTime, volume = 1, dim = false, dimLevel = 0.6 },
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

  useEffect(() => {
    if (!videoRef.current) return;
    const v = Math.max(0, Math.min(1, Number(volume)));
    videoRef.current.muted = false;
    try { videoRef.current.volume = v; } catch (_) {}
  }, [volume]);

  const onTimeUpdate = (e) => onTime?.(e.currentTarget.currentTime);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-800">
      {/* Karartma overlay */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-150"
        style={{ background: "#000", opacity: dim ? Math.max(0, Math.min(1, dimLevel)) : 0 }}
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
        onError={(e) => setErr(e?.currentTarget?.error?.message || "Video yüklenemedi")}
      />
      <div className="relative z-10 p-3 text-sm text-gray-300 bg-black/40">
        {err ? `Hata: ${err}` : ready ? "Hazır" : "Video yükleniyor…"}
      </div>
    </div>
  );
});

export default VideoPlayer;
