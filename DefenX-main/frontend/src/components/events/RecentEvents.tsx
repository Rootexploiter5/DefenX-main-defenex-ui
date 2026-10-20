import { ArrowRight, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "../../app/store";
import { clock } from "../../hooks/format";
import { EmptyState, Skeleton } from "../layout/Skeleton";
import { PanelTitle } from "../metrics/SecurityOverview";
import type { Severity } from "../../types";

export const sevStyle: Record<Severity, string> = {
  Critical: "border border-red-500/40 bg-red-500/20 text-red-300 font-mono",
  High: "border border-red-500/30 bg-red-500/15 text-red-300 font-mono",
  Medium: "border border-amber-500/40 bg-amber-500/20 text-amber-300 font-mono",
  Low: "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 font-mono",
  Informational: "border border-slate-500/30 bg-slate-500/10 text-slate-300 font-mono",
};

const DEFAULT_EVENTS = [
  { id: 101, time: "10:24:12", event: "Suspicious login attempt", severity: "High" as const },
  { id: 102, time: "10:18:45", event: "Malware process detected", severity: "High" as const },
  { id: 103, time: "10:12:30", event: "Unusual network connection", severity: "Medium" as const },
  { id: 104, time: "09:55:21", event: "System file modification", severity: "Medium" as const },
  { id: 105, time: "09:41:10", event: "Multiple failed login attempts", severity: "Low" as const },
];

export const sevPillStyle: Record<Severity, string> = {
  Critical: "bg-red-100 text-red-800 font-bold",
  High: "bg-rose-100 text-rose-800 font-bold",
  Medium: "bg-amber-100 text-amber-800 font-bold",
  Low: "bg-emerald-100 text-emerald-800 font-bold",
  Informational: "bg-stone-100 text-stone-700 font-bold",
};

export function RecentEvents({ onSeeAll, limit = 5 }: { onSeeAll?: () => void; limit?: number }) {
  const { events } = useStore();

  const liveRows = useMemo(() => {
    return (events.data ?? []).slice(0, limit).map((e) => ({
      id: e.id,
      time: clock(e.time),
      event: e.event,
      severity: e.severity,
    }));
  }, [events.data, limit]);

  const rows = liveRows.length > 0 ? liveRows : DEFAULT_EVENTS;

  return (
    <section className="panel-light p-4" aria-label="Recent security events">
      <PanelTitle 
        icon={ShieldAlert} 
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
        Recent Security Events
      </PanelTitle>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-stone-200/80 text-left font-medium text-[10.5px] text-[#78665c]">
            <th scope="col" className="pb-2 font-medium">Time</th>
            <th scope="col" className="pb-2 font-medium">Event</th>
            <th scope="col" className="pb-2 text-right font-medium">Severity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200/60">
          {rows.map((e) => (
            <tr key={e.id} className="transition-colors hover:bg-stone-50/70">
              <td className="py-2.5 pr-2 font-mono text-[11px] text-[#78665c] tabular-nums">{e.time}</td>
              <td className="pr-2 font-medium text-[#231219]">
                <span className="line-clamp-1">{e.event}</span>
              </td>
              <td className="text-right">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9.5px] font-mono ${sevPillStyle[e.severity]}`}>
                  {e.severity}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
