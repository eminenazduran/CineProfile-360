import { useEffect, useState } from "react";

const LS_KEY = "cp360_policies_v1";

export default function Settings() {
  // Varsayılan eşikler (0–10)
  const [violence, setViolence] = useState(5);
  const [fear, setFear] = useState(5);
  const [jumpscare, setJumpscare] = useState(5);
  const [saved, setSaved] = useState(false);

  // İlk açılışta localStorage'dan yükle
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.violence === "number") setViolence(p.violence);
        if (typeof p.fear === "number") setFear(p.fear);
        if (typeof p.jumpscare === "number") setJumpscare(p.jumpscare);
      }
    } catch (_) {}
  }, []);

  // Kaydet → localStorage
  function handleSave() {
    const data = { violence, fear, jumpscare, ts: Date.now() };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      alert("Kaydedilemedi: " + e.message);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Ayarlar</h1>

      <Row
        label="Violence eşik"
        value={violence}
        onChange={(v) => setViolence(v)}
      />
      <Row label="Fear eşik" value={fear} onChange={(v) => setFear(v)} />
      <Row
        label="Jumpscare eşik"
        value={jumpscare}
        onChange={(v) => setJumpscare(v)}
      />

      <button
        onClick={handleSave}
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500"
      >
        Kaydet
      </button>

      {saved && (
        <div className="text-emerald-400 text-sm select-none">Kaydedildi ✅</div>
      )}

      <p className="text-xs text-gray-400">
        Bu eşikler şimdilik tarayıcında <code>localStorage</code>’a kaydedilir.
        Backend’e bağlamak istediğinde, bu değerleri <code>/api/policies/me</code>
        ile okuyup yazabilirsin.
      </p>
    </div>
  );
}

function Row({ label, value, onChange }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-sm text-gray-400">{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full"
      />
    </div>
  );
}
