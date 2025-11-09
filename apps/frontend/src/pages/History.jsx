import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  // örnek veri
  useEffect(() => {
    setItems([
      { title: "Sample.mp4", date: "2025-11-08 14:02", risk: 4.7 },
      { title: "Trailer-01", date: "2025-11-07 19:30", risk: 3.2 },
      { title: "Episode S01E1", date: "2025-11-06 21:10", risk: 6.1 },
    ]);
  }, []);

  // 🔹 "Tekrar İzle" butonu tıklanınca Watch sayfasına yönlendir
  function handleReplay(item) {
    navigate("/watch", {
      state: {
        src: "/test.mp4", // istersen item.title’a göre değiştirebilirsin
        riskSpans: [
          { start: 10, end: 20, type: "violence" },
          { start: 40, end: 50, type: "fear" },
        ],
        scores: { violence: item.risk, fear: 5, jumpscare: 0 },
        totalDuration: 120,
      },
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Analiz Geçmişi</h1>
      <table className="w-full text-gray-200 border border-gray-800 rounded-lg overflow-hidden">
        <thead className="bg-gray-800 text-gray-400 text-sm">
          <tr>
            <th className="px-4 py-2 text-left">🎞️ Film Adı</th>
            <th className="px-4 py-2 text-left">🕒 Tarih</th>
            <th className="px-4 py-2 text-left">💥 Ort. Risk</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-t border-gray-800 hover:bg-gray-900/40">
              <td className="px-4 py-2">{item.title}</td>
              <td className="px-4 py-2">{item.date}</td>
              <td className="px-4 py-2">{item.risk}</td>
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => handleReplay(item)}
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-sm"
                >
                  Tekrar İzle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
