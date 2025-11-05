// apps/frontend/src/components/ScoresBar.jsx
import { riskColorClass, riskIcon } from "../lib/ui";

/**
 * scores: { violence: number, fear: number, jumpscare?: number }
 * 0..10 ölçeğinde beklenir.
 */
export default function ScoresBar({ scores = {} }) {
  const entries = Object.entries(scores).filter(([_, v]) => typeof v === "number");
  if (!entries.length) return null;

  return (
    <div className="space-y-3">
      {entries.map(([k, v]) => {
        const pct = Math.max(0, Math.min(10, v)) * 10; // 0..100
        return (
          <div key={k}>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2">
                <span>{riskIcon(k)}</span>
                <span className="capitalize">{k}</span>
              </div>
              <span className="text-gray-400">{v.toFixed(1)}/10</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-3 ${riskColorClass(k)} transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
