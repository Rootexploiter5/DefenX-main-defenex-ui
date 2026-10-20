import { Activity, Bug, Laptop, ShieldAlert } from "lucide-react";
import { useStore } from "../../app/store";
import { Skeleton } from "../layout/Skeleton";
import { Gauge } from "./Gauge";

export function PanelTitle({ icon: Icon, children, right, light = false }: { 
  icon: React.ComponentType<{ size?: number; className?: string }>; 
  children: React.ReactNode; 
  right?: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-2">
      <h2 className={`font-serif font-bold flex items-center gap-2 text-[16px] ${light ? "text-[#231219]" : "text-[#f8f5f0]"}`}>
        <span className="text-[#d9ad62]"><Icon size={17} /></span>
        {children}
      </h2>
      {right}
    </div>
  );
}

export function SecurityOverview() {
  const { summary } = useStore();
  const s = summary.data;

  const scoreVal = s?.security_score ?? 98;
  const rows = [
    { 
      icon: ShieldAlert, 
      v: s?.threats_blocked ?? 42, 
      l: "Threats Blocked", 
      badge: "↑ 12%", 
      badgeCls: "bg-emerald-100 text-emerald-800",
      tone: "text-rose-500",
      iconBg: "bg-rose-50 border-rose-200" 
    },
    { 
      icon: Activity, 
      v: s?.anomalies_24h ?? 12, 
      l: "Anomalies Detected", 
      badge: "↓ 8%", 
      badgeCls: "bg-rose-100 text-rose-800",
      tone: "text-rose-500",
      iconBg: "bg-rose-50 border-rose-200" 
    },
    { 
      icon: Laptop, 
      v: s?.devices_monitored ?? 3, 
      l: "Devices Monitored", 
      badge: "↑ 0%", 
      badgeCls: "bg-emerald-100 text-emerald-800",
      tone: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-200" 
    },
    { 
      icon: Bug, 
      v: s?.critical_threats ?? 0, 
      l: "Critical Threats", 
      badge: "→ 0%", 
      badgeCls: "bg-stone-100 text-stone-600",
      tone: "text-amber-500",
      iconBg: "bg-amber-50 border-amber-200" 
    },
  ];

  return (
    <section className="panel-light p-4" aria-label="Security overview">
      <PanelTitle icon={ShieldAlert} light>Security Overview</PanelTitle>
      
      <div className="flex items-center gap-4">
        <Gauge 
          value={scoreVal} 
          size={135} 
          stroke={10} 
          big 
          theme="light"
          display={`${scoreVal}%`}
          sub="Secure" 
          label="Security score" 
        />

        <ul className="flex-1 space-y-2">
          {rows.map(({ icon: I, v, l, badge, badgeCls, tone, iconBg }) => (
            <li key={l} className="flex items-center gap-2.5 rounded-xl border border-stone-200/80 bg-white/70 px-2.5 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <span className={`grid size-7 place-items-center rounded-lg border ${iconBg} ${tone}`}>
                <I size={15} />
              </span>
              <span className="leading-tight">
                <b className="block text-[13.5px] font-bold text-[#231219]">{v}</b>
                <span className="block text-[10.5px] font-medium text-[#78665c]">{l}</span>
              </span>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[9.5px] font-bold font-mono ${badgeCls}`}>
                {badge}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
