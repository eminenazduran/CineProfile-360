import { useRef, useState } from 'react'

export default function VideoPlayer({ src }) {
  const videoRef = useRef(null)
  const [isReady, setIsReady] = useState(false)

  return (
    <div className="bg-black rounded-2xl overflow-hidden border border-gray-800">
      <video
        ref={videoRef}
        className="w-full aspect-video"
        src={src || ''}
        controls
        onCanPlay={() => setIsReady(true)}
      />
      <div className="p-3 text-sm text-gray-400">
        {isReady ? 'Hazır' : 'Video yükleniyor veya kaynak bekleniyor…'}
      </div>
    </div>
  )
}
