import { useEffect, useState } from "react";
import { API_URL } from "../lib/config";

export default function Settings() {
  const [pol, setPol] = useState({ violence: 5, fear: 5, jumpscare: 5 });
  const [msg, setMsg] = useState("");

  // ilk yüklemede mevcut politikayı çek (varsa)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/policies/me`);
        if (!r.ok) throw new Error("no-endpoint");
        const j = await r.json();
        setPol({
          violence: j.violence ?? 5,
          fear: j.fear ?? 5,
          jumpscare: j.jumpscare ?? 5,
        });
      } catch {
        setMsg("Backend politikası henüz yok, yerel değerlerle çalışıyoruz.");
      }
    })();
  }, []);

  async function save() {
    setMsg("");
    try {
      const r = await fetch(`${API_URL}/api/policies/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pol),
      });
      if (!r.ok) throw new Error(await r.text());
      setMsg("Kaydedildi ✅");
    } catch (e) {
      setMsg("Kaydetme stub: Backend hazır değil (sorun değil).");
    }
  }

  const Row = ({ label, keyName }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-gray-400">{pol[keyName]}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={pol[keyName]}
        onChange={e => setPol(p => ({ ...p, [keyName]: Number(e.target.value) }))}
        className="w-full"
      />
    </div>
  );

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Ayarlar</h1>
      <Row label="Violence eşik" keyName="violence" />
      <Row label="Fear eşik" keyName="fear" />
      <Row label="Jumpscare eşik" keyName="jumpscare" />
      <button onClick={save} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500">
        Kaydet
      </button>
      {msg && <div className="text-sm text-gray-400">{msg}</div>}
    </div>
  );
}
