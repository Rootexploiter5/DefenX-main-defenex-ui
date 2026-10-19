import { Battery, Cpu, Thermometer, Wifi, Workflow } from "lucide-react";
import { useStore } from "../../app/store";
import { rate } from "../../hooks/format";
import { Skeleton } from "../layout/Skeleton";
import { Gauge } from "./Gauge";
import { PanelTitle } from "./SecurityOverview";

export function SystemResources() {
  const { resources } = useStore();
  const r = resources.data;
  const gauges = r ? [
    { l: "CPU", v: r.cpu_percent }, { l: "Memory", v: r.memory_percent, warn: r.memory_percent > 85 },
    { l: "Disk", v: r.disk_percent }, { l: "Network", v: r.network_percent },
  ] : [];
  const details = r ? [
    { i: Thermometer, l: "System Temperature", v: r.temperature_c === null ? "Not supported" : `${r.temperature_c}°C` },
    { i: Battery, l: "Battery", v: r.battery ? `${r.battery.percent}% ${r.battery.charging ? "Charging" : "On battery"}` : "No battery" },
    { i: Workflow, l: "Active Processes", v: String(r.process_count) },
    { i: Wifi, l: "Network Traffic", v: rate(r.network_bytes_per_sec) },
  ] : [];
  return (
    <section className="panel-light p-4" aria-label="System resources">
      <PanelTitle icon={Cpu} right={<span className="flex items-center gap-1.5 text-xs"><span className={`size-2 rounded-full ${r ? "bg-emerald-500" : "bg-red-500"}`} />{r ? "Live" : "Offline"}</span>}>System Resources</PanelTitle>
      {resources.loading ? <Skeleton className="h-[150px]" /> : !r ? (
        <p className="p-4 text-sm text-[var(--ink-soft)]" role="alert">Resource readings unavailable: backend unreachable.</p>
      ) : (
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-2">
            {gauges.map((g) => <Gauge key={g.l} value={g.v} size={74} stroke={6} label={g.l} warn={g.warn} sub={g.v === null ? "" : undefined} />)}
          </div>
          <ul className="flex-1 divide-y divide-[var(--surface-line)] text-xs">
            {details.map(({ i: I, l, v }) => (
              <li key={l} className="flex items-center gap-2 py-1.5">
                <span className="grid size-7 place-items-center rounded-md bg-[#D9AD62]/20 text-[#98662D]"><I size={15} /></span>
                <span className="leading-tight"><span className="block text-[10px] text-[var(--ink-soft)]">{l}</span><b className="text-[13px]">{v}</b></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
