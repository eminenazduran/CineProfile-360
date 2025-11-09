import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const VideoPlayer = forwardRef(function VideoPlayer({ src, onTime, volume = 1, dim = false }, ref) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const h = () => onTime?.(v.currentTime || 0);
    v.addEventListener("timeupdate", h);
    return () => v.removeEventListener("timeupdate", h);
  }, [onTime]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.volume = Math.max(0, Math.min(1, volume));
  }, [volume]);

  useEffect(() => {
    const host = videoRef.current?.parentElement;
    if (!host) return;
    host.style.filter = dim ? "brightness(60%)" : "none";
    return () => { host.style.filter = "none"; };
  }, [dim]);

  useImperativeHandle(ref, () => ({
    seekTo(s) {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.max(0, s || 0);
      v.play?.();
    },
    pause() { videoRef.current?.pause?.(); }
  }), []);

  return (
    <div className="bg-black rounded-2xl overflow-hidden border border-gray-800">
      <video
        ref={videoRef}
        className="w-full aspect-video"
        src={src || ""}
        preload="metadata"
        controls
        onLoadedMetadata={() => setReady(true)}
        onError={(e) => setErr(e?.currentTarget?.error?.message || "Video yüklenemedi")}
      />
      <div className="p-3 text-sm text-gray-400">
        {err ? `Hata: ${err}` : (ready ? "Hazır" : "Video yükleniyor…")}
      </div>
    </div>
  );
});

export default VideoPlayer;
