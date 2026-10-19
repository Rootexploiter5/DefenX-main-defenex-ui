import {
  Activity, Bot, FileText, Gauge, Home, Settings, ShieldAlert, ShieldCheck, Smartphone, Network,
} from "lucide-react";
import type { ComponentType } from "react";
import { Brand } from "./Logo";
import { soundFx } from "../../services/soundFx";

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
  const handleNav = (id: PageId) => {
    soundFx.playClick();
    onNavigate(id);
  };

  return (
    <aside className="sidebar fixed inset-y-0 left-0 z-30 hidden w-[204px] flex-col rounded-r-[28px] lg:flex">
      <Brand />
      <nav aria-label="Main navigation" className="mt-6 flex flex-col gap-1.5 px-3">
        {NAV.map(({ id, label, icon: Icon }) => {
          const isCurrent = page === id;
          return (
            <button 
              key={id} 
              onClick={() => handleNav(id)} 
              aria-current={isCurrent ? "page" : undefined}
              className={`nav-item flex h-[44px] items-center gap-3 rounded-xl px-3.5 text-left text-[13px] font-medium transition-all ${
                isCurrent 
                  ? "border border-[#d9ad62]/40 bg-gradient-to-r from-[#4b1027]/90 to-[#2a0813]/80 text-[#ffe2a0] shadow-[0_0_20px_rgba(75,16,39,0.5)]" 
                  : "text-[#d1c8c1] hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={isCurrent ? "grid size-7 place-items-center rounded-lg bg-[#d9ad62]/20 text-[#ffe2a0]" : "grid size-7 place-items-center text-[#d9ad62]"}>
                <Icon size={17} />
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto px-6 pb-7">
        <div className="font-display text-[11px] leading-[2.2] tracking-[0.42em] text-[#d9ad62]/80">
          PROTECT<br />DETECT<br />ANALYZE<br />PREVENT
        </div>
        <div className="mt-2.5 h-px w-12 bg-gradient-to-r from-[#d9ad62]/80 to-transparent" />
        <div className="mt-3 flex items-center gap-2 text-[10px] text-[#a7a3ad]">
          <ShieldCheck className="text-emerald-400" size={15} aria-hidden />
          <span>v2.0 Tactical HUD</span>
        </div>
      </div>
    </aside>
  );
}

/** Compact bottom/top nav for tablets & phones. */
export function MobileNav({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  return (
    <nav aria-label="Main navigation" className="sidebar sticky top-0 z-30 flex gap-1 overflow-x-auto px-2 py-2 lg:hidden">
      {NAV.map(({ id, label, icon: Icon }) => (
        <button 
          key={id} 
          onClick={() => {
            soundFx.playClick();
            onNavigate(id);
          }} 
          aria-current={page === id ? "page" : undefined}
          className={`nav-item flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${
            page === id ? "bg-[#4b1027] text-[#ffe2a0]" : "text-[#d1c8c1]"
          }`}
        >
          <Icon size={14} />{label}
        </button>
      ))}
    </nav>
  );
}
