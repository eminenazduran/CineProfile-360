import VideoPlayer from "../components/VideoPlayer";

export default function Watch() {
  return (
    <div className="relative">
      {/* Sağ üst mock uyarı */}
      <div className="absolute right-4 top-4 z-10 rounded-xl border border-yellow-500/50 bg-yellow-500/15 px-3 py-1 text-yellow-300">
        ⚠️ Korku sahnesi 10 sn içinde (mock)
      </div>

      {/* Video alanı */}
      <VideoPlayer src="" />
      {/* İstersen bir mp4 yolu ver: src="/sample.mp4" */}
    </div>
  );
}
