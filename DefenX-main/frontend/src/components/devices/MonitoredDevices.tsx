import { ChevronRight, Laptop, Smartphone, Globe, Wifi, ArrowRight } from "lucide-react";
import { useStore } from "../../app/store";
import { timeAgo } from "../../hooks/format";
import { EmptyState, Skeleton } from "../layout/Skeleton";
import { PanelTitle } from "../metrics/SecurityOverview";
import type { MonitoredDevice } from "../../types";

export const stateLabel: Record<MonitoredDevice["status"], [string, string]> = {
  connected: ["Secure", "#20834A"], warning: ["Warning", "#D99027"], disconnected: ["Disconnected", "#9a8a8a"],
};
export const DeviceIcon = ({ p }: { p: string }) => {
  const l = p.toLowerCase();
  const I = l.includes("android") || l.includes("ios") ? Smartphone : l.includes("wifi") ? Wifi : l.includes("browser") ? Globe : Laptop;
  return <I size={20} />;
};

const DEFAULT_DEVICES: MonitoredDevice[] = [
  { id: "dev-win", name: "Windows PC", platform: "Akhilesh-Laptop", agent_version: "1.0.0", last_seen_at: new Date().toISOString(), status: "connected", open_alerts: 0 },
  { id: "dev-phone", name: "Android Phone", platform: "OnePlus 11R", agent_version: "1.0.0", last_seen_at: new Date(Date.now() - 120000).toISOString(), status: "connected", open_alerts: 0 },
  { id: "dev-browser", name: "Browser", platform: "Chrome - Windows", agent_version: "1.0.0", last_seen_at: new Date().toISOString(), status: "connected", open_alerts: 0 },
  { id: "dev-wifi", name: "WiFi Network", platform: "Home Network", agent_version: "1.0.0", last_seen_at: new Date(Date.now() - 360000).toISOString(), status: "warning", open_alerts: 1 },
];

export function MonitoredDevices({ onSeeAll, onOpen, limit = 4 }: { onSeeAll?: () => void; onOpen: (id: string) => void; limit?: number }) {
  const { devices } = useStore();
  const liveList = (devices.data ?? []).slice(0, limit);
  const list = liveList.length > 0 ? liveList : DEFAULT_DEVICES;

  return (
    <section className="panel-light p-4" aria-label="Monitored devices">
      <PanelTitle 
        icon={Laptop} 
        light
        right={
          onSeeAll && (
            <button 
              onClick={onSeeAll} 
              className="flex items-center gap-1 font-mono text-xs font-semibold text-[#8c672b] hover:text-[#231219] transition-colors"
            >
              See All <ArrowRight size={13} />
            </button>
          )
        }
      >
        Monitored Devices
      </PanelTitle>

      <ul className="divide-y divide-stone-200/60">
        {list.map((d) => {
          const isWarning = d.status === "warning";
          const statusText = isWarning ? "Monitoring" : "Secure";
          const subtitleStatus = isWarning ? "Unusual activity" : d.id === "dev-phone" ? "Last seen: 2 min ago" : "Last seen: Now";
          const dotColor = isWarning ? "bg-amber-500" : "bg-emerald-500";

          return (
            <li key={d.id}>
              <button 
                onClick={() => onOpen(d.id)} 
                className="flex w-full items-center gap-3 py-2 text-left transition hover:bg-stone-50/70 rounded-lg px-1.5" 
                aria-label={`Open details for ${d.name}`}
              >
                <span className="grid size-8 place-items-center rounded-lg border border-stone-200 bg-stone-100/80 text-[#231219]">
                  <DeviceIcon p={d.name} />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <b className="block truncate text-[13px] font-bold text-[#231219]">{d.name}</b>
                  <span className="text-[10.5px] font-medium text-[#78665c]">{d.platform}</span>
                </span>
                <span className="text-right text-[11px] leading-tight">
                  <span className="flex items-center justify-end gap-1.5 font-bold text-[#231219]">
                    <i className={`size-1.5 rounded-full ${dotColor}`} />
                    {statusText}
                  </span>
                  <span className="text-[10px] text-[#78665c]">
                    {subtitleStatus}
                  </span>
                </span>
                <ChevronRight size={15} className="text-[#a79893]" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
