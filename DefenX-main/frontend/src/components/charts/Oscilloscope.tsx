import { useEffect, useRef, useState } from "react";
import { Activity, Radio, Cpu, Wifi } from "lucide-react";
import { useStore } from "../../app/store";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export function Oscilloscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resources, wsUp } = useStore();
  const reduced = useReducedMotion();
  const [ch1Enabled, setCh1Enabled] = useState(true);
  const [ch2Enabled, setCh2Enabled] = useState(true);

  // Store latest readings in refs for the 60fps canvas loop
  const cpuRef = useRef<number>(20);
  const netRef = useRef<number>(10);
  const pointsRef = useRef<{ cpu: number; net: number }[]>([]);

  useEffect(() => {
    if (resources.data) {
      cpuRef.current = resources.data.cpu_percent || 15;
      const netKb = (resources.data.network_bytes_per_sec || 0) / 1024;
      netRef.current = Math.min(100, Math.max(5, netKb / 10));
    }
  }, [resources.data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    // Buffer of 200 points
    const maxPoints = 240;
    if (pointsRef.current.length === 0) {
      for (let i = 0; i < maxPoints; i++) {
        pointsRef.current.push({ cpu: 20, net: 10 });
      }
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Subtle phosphor trail persistence
      ctx.fillStyle = "rgba(8, 10, 15, 0.26)";
      ctx.fillRect(0, 0, width, height);

      // Draw oscilloscope grid lines
      ctx.strokeStyle = "rgba(217, 173, 98, 0.08)";
      ctx.lineWidth = 1;
      const gridX = 24;
      const gridY = 16;
      for (let x = 0; x < width; x += gridX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center line
      ctx.strokeStyle = "rgba(217, 173, 98, 0.16)";
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (!reduced) {
        phase += 0.08;
      }

      // Synthesize realistic high-frequency oscillation around live sensor metrics
      const targetCpu = cpuRef.current;
      const targetNet = netRef.current;
      
      const newCpu = Math.max(2, Math.min(98, targetCpu + Math.sin(phase * 2.5) * 6 + Math.cos(phase * 5.1) * 3));
      const newNet = Math.max(2, Math.min(98, targetNet + Math.cos(phase * 3.8) * 5 + Math.sin(phase * 7.2) * 2));

      pointsRef.current.shift();
      pointsRef.current.push({ cpu: newCpu, net: newNet });

      const points = pointsRef.current;
      const stepX = width / (maxPoints - 1);

      // Draw Channel 1: CPU Waveform (Gold / Amber)
      if (ch1Enabled) {
        ctx.beginPath();
        ctx.strokeStyle = "#D9AD62";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "rgba(217, 173, 98, 0.65)";
        ctx.shadowBlur = 8;

        for (let i = 0; i < points.length; i++) {
          const x = i * stepX;
          // Invert y: 0 is top, height is bottom
          const val = points[i].cpu;
          const y = (height * 0.45) - (val / 100) * (height * 0.38);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw Channel 2: Network I/O Waveform (Phosphor Green)
      if (ch2Enabled) {
        ctx.beginPath();
        ctx.strokeStyle = "#10B981";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "rgba(16, 185, 129, 0.65)";
        ctx.shadowBlur = 8;

        for (let i = 0; i < points.length; i++) {
          const x = i * stepX;
          const val = points[i].net;
          const y = (height * 0.88) - (val / 100) * (height * 0.38);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (!reduced) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [ch1Enabled, ch2Enabled, reduced]);

  const cpuVal = resources.data?.cpu_percent?.toFixed(1) ?? "0.0";
  const netBytes = resources.data?.network_bytes_per_sec ?? 0;
  const netStr = (netBytes / 1024).toFixed(1);

  return (
    <section className="glass-panel p-3.5" aria-label="Live anomaly oscilloscope">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#d9ad62]" />
          <h2 className="title-serif text-[15px] font-bold text-[#f8f5f0]">Live Sensor Oscilloscope</h2>
          <span className="font-mono text-[10px] text-[#a7a3ad] tracking-wider">[CH1: CPU_CLK / CH2: NET_EGRESS]</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Channel Toggles */}
          <button 
            onClick={() => setCh1Enabled(!ch1Enabled)}
            className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[10.5px] transition-all ${
              ch1Enabled ? "border-[#d9ad62]/50 bg-[#d9ad62]/15 text-[#ffe2a0]" : "border-white/10 bg-black/30 text-[#a7a3ad]"
            }`}
          >
            <Cpu size={12} />
            <span>CH1 CPU ({cpuVal}%)</span>
          </button>

          <button 
            onClick={() => setCh2Enabled(!ch2Enabled)}
            className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[10.5px] transition-all ${
              ch2Enabled ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-black/30 text-[#a7a3ad]"
            }`}
          >
            <Wifi size={12} />
            <span>CH2 NET ({netStr} KB/s)</span>
          </button>

          <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
            <Radio size={12} className={wsUp ? "animate-pulse" : ""} />
            <span>{wsUp ? "500Hz SYNC" : "POLL"}</span>
          </div>
        </div>
      </div>

      <div className="relative h-[90px] w-full overflow-hidden rounded-xl border border-[#d9ad62]/20 bg-[#080a0f]">
        <canvas 
          ref={canvasRef} 
          width={900} 
          height={90} 
          className="size-full"
        />
        <div className="pointer-events-none absolute bottom-1 right-2 font-mono text-[9px] text-[#a7a3ad]/60">
          SWEEP: 50ms/DIV · TIMEBASE: REALTIME
        </div>
      </div>
    </section>
  );
}
