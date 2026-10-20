import { Battery, ChevronDown, Cpu, Thermometer, Wifi, MessageSquare } from "lucide-react";
import { useStore } from "../../app/store";
import { Gauge } from "./Gauge";
import { PanelTitle } from "./SecurityOverview";

export function SystemResources() {
  const { resources } = useStore();
  const r = resources.data;

  const cpuVal = r?.cpu_percent ?? 32;
  const memVal = r?.memory_percent ?? 68;
  const diskVal = r?.disk_percent ?? 45;
  const netVal = r?.network_percent ?? 12;

  const gauges: Array<{ l: string; v: number; colors: [string, string] }> = [
    { l: "CPU", v: cpuVal, colors: ["#d9ad62", "#b8860b"] },
    { l: "Memory", v: memVal, colors: ["#ef4444", "#b91c1c"] },
    { l: "Disk", v: diskVal, colors: ["#d97706", "#b45309"] },
    { l: "Network", v: netVal, colors: ["#d9ad62", "#b8860b"] },
  ];

  const details = [
    { 
      i: Thermometer, 
      l: "System Temperature", 
      v: r?.temperature_c ? `${r.temperature_c}°C` : "46°C", 
      tag: "Normal",
      tone: "text-amber-600 bg-amber-50"
    },
    { 
      i: Battery, 
      l: "Battery", 
      v: r?.battery ? `${r.battery.percent}%` : "87%", 
      tag: "Charging",
      tone: "text-emerald-600 bg-emerald-50"
    },
    { 
      i: MessageSquare, 
      l: "Active Processes", 
      v: r?.process_count ? String(r.process_count) : "218", 
      tag: "Normal",
      tone: "text-emerald-600 bg-emerald-50"
    },
    { 
      i: Wifi, 
      l: "Network Traffic", 
      v: "12.4 MB/s", 
      tag: "↑ 5%",
      tone: "text-emerald-600 bg-emerald-50"
    },
  ];

  return (
    <section className="panel-light p-4" aria-label="System resources">
      <PanelTitle 
        icon={Cpu} 
        light
        right={
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 shadow-sm">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            Live
            <ChevronDown size={13} className="text-emerald-600" />
          </span>
        }
      >
        System Resources
      </PanelTitle>

      <div className="flex items-center gap-3">
        {/* 2x2 Gauge Grid */}
        <div className="grid grid-cols-2 gap-2">
          {gauges.map((g) => (
            <Gauge 
              key={g.l} 
              value={g.v} 
              size={70} 
              stroke={6} 
              label={g.l} 
              theme="light"
              gradientColors={g.colors}
            />
          ))}
        </div>

        {/* 4 Metrics Rows */}
        <ul className="flex-1 space-y-1.5 text-xs">
          {details.map(({ i: I, l, v, tag, tone }) => (
            <li key={l} className="flex items-center justify-between rounded-xl border border-stone-200/80 bg-white/70 px-2.5 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2">
                <span className={`grid size-7 place-items-center rounded-lg border border-stone-200 ${tone}`}>
                  <I size={14} />
                </span>
                <div className="leading-tight">
                  <span className="block text-[10px] font-medium text-[#78665c]">{l}</span>
                  <b className="text-[13px] font-bold text-[#231219]">{v}</b>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9.5px] font-bold text-emerald-800 font-mono">
                {tag}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
