export const ACCENT = {
  default: { tile: "bg-accent-600/10 text-accent-700 ring-accent-600/15", text: "text-accent-700", dot: "bg-accent-600/15 text-accent-700", hex: "#2cc0b0" },
  blue: { tile: "bg-blue-50 text-blue-600 ring-blue-100", text: "text-blue-600", dot: "bg-blue-100 text-blue-600", hex: "#3b82f6" },
  cyan: { tile: "bg-cyan-50 text-cyan-600 ring-cyan-100", text: "text-cyan-600", dot: "bg-cyan-100 text-cyan-600", hex: "#22d3ee" },
  green: { tile: "bg-green-50 text-green-600 ring-green-100", text: "text-green-600", dot: "bg-green-100 text-green-600", hex: "#22c55e" },
  amber: { tile: "bg-amber-50 text-amber-600 ring-amber-100", text: "text-amber-600", dot: "bg-amber-100 text-amber-600", hex: "#f59e0b" },
} as const;
export type Accent = keyof typeof ACCENT;
