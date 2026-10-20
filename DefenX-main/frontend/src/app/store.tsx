import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, openAlertSocket } from "../services/api";
import { usePoll, type PollState } from "../hooks/usePoll";
import type { MonitoredDevice, Resources, Summary, SecurityEvent } from "../types";

interface Profile { name: string; plan: string }
interface Store {
  summary: PollState<Summary>;
  resources: PollState<Resources>;
  devices: PollState<MonitoredDevice[]>;
  events: PollState<SecurityEvent[]>;
  wsUp: boolean;
  backendUp: boolean;
  search: string; setSearch: (s: string) => void;
  theme: "light" | "dark"; toggleTheme: () => void;
  profile: Profile; setProfile: (p: Profile) => void;
  selectedDevice: string | null; setSelectedDevice: (id: string | null) => void;
  unread: number; clearUnread: () => void;
  refreshAll: () => void;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
};

const load = <T,>(key: string, fallback: T): T => {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const summary = usePoll(api.summary, 5000);
  const resources = usePoll(api.resources, 3000);
  const devices = usePoll(api.devices, 5000);
  const events = usePoll(() => api.events({ limit: 50 }), 8000);
  const [wsUp, setWsUp] = useState(false);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(() => load("defenex.theme", "light"));
  const [profile, setProfileState] = useState<Profile>(() =>
    load("defenex.profile", { name: import.meta.env.VITE_USER_NAME || "Akhilesh A S", plan: "Premium User" }));
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("defenex.theme", JSON.stringify(theme)); }, [theme]);

  useEffect(() =>
    openAlertSocket((m) => {
      if (m?.type === "TELEMETRY_UPDATE") {
        if (m.telemetry) {
          resources.refresh();
          summary.refresh();
        }
        if (m.alert) {
          setUnread((n) => n + 1);
          events.refresh();
          devices.refresh();
        }
      } else if (m?.alert) {
        setUnread((n) => n + 1);
        events.refresh();
        summary.refresh();
      }
    }, setWsUp),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const value = useMemo<Store>(() => ({
    summary, resources, devices, events, wsUp,
    backendUp: !!summary.data && !summary.error,
    search, setSearch,
    theme, toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
    profile, setProfile: (p) => { setProfileState(p); localStorage.setItem("defenex.profile", JSON.stringify(p)); },
    selectedDevice, setSelectedDevice,
    unread, clearUnread: () => setUnread(0),
    refreshAll: () => { summary.refresh(); resources.refresh(); devices.refresh(); events.refresh(); },
  }), [summary, resources, devices, events, wsUp, search, theme, profile, selectedDevice, unread]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
