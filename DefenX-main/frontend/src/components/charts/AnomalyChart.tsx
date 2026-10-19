import { Activity } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePoll } from "../../hooks/usePoll";
import { api } from "../../services/api";
import { EmptyState, Skeleton } from "../layout/Skeleton";
import { PanelTitle } from "../metrics/SecurityOverview";

export const RANGES = [
  { v: "15m", l: "Real-Time (15m)" },
  { v: "1h", l: "Last Hour" },
  { v: "6h", l: "Last 6 Hours" },
  { v: "24h", l: "Last 24 Hours" },
  { v: "7d", l: "Last 7 Days" },
];

export function AnomalyChart({ compact = true }: { compact?: boolean }) {
  const [range, setRange] = useState("24h");
  const { data, loading, error } = usePoll(() => api.series(range), 3500, [range]);

  const rows = useMemo(() => (data?.points ?? []).map((p) => ({
    ...p,
    label: new Date(p.time).toLocaleTimeString([], range === "7d" ? { weekday: "short", hour: "2-digit", hour12: false } : range === "15m" ? { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false } : { hour: "2-digit", minute: "2-digit", hour12: false }),
  })), [data, range]);
  const sparse = rows.filter((r) => r.normal !== null).length < 12;
  const hot = rows.filter((r) => r.alerts > 0 && r.risk !== null);

  return (
    <section className="panel-light p-4" aria-label="Real-time anomaly analytics">
      <PanelTitle icon={Activity} right={
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
          <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Time range"
            className="rounded-lg border border-[#D9AD62]/60 bg-[var(--surface)] px-2.5 py-1 text-xs">
            {RANGES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
          </select>
        </div>
      }>Real-Time Anomaly Analytics</PanelTitle>
      <div className={`rounded-xl bg-[#1d060d] p-2 ${compact ? "h-[160px]" : "h-[340px]"}`}>
        {loading ? <Skeleton className="h-full" /> : error ? <EmptyState tone="dark" title="Chart unavailable" body={`Could not load the series (${error}).`} />
          : !data?.has_data ? <EmptyState tone="dark" title="No telemetry in this range" body="Start the endpoint agent (python -m agent.main) to populate this chart." />
          : (
            <>
              <div className="flex justify-end gap-3 pr-2 text-[10px] text-[#D8C2B6]" aria-hidden>
                <span><i className="mr-1 inline-block size-1.5 rounded-full bg-[#D9AD62]" />Normal</span>
                <span><i className="mr-1 inline-block size-1.5 rounded-full bg-[#D9233D]" />Anomaly</span>
                <span><i className="mr-1 inline-block size-1.5 rounded-full bg-[#FFE2A0]" />Risk Score</span>
              </div>
              <ResponsiveContainer width="100%" height="88%">
                <LineChart data={rows} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(217,173,98,.15)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#D8C2B6", fontSize: 9 }} interval="preserveStartEnd" minTickGap={28} stroke="rgba(217,173,98,.3)" />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: "#D8C2B6", fontSize: 9 }} stroke="rgba(217,173,98,.3)" />
                  <Tooltip contentStyle={{ background: "#2a0813", border: "1px solid #D9AD62", borderRadius: 10, fontSize: 11 }}
                    labelStyle={{ color: "#FFE2A0" }}
                    formatter={(v, n, item) => [v === null ? "no data" : `${v}`, `${n}${n === "Anomaly" ? ` (${item.payload.alerts} alert${item.payload.alerts === 1 ? "" : "s"})` : ""}`]} />
                  <Line name="Normal" dataKey="normal" stroke="#D9AD62" strokeWidth={1.8} dot={sparse ? { r: 2.5 } : false} connectNulls={true} />
                  <Line name="Anomaly" dataKey="anomaly" stroke="#D9233D" strokeWidth={1.8} dot={sparse ? { r: 2.5 } : false} connectNulls={true} />
                  <Line name="Risk Score" dataKey="risk" stroke="#FFE2A0" strokeWidth={1.4} strokeDasharray="4 3" dot={sparse ? { r: 2.5 } : false} connectNulls={true} />
                  {hot.map((h) => <ReferenceDot key={h.time} x={h.label} y={h.risk!} r={4} fill="#D9233D" stroke="#FFE2A0" />)}
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
      </div>
      {data?.has_data && <p className="mt-1.5 text-[10px] text-[var(--ink-soft)]">Normal/Anomaly = share of samples without/with an alert per bucket; Risk Score = highest alert risk (0–100).</p>}
    </section>
  );
}
