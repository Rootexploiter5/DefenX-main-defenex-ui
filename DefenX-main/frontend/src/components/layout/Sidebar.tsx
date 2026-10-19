import {
  Activity, Bot, FileText, Gauge, Home, Settings, ShieldAlert, ShieldCheck, Smartphone, Network,
} from "lucide-react";
import type { ComponentType } from "react";
import { Brand } from "./Logo";

export type PageId =
  | "dashboard" | "monitor" | "anomaly" | "intel" | "assistant" | "devices" | "network" | "reports" | "settings";

export const NAV: { id: PageId; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "monitor", label: "Live Monitor", icon: Activity },
  { id: "anomaly", label: "Anomaly Detection", icon: Gauge },
  { id: "intel", label: "Threat Intelligence", icon: ShieldAlert },
  { id: "assistant", label: "AI Assistant", icon: Bot },
  { id: "devices", label: "Device Security", icon: Smartphone },
  { id: "network", label: "Network Analysis", icon: Network },
  { id: "reports", label: "Reports & Logs", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  return (
    <aside className="sidebar fixed inset-y-0 left-0 z-30 hidden w-[200px] flex-col rounded-r-[34px] lg:flex">
      <Brand />
      <nav aria-label="Main navigation" className="mt-7 flex flex-col gap-1.5 px-3">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onNavigate(id)} aria-current={page === id ? "page" : undefined}
            className="nav-item flex h-[46px] items-center gap-3 rounded-full px-3.5 text-left text-[13.5px] font-medium">
            <span className={page === id ? "grid size-8 place-items-center rounded-full bg-[#7a1a3a]/20" : "grid size-8 place-items-center text-[#D9AD62]"}>
              <Icon size={19} />
            </span>
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto px-6 pb-8">
        <div className="font-display text-[12px] leading-[2.1] tracking-[0.42em] text-[#D9AD62]/90">
          PROTECT<br />DETECT<br />ANALYZE<br />PREVENT
        </div>
        <div className="mt-3 h-px w-10 bg-[#D9AD62]/70" />
        <ShieldCheck className="mt-4 text-[#D9AD62]/40" size={18} aria-hidden />
      </div>
    </aside>
  );
}

/** Compact bottom/top nav for tablets & phones. */
export function MobileNav({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  return (
    <nav aria-label="Main navigation" className="sidebar sticky top-0 z-30 flex gap-1 overflow-x-auto px-2 py-2 lg:hidden">
      {NAV.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onNavigate(id)} aria-current={page === id ? "page" : undefined}
          className="nav-item flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs">
          <Icon size={15} />{label}
        </button>
      ))}
    </nav>
  );
}
