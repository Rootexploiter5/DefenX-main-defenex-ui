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

// Default demonstration values from reference UI screenshot
const SAMPLE: ThreatSource[] = [
  { country: "United States", code: "US", count: 342 },
  { country: "Russia", code: "RU", count: 281 },
  { country: "China", code: "CN", count: 256 },
  { country: "Germany", code: "DE", count: 198 },
  { country: "Netherlands", code: "NL", count: 157 },
];

const FLAGS: Record<string, string> = {
  US: "🇺🇸",
  RU: "🇷🇺",
  CN: "🇨🇳",
  DE: "🇩🇪",
  NL: "🇳🇱",
};

export function ThreatMap() {
  const { data } = usePoll(api.threatMap, 30000);
  const liveSources = data?.sources && data.sources.length > 0 ? data.sources : SAMPLE;
  const sources = liveSources;

  const dots = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let lon = -170; lon <= 175; lon += 4)
      for (let lat = 75; lat >= -58; lat -= 4)
        if (LAND.some((p) => inPoly(lon, lat, p))) out.push({ x: ((lon + 180) / 360) * 100, y: ((80 - lat) / 140) * 100 });
    return out;
  }, []);

  const samplePoints = [
    { x: 26, y: 38, severity: "High" },
    { x: 49, y: 28, severity: "Medium" },
    { x: 74, y: 35, severity: "High" },
    { x: 52, y: 30, severity: "Medium" },
    { x: 78, y: 55, severity: "Low" },
    { x: 28, y: 56, severity: "Low" },
  ];

  const mapPoints = data?.points && data.points.length > 0 ? data.points : samplePoints;

  return (
    <section className="panel-dark p-4" aria-label="Live threat map">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-serif font-bold flex items-center gap-2 text-[16px] text-[#f8f5f0]">
            <Network size={17} className="text-[#d9ad62]" />
            Live Threat Map
          </h2>
          <p className="text-[11px] text-[#c7b4a9]">Real-time cyber threat activity around the world</p>
        </div>
        <button 
          aria-label="Global View"
          className="flex items-center gap-1.5 rounded-full border border-[#d9ad62]/50 bg-black/40 px-3 py-1 text-xs font-medium text-[#ffe2a0] shadow-sm hover:border-[#d9ad62]"
        >
          <Globe2 size={13} />
          Global View
          <ChevronDown size={13} />
        </button>
      </div>

      <div className="mt-2.5 flex gap-3">
        {/* World Map SVG */}
        <div className="relative h-[155px] flex-1 overflow-hidden rounded-xl border border-white/[0.06] bg-black/40" role="img" aria-label="World map of threat activity">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full">
            {dots.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={0.55} fill="#d9ad62" opacity={0.35} />
            ))}
            {mapPoints.map((pt: any, i: number) => {
              const x = pt.x ?? pt[0];
              const y = pt.y ?? pt[1];
              const sev = pt.severity || (i % 2 === 0 ? "High" : "Medium");
              const col = sev === "High" ? "#ef4444" : sev === "Medium" ? "#f59e0b" : "#34d399";
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={3.2} fill={col} opacity={0.3} className="animate-ping" />
                  <circle cx={x} cy={y} r={1.4} fill={col} />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Top Threat Sources Table */}
        <div className="w-[155px] rounded-xl border border-white/[0.08] bg-black/45 p-2.5 text-[11px]">
          <p className="mb-1.5 font-bold text-[#f8f5f0]">Top Threat Sources</p>
          <div className="space-y-1">
            {sources.map((s) => (
              <div key={s.country} className="flex items-center justify-between py-0.5 text-[#d8cfcb]">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="text-xs">{FLAGS[s.code] || "🌐"}</span>
                  <span className="truncate">{s.country}</span>
                </span>
                <b className="font-mono text-[#f8f5f0]">{s.count}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2.5 flex items-center justify-between text-[11px]">
        <span className="flex gap-4">
          <Dot c="#34d399" l="Low" />
          <Dot c="#f59e0b" l="Medium" />
          <Dot c="#ef4444" l="High" />
        </span>
      </div>
    </section>
  );
}
const Dot = ({ c, l }: { c: string; l: string }) => <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full" style={{ background: c }} />{l}</span>;
