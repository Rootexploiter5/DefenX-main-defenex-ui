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
    <aside className="sidebar fixed inset-y-0 left-0 z-30 hidden w-[210px] flex-col rounded-r-[32px] border-r-2 border-[#d9ad62]/50 shadow-[10px_0_40px_rgba(30,5,15,0.7)] lg:flex">
      {/* Decorative Golden Ribbon Wave along the right edge */}
      <div className="pointer-events-none absolute -right-[2px] top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#d9ad62]/10 via-[#d9ad62] to-[#d9ad62]/10 shadow-[0_0_15px_#d9ad62]" />

      <Brand />
      <nav aria-label="Main navigation" className="mt-5 flex flex-col gap-1 px-3">
        {NAV.map(({ id, label, icon: Icon }) => {
          const isCurrent = page === id;
          return (
            <button 
              key={id} 
              onClick={() => handleNav(id)} 
              aria-current={isCurrent ? "page" : undefined}
              className={`flex h-[42px] items-center gap-2.5 rounded-full px-3 text-left text-[12.5px] transition-all duration-200 ${
                isCurrent 
                  ? "border border-[#ffe2a0]/60 bg-gradient-to-r from-[#e5bb68] via-[#d4a24c] to-[#a87428] font-bold text-[#1b0711] shadow-[0_4px_18px_rgba(217,173,98,0.5)]" 
                  : "font-medium text-[#d8cfcb] hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span className={isCurrent 
                ? "grid size-6 place-items-center rounded-full bg-[#1b0711]/20 text-[#1b0711]" 
                : "grid size-6 place-items-center rounded-full border border-[#d9ad62]/50 text-[#d9ad62]"
              }>
                <Icon size={13} />
              </span>
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto px-6 pb-6">
        <div className="font-display text-[10.5px] leading-[2.1] tracking-[0.45em] text-[#d9ad62]/90">
          PROTECT<br />DETECT<br />ANALYZE<br />PREVENT
        </div>
        <div className="mt-2 h-px w-12 bg-gradient-to-r from-[#d9ad62] to-transparent" />
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
