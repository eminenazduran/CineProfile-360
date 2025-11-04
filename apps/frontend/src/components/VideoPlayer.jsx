// src/components/VideoPlayer.jsx
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";

const VideoPlayer = forwardRef(function VideoPlayer({ src, onTimeUpdate }, ref) {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [err, setErr] = useState(null);

  useImperativeHandle(ref, () => ({
    seekTo(seconds) {
      if (videoRef.current) {
        videoRef.current.currentTime = seconds;
        videoRef.current.play?.();
      }
    },
    // Overlay/uyarı hesabı için anlık zamanı dışarı ver
    currentTime() {
      return videoRef.current?.currentTime || 0;
    },
  }));

  return (
    <div className="bg-black rounded-2xl overflow-hidden border border-gray-800">
      <video
        ref={videoRef}
        className="w-full aspect-video"
        src={src || ""}
        // Test kolaylığı için:
        muted
        autoPlay={false}
        preload="metadata"
        crossOrigin="anonymous"
        controls
        onLoadedMetadata={() => setIsReady(true)}
        onLoadedData={() => setIsReady(true)}
        onTimeUpdate={(e) => onTimeUpdate?.(e.target.currentTime)}
        onError={(e) => {
          const m = e?.currentTarget?.error?.message || "Video yüklenemedi";
          setErr(m);
        }}
      />
      <div className="p-3 text-sm text-gray-400">
        {err ? `Hata: ${err}` : (isReady ? "Hazır" : "Video yükleniyor veya kaynak bekleniyor…")}
      </div>
    </div>
  );
});

export default VideoPlayer;
