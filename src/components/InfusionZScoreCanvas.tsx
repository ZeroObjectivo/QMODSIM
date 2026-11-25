import { useEffect, useRef } from 'react';
import type { AnomalyTick, ThemeMode } from '../types/simulation';
import { getCanvasTheme } from './canvasTheme';

interface InfusionZScoreCanvasProps {
  readonly theme: ThemeMode;
  readonly ticks: readonly AnomalyTick[];
  readonly threshold: number;
}

/**
 * Streaming IV Infusion Dosage Z-Score Oscilloscope showing rolling μ_t,
 * ±τ_crit clinical lockout bands, and flagged dosage tampering spikes.
 */
export function InfusionZScoreCanvas({ theme, ticks, threshold }: InfusionZScoreCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = getCanvasTheme(theme);
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(300, Math.floor(rect.width));
    const height = Math.max(210, Math.floor(rect.height));

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);

    const padL = 44;
    const padR = 16;
    const padT = 24;
    const padB = 22;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    const minY = 38;
    const maxY = 66;
    const toY = (v: number) => padT + chartH * (1 - (v - minY) / (maxY - minY));

    // Grid
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    for (const val of [40, 45, 50, 55, 60, 65]) {
      const y = toY(val);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + chartW, y);
      ctx.stroke();

      ctx.fillStyle = palette.muted;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${val}`, padL - 6, y + 3);
    }

    // Upper/Lower threshold bands around baseline 50 mL/hr (σ ≈ 1.4)
    const bandHalf = threshold * 1.4;
    const upperY = toY(50 + bandHalf);
    const lowerY = toY(50 - bandHalf);

    ctx.fillStyle = palette.cyanSoft;
    ctx.fillRect(padL, upperY, chartW, lowerY - upperY);

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = palette.amber;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, upperY);
    ctx.lineTo(padL + chartW, upperY);
    ctx.moveTo(padL, lowerY);
    ctx.lineTo(padL + chartW, lowerY);
    ctx.stroke();
    ctx.restore();

    // Waveform
    ctx.beginPath();
    ticks.forEach((tk, idx) => {
      const x = padL + (idx / Math.max(1, ticks.length - 1)) * chartW;
      const y = toY(tk.value);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = palette.cyan;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Anomaly markers
    let anomalyCount = 0;
    ticks.forEach((tk, idx) => {
      if (!tk.isAnomaly) return;
      anomalyCount += 1;
      const x = padL + (idx / Math.max(1, ticks.length - 1)) * chartW;
      const y = toY(tk.value);

      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = palette.rose;
      ctx.fill();

      ctx.fillStyle = palette.rose;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Z=${tk.zScore.toFixed(1)}`, x, y - 8);
    });

    ctx.fillStyle = palette.text;
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `IV Infusion Dosage Telemetry (mL/hr) · Threshold τ_crit = ±${threshold.toFixed(1)}σ · Flagged: ${anomalyCount}`,
      padL,
      14
    );

    ctx.restore();
  }, [theme, ticks, threshold]);

  return (
    <canvas
      ref={canvasRef}
      className="h-[220px] w-full block"
      aria-label="IV Infusion Dosage Z-Score Anomaly Detection Canvas"
    />
  );
}
