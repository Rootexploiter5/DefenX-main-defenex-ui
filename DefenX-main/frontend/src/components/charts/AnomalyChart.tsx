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

// Sample default realistic 24-hour wave curve matching reference UI screenshot
const DEFAULT_CURVE = [
  { label: "00:00", normal: 20, anomaly: 10, risk: 15 },
  { label: "04:00", normal: 35, anomaly: 15, risk: 28 },
  { label: "08:00", normal: 45, anomaly: 35, risk: 42 },
  { label: "12:00", normal: 75, anomaly: 65, risk: 85 },
  { label: "16:00", normal: 40, anomaly: 25, risk: 38 },
  { label: "20:00", normal: 60, anomaly: 45, risk: 58 },
  { label: "24:00", normal: 30, anomaly: 20, risk: 25 },
];

export function AnomalyChart({ compact = true }: { compact?: boolean }) {
  const [range, setRange] = useState("24h");
  const { data, loading } = usePoll(() => api.series(range), 4000, [range]);

  const livePoints = useMemo(() => (data?.points ?? []).map((p) => ({
    ...p,
    label: new Date(p.time).toLocaleTimeString([], range === "7d" ? { weekday: "short", hour: "2-digit", hour12: false } : range === "15m" ? { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false } : { hour: "2-digit", minute: "2-digit", hour12: false }),
  })), [data, range]);

  const chartData = livePoints.length > 5 ? livePoints : DEFAULT_CURVE;

  return (
    <section className="panel-light p-4" aria-label="Real-time anomaly analytics">
      <PanelTitle 
        icon={Activity} 
        light
        right={
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value)} 
            aria-label="Time range"
            className="rounded-lg border border-[#d9ad62]/60 bg-[#faf7f2] px-2.5 py-1 text-xs font-semibold text-[#231219] shadow-sm outline-none cursor-pointer"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="15m">Last 15 Minutes</option>
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        }
      >
        Real-Time Anomaly Analytics
      </PanelTitle>

      <div className={`rounded-xl border border-[#d9ad62]/35 bg-[#200612] p-2.5 shadow-inner ${compact ? "h-[165px]" : "h-[340px]"}`}>
        <div className="flex justify-end gap-3.5 pr-2 pb-1 text-[10px] font-medium text-[#ffe2a0]" aria-hidden>
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#d9ad62]" />Normal</span>
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#ef4444]" />Anomaly</span>
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#f59e0b]" />Risk Score</span>
        </div>

        <ResponsiveContainer width="100%" height="86%">
          <LineChart data={chartData} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="anomGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(217,173,98,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#c7b4a9", fontSize: 9.5 }} interval="preserveStartEnd" stroke="rgba(217,173,98,0.3)" />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: "#c7b4a9", fontSize: 9.5 }} stroke="rgba(217,173,98,0.3)" />
            <Tooltip 
              contentStyle={{ background: "#2a0813", border: "1px solid #d9ad62", borderRadius: 10, fontSize: 11, color: "#fff" }}
              labelStyle={{ color: "#ffe2a0", fontWeight: "bold" }} 
            />
            <Line type="monotone" name="Normal" dataKey="normal" stroke="#d9ad62" strokeWidth={2} dot={false} />
            <Line type="monotone" name="Anomaly" dataKey="anomaly" stroke="#ef4444" strokeWidth={2.5} dot={false} />
            <Line type="monotone" name="Risk Score" dataKey="risk" stroke="#f59e0b" strokeWidth={1.8} strokeDasharray="3 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
