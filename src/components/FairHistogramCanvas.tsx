import { useEffect, useRef } from 'react';
import type { FairSimulationResult, ThemeMode } from '../types/simulation';
import { getCanvasTheme } from './canvasTheme';

interface FairHistogramCanvasProps {
  readonly theme: ThemeMode;
  readonly fair: FairSimulationResult;
}

function formatPhpShort(val: number): string {
  if (val >= 1_000_000) return `₱${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `₱${(val / 1_000).toFixed(0)}K`;
  return `₱${val.toFixed(0)}`;
}

export function FairHistogramCanvas({ theme, fair }: FairHistogramCanvasProps) {
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
    const height = Math.max(220, Math.floor(rect.height));

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);

    const padL = 44;
    const padR = 16;
    const padT = 26;
    const padB = 28;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    const bins = fair.histogram;
    const maxFreq = Math.max(0.01, ...bins.map((b) => b.frequency));
    const maxVal = bins[bins.length - 1]?.max ?? 1;

    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + chartW, y);
      ctx.stroke();

      const pct = maxFreq * (1 - i / 4) * 100;
      ctx.fillStyle = palette.muted;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${pct.toFixed(0)}%`, padL - 6, y + 3);
    }

    const barW = chartW / Math.max(1, bins.length);
    bins.forEach((bin, idx) => {
      const bh = (bin.frequency / maxFreq) * chartH;
      const x = padL + idx * barW;
      const y = padT + chartH - bh;
      const inTail = bin.min >= fair.aleP95;

      ctx.fillStyle = inTail ? palette.rose : palette.primary;
      ctx.globalAlpha = inTail ? 0.85 : 0.72;
      ctx.fillRect(x + 1, y, Math.max(1, barW - 2), bh);
    });
    ctx.globalAlpha = 1;

    const meanX = padL + Math.min(1, fair.aleMean / maxVal) * chartW;
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = palette.emerald;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(meanX, padT);
    ctx.lineTo(meanX, padT + chartH);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = palette.emerald;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`ALE ${formatPhpShort(fair.aleMean)}`, Math.min(meanX + 4, width - 92), padT + 11);

    const p95X = padL + Math.min(1, fair.aleP95 / maxVal) * chartW;
    ctx.strokeStyle = palette.rose;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p95X, padT);
    ctx.lineTo(p95X, padT + chartH);
    ctx.stroke();

    ctx.fillStyle = palette.rose;
    ctx.textAlign = 'right';
    ctx.fillText(`P95 ${formatPhpShort(fair.aleP95)}`, Math.max(p95X - 4, padL + 75), padT + 23);

    ctx.fillStyle = palette.muted;
    ctx.textAlign = 'center';
    for (let t = 0; t <= 4; t++) {
      const x = padL + (chartW / 4) * t;
      ctx.fillText(formatPhpShort((maxVal / 4) * t), x, height - 8);
    }

    ctx.fillStyle = palette.text;
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `FAIR Annual Loss Exposure (${fair.trials.toLocaleString()} Trials · Shrinkage, Fake Receipts & RA 10173)`,
      padL,
      15
    );

    ctx.restore();
  }, [theme, fair]);

  return (
    <canvas
      ref={canvasRef}
      className="h-[240px] w-full block"
      aria-label="FAIR Monte Carlo Multi-Branch Risk Histogram"
    />
  );
}
