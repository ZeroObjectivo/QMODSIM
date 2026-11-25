import { useEffect, useRef } from 'react';
import type { QueueingResult, ThemeMode } from '../types/simulation';
import { buildBranchOrderSurgeProfile } from '../engines/arrivals';
import { getCanvasTheme } from './canvasTheme';

interface BranchKitchenCanvasProps {
  readonly theme: ThemeMode;
  readonly queue: QueueingResult;
  readonly surgeAmplitude: number;
  readonly branchName: string;
}

/**
 * Custom Old Yorker's HTML5 Canvas combining:
 * 1. Top half: Daily Branch Order Rush Curve λ(t) (12PM Lunch, 3:30PM Merienda, 7PM Dinner) vs. Grill Capacity (c·μ)
 * 2. Bottom half: Animated Kitchen Grill/Prep Stations (c) & Online/Walk-in Ticket Rail (K - c)
 */
export function BranchKitchenCanvas({
  theme,
  queue,
  surgeAmplitude,
  branchName,
}: BranchKitchenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ theme, queue, surgeAmplitude, branchName });
  stateRef.current = { theme, queue, surgeAmplitude, branchName };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const render = (timeMs: number) => {
      const { theme: activeTheme, queue: q, surgeAmplitude: amp, branchName: bName } =
        stateRef.current;
      const palette = getCanvasTheme(activeTheme);
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(240, Math.floor(rect.height));

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);

      // --- TOP PANEL: Daily Meal Rush Profile λ(t) (08:00 – 23:00) ---
      const padL = 44;
      const padR = 16;
      const padT = 22;
      const chartH = Math.floor(height * 0.46);
      const chartW = width - padL - padR;

      const profile = buildBranchOrderSurgeProfile(q.lambda, amp);
      const capacity = q.c * q.mu;
      const maxRate = Math.max(capacity * 1.25, ...profile.map((p) => p.rate), 25);

      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padT + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + chartW, y);
        ctx.stroke();

        const val = maxRate * (1 - i / 4);
        ctx.fillStyle = palette.muted;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(val.toFixed(0), padL - 6, y + 3);
      }

      // Grill capacity line (c · μ)
      const capY = padT + chartH * (1 - capacity / maxRate);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = palette.emerald;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, capY);
      ctx.lineTo(padL + chartW, capY);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = palette.emerald;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Kitchen c·μ = ${capacity.toFixed(1)}/hr`, padL + chartW, capY - 4);

      const minH = 8;
      const spanH = 15; // 08:00 -> 23:00

      ctx.beginPath();
      profile.forEach((pt, idx) => {
        const x = padL + ((pt.hour - minH) / spanH) * chartW;
        const y = padT + chartH * (1 - pt.rate / maxRate);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(padL + chartW, padT + chartH);
      ctx.lineTo(padL, padT + chartH);
      ctx.closePath();
      ctx.fillStyle = q.rho >= 0.95 ? palette.roseSoft : palette.primarySoft;
      ctx.fill();

      ctx.beginPath();
      profile.forEach((pt, idx) => {
        const x = padL + ((pt.hour - minH) / spanH) * chartW;
        const y = padT + chartH * (1 - pt.rate / maxRate);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = q.rho >= 0.95 ? palette.rose : palette.primary;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Animated shift clock scanner
      const scanHour = minH + ((timeMs * 0.0018) % spanH);
      const scanX = padL + ((scanHour - minH) / spanH) * chartW;
      ctx.strokeStyle = palette.amber;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(scanX, padT);
      ctx.lineTo(scanX, padT + chartH);
      ctx.stroke();

      ctx.fillStyle = palette.muted;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      for (const h of [8, 12, 15.5, 19, 23]) {
        const x = padL + ((h - minH) / spanH) * chartW;
        const label = h === 15.5 ? '15:30' : `${String(h).padStart(2, '0')}:00`;
        ctx.fillText(label, x, padT + chartH + 13);
      }

      ctx.fillStyle = palette.text;
      ctx.font = '600 11px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${bName} · Peak Order Surge λ(t) vs. Prep Capacity (c·μ)`, padL, 13);

      // --- BOTTOM PANEL: Kitchen Grill/Prep Stations (c) + Active Order Ticket Rail (K - c) ---
      const floorTop = padT + chartH + 26;
      const floorH = height - floorTop - 10;

      ctx.fillStyle = palette.text;
      ctx.font = '600 11px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `Kitchen Floor · Active Orders L = ${q.L.toFixed(2)} / K = ${q.K} · Overlooked/Dropped P_K = ${(q.pDrop * 100).toFixed(1)}%`,
        padL,
        floorTop + 8
      );

      const expectedBusy = Math.min(q.c, q.L);
      const expectedWaiting = Math.max(0, q.L - q.c);
      const railSlots = Math.max(0, q.K - q.c);
      const pulse = 0.5 + 0.5 * Math.sin(timeMs * 0.006);

      const baysAreaY = floorTop + 18;
      const baysH = Math.max(30, floorH - 22);
      const bayCols = Math.min(q.c, 5);
      const bayRows = Math.ceil(q.c / bayCols);
      const bayAreaW = Math.floor(chartW * 0.52);
      const cellW = Math.floor((bayAreaW - (bayCols - 1) * 6) / bayCols);
      const cellH = Math.min(34, Math.floor((baysH - (bayRows - 1) * 6) / bayRows));

      for (let i = 0; i < q.c; i++) {
        const col = i % bayCols;
        const row = Math.floor(i / bayCols);
        const bx = padL + col * (cellW + 6);
        const by = baysAreaY + row * (cellH + 6);
        const occupied = i < Math.round(expectedBusy);

        ctx.fillStyle = occupied
          ? q.rho >= 0.95
            ? palette.roseSoft
            : palette.primarySoft
          : palette.surface;
        ctx.strokeStyle = occupied
          ? q.rho >= 0.95
            ? palette.rose
            : palette.primary
          : palette.grid;
        ctx.lineWidth = 1;
        ctx.fillRect(bx, by, cellW, cellH);
        ctx.strokeRect(bx, by, cellW, cellH);

        ctx.fillStyle = occupied ? palette.text : palette.muted;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`GRILL ${i + 1}`, bx + cellW / 2, by + cellH / 2 + 3);

        if (occupied) {
          ctx.beginPath();
          ctx.arc(bx + cellW - 7, by + 7, 2.4 + pulse * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = q.rho >= 0.95 ? palette.rose : palette.primary;
          ctx.fill();
        }
      }

      // Order ticket rail (K - c)
      const waitX = padL + bayAreaW + 14;
      const waitW = chartW - bayAreaW - 14;
      ctx.fillStyle = palette.muted;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`ORDER TICKET RAIL (${railSlots} slots)`, waitX, baysAreaY - 4);

      const waitCols = Math.min(Math.max(railSlots, 1), 9);
      const slotSize = Math.min(18, Math.floor((waitW - (waitCols - 1) * 4) / waitCols));
      const filledWait = Math.round(expectedWaiting);

      for (let w = 0; w < railSlots; w++) {
        const col = w % waitCols;
        const row = Math.floor(w / waitCols);
        const sx = waitX + col * (slotSize + 4);
        const sy = baysAreaY + 2 + row * (slotSize + 4);
        if (sy + slotSize > height - 6) break;

        const isFull = w < filledWait;
        ctx.fillStyle = isFull
          ? w >= railSlots - 2 && q.pDrop > 0.05
            ? palette.rose
            : palette.amber
          : palette.surface;
        ctx.strokeStyle = palette.grid;
        ctx.lineWidth = 1;
        ctx.fillRect(sx, sy, slotSize, slotSize);
        ctx.strokeRect(sx, sy, slotSize, slotSize);
      }

      ctx.restore();
      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-[290px] w-full block"
      aria-label="Old Yorker's Branch Order Surge and Kitchen Prep Station Occupancy Canvas"
    />
  );
}
