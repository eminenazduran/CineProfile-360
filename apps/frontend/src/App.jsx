// src/App.jsx
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Watch from "./pages/Watch.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-4 py-3 flex gap-4">
        <Link to="/" className="hover:underline">Anasayfa</Link>
        <Link to="/watch" className="hover:underline">İzleme</Link>
        <Link to="/settings" className="hover:underline">Ayarlar</Link>
      </nav>

      <main className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/watch" element={<Watch />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
