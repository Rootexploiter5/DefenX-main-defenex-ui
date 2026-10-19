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
    <header className="flex flex-wrap items-center gap-2.5 py-2">
      {/* Search Bar in Glass Panel */}
      <label className="glass-panel glass-interactive flex h-[44px] min-w-[260px] flex-1 items-center gap-3 px-4">
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
          placeholder="Search threats, PIDs, IP addresses, or CVE forensics..."
          className="w-full bg-transparent text-xs text-[#f8f5f0] outline-none placeholder:text-[#a7a3ad]" 
        />
        <kbd className="whitespace-nowrap rounded border border-[#d9ad62]/30 bg-black/30 px-1.5 py-0.5 font-mono text-[9.5px] text-[#d9ad62]">Ctrl K</kbd>
      </label>

      {/* Live Tactical Time Readout */}
      <div className="glass-panel hidden h-[44px] items-center gap-2 px-3.5 xl:flex">
        <Radio size={13} className={`animate-pulse ${wsUp ? "text-emerald-400" : "text-amber-400"}`} />
        <span className="font-mono text-[11px] font-medium tracking-wide text-[#ffe2a0]">
          {utcTime || "SYNCING TIME..."}
        </span>
      </div>

      {/* System Status HUD */}
      <div className="glass-panel flex h-[44px] items-center gap-3 px-3.5" role="status" aria-live="polite">
        <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#f8f5f0]">
          <span className={`size-2 rounded-full ${active ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" : "bg-red-400"}`} />
          {active ? "LIVE" : "IDLE"}
        </span>
        <span className="h-4 w-px bg-[#d9ad62]/30" />
        <span className="flex items-center gap-2">
          {status.ok ? <ShieldCheck size={18} className="text-emerald-400" /> : <ShieldAlert size={18} className="text-red-400" />}
          <span className="leading-tight">
            <span className="block text-xs font-semibold text-[#f8f5f0]">{status.t}</span>
            <span className="block text-[9.5px] text-[#a7a3ad]">{status.s}</span>
          </span>
        </span>
      </div>

      {/* Optional Sound FX Toggle (User Opt-In) */}
      <button 
        onClick={handleToggleSound} 
        aria-label={soundOn ? "Mute tactical audio feedback" : "Enable tactical Web Audio feedback"}
        title={soundOn ? "Tactical Audio: Enabled (Click to Mute)" : "Tactical Audio: Muted (Click to Opt-In)"}
        className="glass-panel glass-interactive grid size-[44px] place-items-center text-[#d9ad62]"
      >
        {soundOn ? <Volume2 size={17} className="text-emerald-400" /> : <VolumeX size={17} className="text-[#a7a3ad]" />}
      </button>

      {/* Theme Toggle */}
      <button 
        onClick={() => {
          soundFx.playClick();
          toggleTheme();
        }} 
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        className="glass-panel glass-interactive grid size-[44px] place-items-center text-[#d9ad62]"
      >
        {theme === "light" ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* Alerts Bell */}
      <button 
        onClick={() => { 
          soundFx.playClick();
          clearUnread(); 
          onNavigate("reports"); 
        }} 
        aria-label={`Security alerts, ${unread} new`}
        className="glass-panel glass-interactive relative grid size-[44px] place-items-center text-[#d9ad62]"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-[#ef4444] px-1 font-mono text-[9px] font-bold text-white shadow-[0_0_8px_#ef4444]">
            {unread}
          </span>
        )}
      </button>

      {/* Profile Badge */}
      <button 
        onClick={() => {
          soundFx.playClick();
          onNavigate("settings");
        }} 
        aria-label="Open profile settings"
        className="glass-panel glass-interactive flex h-[44px] items-center gap-2.5 py-1 pl-1.5 pr-3.5"
      >
        <span className="grid size-8 place-items-center rounded-full border border-[#d9ad62] bg-[#4b1027] font-display text-xs font-bold text-[#ffe2a0]">
          {profile.name.charAt(0).toUpperCase()}
        </span>
        <span className="text-left leading-none">
          <span className="block text-xs font-semibold text-[#f8f5f0]">{profile.name}</span>
          <span className="block text-[9.5px] text-[#a7a3ad]">{profile.plan}</span>
        </span>
        <ChevronDown size={13} className="text-[#a7a3ad]" />
      </button>
    </header>
  );
}
