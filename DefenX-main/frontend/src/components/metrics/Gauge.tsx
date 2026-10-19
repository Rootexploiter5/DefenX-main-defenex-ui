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

/** Circular champagne-gold gauge with tactical dark glow. */
export function Gauge({ value, size = 84, stroke = 7, label, display, sub, warn, big }: Props) {
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  const color = warn ? ["#ff7a8a", "#ef4444"] : ["#FFE2A0", "#D9AD62"];

  return (
    <div 
      className="relative grid place-items-center" 
      style={{ width: size, height: size }}
      role="img" 
      aria-label={`${label ?? "Gauge"}: ${value === null ? "unavailable" : Math.round(pct) + " percent"}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={color[0]} />
            <stop offset="100%" stopColor={color[1]} />
          </linearGradient>
        </defs>
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={r} 
          fill="none" 
          stroke="rgba(217, 173, 98, 0.15)" 
          strokeWidth={stroke}
          strokeDasharray={value === null ? "3 6" : undefined} 
        />
        {value !== null && (
          <motion.circle 
            cx={size / 2} 
            cy={size / 2} 
            r={r} 
            fill="none" 
            stroke={`url(#${id})`} 
            strokeWidth={stroke}
            strokeLinecap="round" 
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }} 
            animate={{ strokeDashoffset: c * (1 - pct / 100) }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ filter: warn ? "drop-shadow(0 0 6px rgba(239,68,68,0.7))" : "drop-shadow(0 0 6px rgba(217,173,98,0.6))" }} 
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center leading-tight">
        {label && <span className={big ? "hidden" : "font-mono text-[9.5px] uppercase tracking-wider text-[#a7a3ad]"}>{label}</span>}
        <span className={`${big ? "text-3xl font-mono tracking-tight" : "text-sm font-mono"} font-bold text-[#f8f5f0]`}>
          {display ?? (value === null ? "N/A" : `${Math.round(pct)}%`)}
        </span>
        {sub && <span className="font-mono text-[10px] text-[#ffe2a0] tracking-wide">{sub}</span>}
      </div>
    </div>
  );
}
