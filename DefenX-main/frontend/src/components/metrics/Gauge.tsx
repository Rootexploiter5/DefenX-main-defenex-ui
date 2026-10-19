import { motion } from "framer-motion";
import { useId } from "react";

interface Props {
  value: number | null;     // 0..100 or null when unavailable
  size?: number;
  stroke?: number;
  label?: string;
  display?: string;         // overrides the text under/inside
  sub?: string;
  warn?: boolean;           // red accent
  big?: boolean;
}

/** Circular champagne-gold gauge. Shows an explicit "N/A" ring when value is null. */
export function Gauge({ value, size = 84, stroke = 7, label, display, sub, warn, big }: Props) {
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  const color = warn ? ["#FF8A98", "#D9233D"] : ["#FFE2A0", "#B98746"];
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}
      role="img" aria-label={`${label ?? "Gauge"}: ${value === null ? "unavailable" : Math.round(pct) + " percent"}`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={color[0]} /><stop offset="1" stopColor={color[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(152,102,45,.18)" strokeWidth={stroke}
          strokeDasharray={value === null ? "3 6" : undefined} />
        {value !== null && (
          <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c}
            initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ filter: "drop-shadow(0 0 4px rgba(217,173,98,.6))" }} />
        )}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center leading-tight">
        {label && <span className={big ? "hidden" : "text-[10px]"} style={{ color: "var(--ink-soft)" }}>{label}</span>}
        <span className={`${big ? "text-4xl" : "text-base"} font-semibold`} style={{ color: "var(--ink)" }}>
          {display ?? (value === null ? "N/A" : `${Math.round(pct)}%`)}
        </span>
        {sub && <span className="text-xs" style={{ color: "var(--ink-soft)" }}>{sub}</span>}
      </div>
    </div>
  );
}
