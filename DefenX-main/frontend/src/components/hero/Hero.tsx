import { motion } from "framer-motion";
import { Activity, Cpu, Laptop, ShieldCheck, type LucideIcon } from "lucide-react";
import { lazy, Suspense } from "react";
import { useStore } from "../../app/store";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { CommandPlatform } from "../command-center/CommandPlatform";
import { Mountains } from "./Mountains";

const HoloGlobe = lazy(() => import("./HoloGlobe"));

function MiniSparkline({ color, points }: { color: string; points: number[] }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const h = 14;
  const w = 44;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 2) - 1;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible opacity-85">
      <polyline fill="none" stroke={color} strokeWidth="1.6" points={coords} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FloatCard({ icon: Icon, value, label, pos, delay, color = "#d9ad62", iconBg = "bg-black/45" }: {
  icon: LucideIcon; value: string; label: string; pos: string; delay: number; color?: string; iconBg?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div 
      className={`glass-panel absolute z-10 flex min-w-[145px] items-center gap-3 rounded-2xl border border-[#d9ad62]/35 bg-black/40 px-3.5 py-2.5 shadow-[0_8px_25px_rgba(0,0,0,0.5)] backdrop-blur-md ${pos}`}
      animate={reduced ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 4.5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      role="group" 
      aria-label={`${label}: ${value}`}
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl border border-[#d9ad62]/30 ${iconBg} text-[#ffe2a0]`}>
        <Icon size={18} style={{ color }} />
      </span>
      <div className="leading-tight">
        <span className="block font-sans text-base font-bold text-[#ffffff]">{value}</span>
        <span className="block text-[10.5px] font-medium text-[#b5adaa]">{label}</span>
      </div>
    </motion.div>
  );
}

export function Hero() {
  const { summary, profile } = useStore();
  const reduced = useReducedMotion();
  const s = summary.data;

  return (
    <section aria-label="Security command center" className="hero-scene relative h-[500px] min-h-[460px] overflow-hidden rounded-[24px]">
      <Mountains />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,rgba(95,16,42,0.45),transparent_70%)]" />
      <Suspense fallback={null}><HoloGlobe animate={!reduced} /></Suspense>

      {/* Top Left Greeting */}
      <div className="absolute left-8 top-8 z-10">
        <p className="font-serif text-[30px] italic leading-tight text-[#f2deb8]">Welcome back,</p>
        <h1 className="font-serif text-[46px] font-bold leading-none tracking-tight text-[#ffffff]">
          Akhilesh
        </h1>
        <p className="mt-2.5 max-w-[270px] text-xs leading-relaxed text-[#c7bcba]">
          Your personal AI-powered device security command center
        </p>
      </div>

      {/* Top Right Quote */}
      <div className="absolute right-8 top-8 z-10 text-right font-serif text-[18px] italic leading-snug text-[#f3d9a2]">
        “Smarter protection<br />for a safer tomorrow.”
      </div>

      {/* 4 Floating Badges exactly matching reference UI */}
      {/* 1. Anomalies Detected (Top Right) */}
      <FloatCard 
        icon={Activity} 
        value="12"
        label="Anomalies Detected" 
        pos="right-[35%] top-[14%]" 
        delay={0.2} 
        color="#ff6b81"
        iconBg="bg-rose-950/50"
      />

      {/* 2. Devices Online (Left) */}
      <FloatCard 
        icon={ShieldCheck} 
        value="3" 
        label="Devices Online" 
        pos="left-[34%] top-[30%]" 
        delay={0.6} 
        color="#d9ad62"
        iconBg="bg-amber-950/50"
      />

      {/* 3. Threats Blocked (Bottom Left) */}
      <FloatCard 
        icon={ShieldCheck} 
        value="42" 
        label="Threats Blocked" 
        pos="left-[38%] top-[56%]" 
        delay={0.4} 
        color="#34d399"
        iconBg="bg-emerald-950/50"
      />

      {/* 4. System Secure (Bottom Right) */}
      <FloatCard 
        icon={ShieldCheck} 
        value="98%" 
        label="System Secure" 
        pos="right-[34%] top-[40%]" 
        delay={0.8} 
        color="#f59e0b"
        iconBg="bg-amber-950/50"
      />

      <CommandPlatform />
    </section>
  );
}
