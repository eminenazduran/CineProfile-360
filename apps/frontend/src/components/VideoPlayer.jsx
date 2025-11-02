// src/components/VideoPlayer.jsx
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";

const VideoPlayer = forwardRef(function VideoPlayer({ src }, ref) {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [err, setErr] = useState(null);

  useImperativeHandle(ref, () => ({
    seekTo(seconds) {
      if (videoRef.current) {
        videoRef.current.currentTime = seconds;
        videoRef.current.play();
      }
    },
  }));

  return (
    <div className="bg-black rounded-2xl overflow-hidden border border-gray-800">
      <video
        ref={videoRef}
        className="w-full aspect-video"
        src={src || ""}
        // Test kolaylığı için (istersen kaldır): 
        muted
        autoPlay={false}
        preload="metadata"
        crossOrigin="anonymous"
        controls
        onLoadedMetadata={() => setIsReady(true)}
        onLoadedData={() => setIsReady(true)}
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
