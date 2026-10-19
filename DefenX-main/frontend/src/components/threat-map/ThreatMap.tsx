import { ChevronDown, Globe2, Network } from "lucide-react";
import { useMemo, useState } from "react";
import { usePoll } from "../../hooks/usePoll";
import { api } from "../../services/api";
import type { ThreatSource } from "../../types";

// Coarse continent outlines [lon, lat] used only to draw a dotted world backdrop.
const LAND: number[][][] = [
  [[-168, 66], [-140, 70], [-95, 72], [-62, 60], [-55, 48], [-75, 38], [-81, 25], [-97, 18], [-83, 9], [-105, 20], [-125, 40], [-135, 58]],
  [[-80, 10], [-50, 0], [-35, -8], [-40, -23], [-58, -38], [-68, -55], [-75, -40], [-72, -18], [-81, -5]],
  [[-10, 36], [0, 51], [20, 56], [40, 68], [75, 72], [130, 70], [170, 66], [150, 45], [122, 30], [105, 8], [78, 8], [60, 25], [40, 40], [28, 36]],
  [[-17, 21], [-5, 36], [32, 31], [43, 12], [51, 11], [40, -15], [32, -30], [18, -35], [10, -10], [8, 4], [-12, 8]],
  [[114, -22], [131, -12], [146, -18], [153, -28], [146, -39], [130, -32], [115, -34]],
];
const inPoly = (x: number, y: number, p: number[][]) => {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++)
    if (p[i][1] > y !== p[j][1] > y && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
  return c;
};

// Explicitly labelled demonstration values; never shown unless the user opts in.
const SAMPLE: ThreatSource[] = [
  { country: "United States", code: "US", count: 342 }, { country: "Russia", code: "RU", count: 281 },
  { country: "China", code: "CN", count: 256 }, { country: "Germany", code: "DE", count: 198 }, { country: "Netherlands", code: "NL", count: 157 },
];

export function ThreatMap() {
  const { data, loading } = usePoll(api.threatMap, 30000);
  const [sample, setSample] = useState(false);
  const live = !!data?.available;
  const sources = live ? data!.sources : sample ? SAMPLE : [];

  const dots = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let lon = -170; lon <= 175; lon += 4)
      for (let lat = 75; lat >= -58; lat -= 4)
        if (LAND.some((p) => inPoly(lon, lat, p))) out.push({ x: ((lon + 180) / 360) * 100, y: ((80 - lat) / 140) * 100 });
    return out;
  }, []);

  return (
    <section className="panel-dark gold-border relative p-4" aria-label="Live threat map">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="title-serif flex items-center gap-2 text-[17px]"><Network size={18} className="text-[#D9AD62]" />Live Threat Map</h2>
          <p className="text-[11px] text-[#D8C2B6]">Real-time cyber threat activity around the world</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-[#D9AD62]/60 px-3 py-1 text-xs"><Globe2 size={14} />Global View<ChevronDown size={13} /></span>
      </div>
      <div className="mt-2 flex gap-3">
        <div className="relative h-[150px] flex-1 overflow-hidden rounded-xl" role="img" aria-label="World map of threat activity">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full">
            {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={0.55} fill="#D9AD62" opacity={0.55} />)}
            {((live && data?.points) || (sample ? [[22, 35], [48, 28], [70, 38], [52, 55], [80, 62]] : [])).map((pt: any, i: number) => {
              const x = Array.isArray(pt) ? pt[0] : pt.x;
              const y = Array.isArray(pt) ? pt[1] : pt.y;
              const sev = Array.isArray(pt) ? ["High", "Medium", "Low"][i % 3] : pt.severity || "Medium";
              const col = sev === "High" ? "#D9233D" : sev === "Medium" ? "#D99027" : "#34d399";
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={2.8} fill={col} opacity={0.35} className="animate-ping" />
                  <circle cx={x} cy={y} r={1.3} fill={col} />
                </g>
              );
            })}
          </svg>
          {!live && (
            <div className="absolute inset-0 grid place-content-center bg-black/45 p-3 text-center" role="status">
              <p className="text-sm font-semibold text-[#FFE2A0]">{sample ? "SAMPLE DATA — not real telemetry" : loading ? "Checking source…" : "Threat map unavailable"}</p>
              {!sample && !loading && <p className="mx-auto max-w-[32ch] text-[11px] text-[#D8C2B6]">{data?.reason ?? "Backend unreachable."}</p>}
            </div>
          )}
        </div>
        <div className="w-[150px] rounded-xl border border-[#D9AD62]/30 bg-black/20 p-2 text-[11px]">
          <p className="mb-1 font-semibold">Top Threat Sources</p>
          {sources.length === 0 ? <p className="text-[#D8C2B6]">No source data</p> : sources.map((s) => (
            <p key={s.code} className="flex justify-between py-0.5"><span>{s.country}</span><b>{s.count}</b></p>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="flex gap-3"><Dot c="#34d399" l="Low" /><Dot c="#D99027" l="Medium" /><Dot c="#D9233D" l="High" /></span>
        {!live && <label className="flex items-center gap-1.5 text-[#D8C2B6]"><input type="checkbox" checked={sample} onChange={(e) => setSample(e.target.checked)} />Show sample data</label>}
      </div>
    </section>
  );
}
const Dot = ({ c, l }: { c: string; l: string }) => <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full" style={{ background: c }} />{l}</span>;
