import { API_URL } from "../lib/config";
console.log("API_URL:", API_URL);
import VideoPlayer from '../components/VideoPlayer'

export default function Watch() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">İzleme</h1>
      <VideoPlayer src={null} />
    </section>
  )
}
