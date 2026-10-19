import { Bell, ChevronDown, Moon, Search, ShieldCheck, ShieldAlert, Sun } from "lucide-react";
import { useEffect, useRef } from "react";
import { useStore } from "../../app/store";
import type { PageId } from "./Sidebar";

export function TopBar({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { summary, backendUp, search, setSearch, theme, toggleTheme, profile, unread, clearUnread } = useStore();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); ref.current?.focus(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const active = summary.data?.telemetry_active;
  const status = !backendUp ? { t: "Backend Offline", s: "Cannot reach the DEFENEX API", ok: false }
    : active ? { t: "System Protected", s: "Real-time monitoring active", ok: true }
    : { t: "No Telemetry", s: "Agent not reporting", ok: false };

  return (
    <header className="flex flex-wrap items-center gap-3 py-2">
      <label className="panel-light flex h-[46px] min-w-[240px] flex-1 items-center gap-3 rounded-full px-4">
        <Search size={18} className="text-[#98662D]" aria-hidden />
        <input ref={ref} value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && search.trim()) onNavigate("reports"); }}
          aria-label="Search threats, devices and logs"
          placeholder="Search for threats, devices, logs, or ask DEFENEX..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--ink-soft)]" />
        <kbd className="whitespace-nowrap rounded-md border border-[#D9AD62]/50 px-1.5 text-[10px] text-[var(--ink-soft)]">Ctrl K</kbd>
      </label>

      <div className="panel-dark flex h-[46px] items-center gap-3 rounded-full px-4" role="status" aria-live="polite">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className={`size-2.5 rounded-full ${active ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-red-400"}`} />
          {active ? "Live" : "Idle"}
        </span>
        <span className="h-6 w-px bg-[#D9AD62]/40" />
        <span className="flex items-center gap-2">
          {status.ok ? <ShieldCheck size={20} className="text-emerald-400" /> : <ShieldAlert size={20} className="text-red-300" />}
          <span className="leading-tight">
            <span className="block text-[13px] font-semibold">{status.t}</span>
            <span className="block text-[10.5px] text-[#D8C2B6]">{status.s}</span>
          </span>
        </span>
      </div>

      <button onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        className="panel-light grid size-[46px] place-items-center rounded-full text-[#98662D]">
        {theme === "light" ? <Sun size={19} /> : <Moon size={19} />}
      </button>
      <button onClick={() => { clearUnread(); onNavigate("reports"); }} aria-label={`Notifications, ${unread} new`}
        className="panel-light relative grid size-[46px] place-items-center rounded-full text-[#98662D]">
        <Bell size={19} />
        {unread > 0 && <span className="absolute right-2 top-2 grid min-w-4 place-items-center rounded-full bg-[#D9233D] px-1 text-[9px] font-bold text-white">{unread}</span>}
      </button>
      <button onClick={() => onNavigate("settings")} aria-label="Open profile settings"
        className="panel-dark flex h-[50px] items-center gap-3 rounded-full py-1 pl-1.5 pr-4">
        <span className="grid size-10 place-items-center rounded-full border-2 border-[#D9AD62] bg-[#570D25] font-display text-lg text-[#FFE2A0]">
          {profile.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[13px] font-semibold">{profile.name}</span>
          <span className="block text-[10.5px] text-[#D8C2B6]">{profile.plan}</span>
        </span>
        <ChevronDown size={16} className="text-[#D9AD62]" />
      </button>
    </header>
  );
}
