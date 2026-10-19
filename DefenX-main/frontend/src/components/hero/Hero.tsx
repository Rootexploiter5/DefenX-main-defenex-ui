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

function FloatCard({ icon: Icon, value, label, note, pos, delay, color = "#d9ad62", sparkline }: {
  icon: LucideIcon; value: string; label: string; note?: string; pos: string; delay: number; color?: string; sparkline?: number[];
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div 
      className={`glass-card absolute z-10 flex min-w-[130px] items-center gap-2.5 px-3 py-2 ${pos}`}
      animate={reduced ? undefined : { y: [0, -5, 0] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      title={note} 
      role="group" 
      aria-label={`${label}: ${value}`}
    >
      <span className="grid size-8 place-items-center rounded-lg border border-[#d9ad62]/25 bg-black/45 text-[#ffe2a0]">
        <Icon size={16} style={{ color }} />
      </span>
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-base font-bold text-[#f8f5f0]">{value}</span>
          {sparkline && <MiniSparkline color={color} points={sparkline} />}
        </div>
        <span className="block text-[10px] font-medium text-[#a7a3ad]">{label}</span>
      </div>
    </motion.div>
  );
}

export function Hero() {
  const { summary, profile } = useStore();
  const reduced = useReducedMotion();
  const s = summary.data;
  const v = (n: number | null | undefined, suffix = "") => (n === null || n === undefined ? "—" : `${n}${suffix}`);

  return (
    <section aria-label="Security command center" className="hero-scene h-[490px] min-h-[440px]">
      <Mountains />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(75,16,39,0.38),transparent_65%)]" />
      <Suspense fallback={null}><HoloGlobe animate={!reduced} /></Suspense>

      <div className="absolute left-7 top-7 z-10 max-w-[45%]">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          <span className="font-mono text-[10px] tracking-widest text-[#d9ad62] uppercase">DefenX SOC Command</span>
        </div>
        <p className="font-serif text-[32px] leading-tight text-[#FFE2A0]">Welcome back,</p>
        <h1 className="title-serif mt-0.5 text-[42px] leading-[1.05] text-[#f8f5f0]">{profile.name.split(" ")[0]}</h1>
        <p className="mt-2.5 max-w-[270px] text-xs leading-relaxed text-[#d1c8c1]">
          Real-time AI behavioral anomaly detection and personal endpoint defense.
        </p>
      </div>

      <div className="absolute right-8 top-7 z-10 text-right font-serif text-lg italic leading-snug text-[#f8f5f0]">
        “Smarter protection<br />for a safer tomorrow.”
        <div className="ml-auto mt-2.5 h-px w-14 bg-gradient-to-l from-[#d9ad62] to-transparent" />
      </div>

      <FloatCard 
        icon={Activity} 
        value={v(s?.anomalies_24h)} 
        label="Anomalies (24h)" 
        note="Alerts raised in the last 24 hours" 
        pos="left-[62%] top-[17%]" 
        delay={0.2} 
        color="#f59e0b"
        sparkline={[2, 5, 4, 8, 7, 10, 8, 10]}
      />
      <FloatCard 
        icon={Laptop} 
        value={v(s?.devices_online)} 
        label="Devices Online" 
        note="Active endpoints reporting within 30s" 
        pos="left-[31%] top-[31%]" 
        delay={0.8} 
        color="#10b981"
        sparkline={[1, 1, 1, 1, 1, 1, 1, 1]}
      />
      <FloatCard 
        icon={ShieldCheck} 
        value={v(s?.security_score, "%")} 
        label="Security Score" 
        note={s?.score_method} 
        pos="left-[65%] top-[45%]" 
        delay={1.2} 
        color="#ffe2a0"
        sparkline={[98, 95, 92, 94, 91, 88, 92]}
      />
      <FloatCard 
        icon={Cpu} 
        value={v(s?.threats_blocked)} 
        label="Threats Blocked" 
        note={s?.threats_blocked_note} 
        pos="left-[38%] top-[54%]" 
        delay={0.5} 
        color="#ef4444"
        sparkline={[1, 2, 3, 5, 6, 7, 7]}
      />

      <CommandPlatform />
    </section>
  );
}
