import { motion } from "framer-motion";
import { Activity, Cpu, Laptop, ShieldCheck, type LucideIcon } from "lucide-react";
import { lazy, Suspense } from "react";
import { useStore } from "../../app/store";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { CommandPlatform } from "../command-center/CommandPlatform";
import { Mountains } from "./Mountains";

const HoloGlobe = lazy(() => import("./HoloGlobe"));

function FloatCard({ icon: Icon, value, label, note, pos, delay }: {
  icon: LucideIcon; value: string; label: string; note?: string; pos: string; delay: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={`glass-card absolute z-10 flex min-w-[118px] items-center gap-2.5 px-3 py-2 ${pos}`}
      animate={reduced ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      title={note} role="group" aria-label={`${label}: ${value}`}>
      <span className="grid size-8 place-items-center rounded-lg bg-white/25"><Icon size={18} /></span>
      <span className="leading-tight">
        <span className="block text-xl font-semibold">{value}</span>
        <span className="block text-[10.5px]">{label}</span>
      </span>
    </motion.div>
  );
}

export function Hero() {
  const { summary, profile } = useStore();
  const reduced = useReducedMotion();
  const s = summary.data;
  const v = (n: number | null | undefined, suffix = "") => (n === null || n === undefined ? "—" : `${n}${suffix}`);

  return (
    <section aria-label="Security command center" className="hero-scene h-[500px] min-h-[440px]">
      <Mountains />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(217,35,61,0.28),transparent_60%)]" />
      <Suspense fallback={null}><HoloGlobe animate={!reduced} /></Suspense>

      <div className="absolute left-7 top-8 z-10 max-w-[44%]">
        <p className="font-serif text-[34px] leading-none text-[#E8C98A]">Welcome back,</p>
        <h1 className="title-serif mt-1 text-[44px] leading-[1.05] text-white">{profile.name.split(" ")[0]}</h1>
        <p className="mt-3 max-w-[260px] text-sm text-[#F4E6D6]">Your personal AI-powered device security command center</p>
      </div>
      <div className="absolute right-8 top-8 z-10 text-right font-serif text-xl italic leading-snug text-[#F7EBDD]">
        “Smarter protection<br />for a safer tomorrow.”
        <div className="ml-auto mt-3 h-px w-14 bg-[#D9AD62]" />
      </div>

      <FloatCard icon={Activity} value={v(s?.anomalies_24h)} label="Anomalies Detected" note="Alerts raised in the last 24 hours" pos="left-[62%] top-[18%]" delay={0.2} />
      <FloatCard icon={Laptop} value={v(s?.devices_online)} label="Devices Online" note="Devices that reported within the last 30 seconds" pos="left-[31%] top-[33%]" delay={0.8} />
      <FloatCard icon={ShieldCheck} value={v(s?.security_score, "%")} label="System Secure" note={s?.score_method} pos="left-[65%] top-[47%]" delay={1.2} />
      <FloatCard icon={Cpu} value={v(s?.threats_blocked)} label="Threats Blocked" note={s?.threats_blocked_note} pos="left-[39%] top-[56%]" delay={0.5} />

      <CommandPlatform />
    </section>
  );
}
