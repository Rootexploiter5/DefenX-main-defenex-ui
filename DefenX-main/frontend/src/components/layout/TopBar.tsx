import { Bell, ChevronDown, Moon, Search, ShieldCheck, ShieldAlert, Sun, Volume2, VolumeX, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../../app/store";
import { soundFx } from "../../services/soundFx";
import type { PageId } from "./Sidebar";

export function TopBar({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { summary, backendUp, wsUp, search, setSearch, theme, toggleTheme, profile, unread, clearUnread } = useStore();
  const ref = useRef<HTMLInputElement>(null);
  const [soundOn, setSoundOn] = useState(() => soundFx.isEnabled());
  const [utcTime, setUtcTime] = useState("");

  // Live millisecond UTC epoch clock
  useEffect(() => {
    let animId: number;
    const updateClock = () => {
      const now = new Date();
      const iso = now.toISOString().replace("T", " ").replace("Z", " UTC");
      setUtcTime(iso);
      animId = requestAnimationFrame(updateClock);
    };
    animId = requestAnimationFrame(updateClock);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const h = (e: KeyboardEvent) => { 
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { 
        e.preventDefault(); 
        ref.current?.focus(); 
      } 
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const handleToggleSound = () => {
    const next = soundFx.toggle();
    setSoundOn(next);
  };

  const active = summary.data?.telemetry_active;
  const status = !backendUp ? { t: "Backend Offline", s: "API Disconnected", ok: false }
    : active ? { t: "Protected", s: "Agent Stream Active", ok: true }
    : { t: "Standby", s: "Waiting for Telemetry", ok: false };

  return (
    <header className="flex flex-wrap items-center gap-3 py-2.5">
      {/* Search Bar in Glass Panel */}
      <label className="glass-panel flex h-[46px] min-w-[320px] flex-1 items-center gap-3 rounded-full border border-[#d9ad62]/40 bg-black/40 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <Search size={16} className="text-[#d9ad62]" aria-hidden />
        <input 
          ref={ref} 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { 
            if (e.key === "Enter" && search.trim()) {
              soundFx.playClick();
              onNavigate("reports"); 
            } 
          }}
          aria-label="Search threats, devices and logs"
          placeholder="Search for threats, devices, logs, or ask DEFENEX..."
          className="w-full bg-transparent text-xs text-[#f8f5f0] outline-none placeholder:text-[#a7a3ad]" 
        />
        <kbd className="whitespace-nowrap rounded-md border border-[#d9ad62]/40 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-[#d9ad62]">Ctrl K</kbd>
      </label>

      {/* Live Status Capsule */}
      <div className="flex h-[46px] items-center gap-3 rounded-full border border-[#d9ad62]/35 bg-black/50 px-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]" role="status">
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          Live
        </span>
        <span className="h-4 w-px bg-[#d9ad62]/30" />
        <span className="flex items-center gap-2 pr-1">
          <ShieldCheck size={18} className="text-emerald-400" />
          <span className="leading-tight">
            <span className="block text-xs font-bold text-[#f8f5f0]">System Protected</span>
            <span className="block text-[9.5px] text-[#a7a3ad]">Real-time monitoring active</span>
          </span>
        </span>
      </div>

      {/* Theme Toggle */}
      <button 
        onClick={() => {
          soundFx.playClick();
          toggleTheme();
        }} 
        aria-label={`Switch theme`}
        className="grid size-[46px] place-items-center rounded-full border border-[#d9ad62]/35 bg-black/40 text-[#d9ad62] transition hover:bg-white/10 hover:border-[#d9ad62]/60"
      >
        {theme === "light" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Alerts Bell */}
      <button 
        onClick={() => { 
          soundFx.playClick();
          clearUnread(); 
          onNavigate("reports"); 
        }} 
        aria-label="Security alerts"
        className="relative grid size-[46px] place-items-center rounded-full border border-[#d9ad62]/35 bg-black/40 text-[#d9ad62] transition hover:bg-white/10 hover:border-[#d9ad62]/60"
      >
        <Bell size={18} />
        <span className="absolute right-3.5 top-3.5 size-2 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]" />
      </button>

      {/* Profile Badge */}
      <button 
        onClick={() => {
          soundFx.playClick();
          onNavigate("settings");
        }} 
        aria-label="Open profile settings"
        className="flex h-[46px] items-center gap-2.5 rounded-full border border-[#d9ad62]/40 bg-black/45 py-1 pl-1.5 pr-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition hover:border-[#d9ad62]/70"
      >
        <span className="grid size-8 place-items-center rounded-full border border-[#d9ad62] bg-[#4b1027] font-display text-xs font-bold text-[#ffe2a0]">
          A
        </span>
        <span className="text-left leading-tight">
          <span className="block text-xs font-bold text-[#f8f5f0]">Akhilesh A S</span>
          <span className="block text-[10px] text-[#a7a3ad]">Premium User</span>
        </span>
        <ChevronDown size={14} className="ml-1 text-[#a7a3ad]" />
      </button>
    </header>
  );
}
