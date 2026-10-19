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

export function MonitoredDevices({ onSeeAll, onOpen, limit = 4 }: { onSeeAll?: () => void; onOpen: (id: string) => void; limit?: number }) {
  const { devices } = useStore();
  const list = (devices.data ?? []).slice(0, limit);
  return (
    <section className="panel-light p-4" aria-label="Monitored devices">
      <PanelTitle icon={Laptop} right={onSeeAll && <button onClick={onSeeAll} className="flex items-center gap-1 text-xs">See All <ArrowRight size={13} /></button>}>Monitored Devices</PanelTitle>
      {devices.loading ? <Skeleton className="h-[130px]" /> : devices.error ? <EmptyState title="Devices unavailable" body="The backend could not be reached." />
        : list.length === 0 ? <EmptyState title="No devices registered" body="A device appears here once its agent sends telemetry." /> : (
        <ul className="divide-y divide-[var(--surface-line)]">
          {list.map((d) => {
            const [label, color] = stateLabel[d.status];
            return (
              <li key={d.id}>
                <button onClick={() => onOpen(d.id)} className="flex w-full items-center gap-3 py-2 text-left" aria-label={`Open details for ${d.name}`}>
                  <span className="grid size-9 place-items-center rounded-lg bg-[#D9AD62]/20 text-[#98662D]"><DeviceIcon p={d.platform} /></span>
                  <span className="min-w-0 flex-1 leading-tight"><b className="block truncate text-[13px]">{d.name}</b><span className="text-[11px] text-[var(--ink-soft)]">{d.platform}</span></span>
                  <span className="text-right text-[11px] leading-tight"><span className="flex items-center justify-end gap-1.5 font-medium"><i className="size-2 rounded-full" style={{ background: color }} />{label}</span>
                    <span className="text-[var(--ink-soft)]">Last seen: {timeAgo(d.last_seen_at)}</span></span>
                  <ChevronRight size={16} className="text-[var(--ink-soft)]" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
