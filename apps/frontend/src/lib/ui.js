// apps/frontend/src/lib/ui.js
export const RISK_COLORS = {
  violence: "red",
  fear: "yellow",
  jumpscare: "purple",
  // fallback
  default: "gray",
};

export function riskColorClass(type, base = "bg") {
  const c = RISK_COLORS[type] || RISK_COLORS.default;
  return `${base}-${c}-500`;
}
export function riskRingClass(type) {
  const c = RISK_COLORS[type] || RISK_COLORS.default;
  return `focus:ring-${c}-400`;
}

export function riskIcon(type) {
  if (type === "violence") return "⚔️";
  if (type === "fear") return "😨";
  if (type === "jumpscare") return "😱";
  return "⚠️";
}
