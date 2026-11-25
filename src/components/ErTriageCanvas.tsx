import { useEffect, useRef } from 'react';
import type { QueueingResult, ThemeMode } from '../types/simulation';
import { buildDailyErSurgeProfile } from '../engines/arrivals';
import { getCanvasTheme } from './canvasTheme';

interface ErTriageCanvasProps {
  readonly theme: ThemeMode;
  readonly queue: QueueingResult;
  readonly surgeAmplitude: number;
}

/**
 * Custom AEGIS-ER HTML5 Canvas combining:
 * 1. Top half: 24-hour Non-Homogeneous ER Arrival Surge curve λ(t) vs. Total Bay Capacity (c·μ)
 * 2. Bottom half: Animated physical ER Triage Floor showing c active bays & K-c waiting chairs
 */
export function ErTriageCanvas({ theme, queue, surgeAmplitude }: ErTriageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ theme, queue, surgeAmplitude });
  stateRef.current = { theme, queue, surgeAmplitude };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const render = (timeMs: number) => {
      const { theme: activeTheme, queue: q, surgeAmplitude: amp } = stateRef.current;
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

      // --- TOP PANEL: 24h Non-Homogeneous Arrival Rate λ(t) ---
      const padL = 44;
      const padR = 16;
      const padT = 22;
      const chartH = Math.floor(height * 0.46);
      const chartW = width - padL - padR;

      const profile = buildDailyErSurgeProfile(q.lambda, amp);
      const capacity = q.c * q.mu;
      const maxRate = Math.max(capacity * 1.25, ...profile.map((p) => p.rate), 20);

      // Grid lines
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

      // Capacity line (c · μ)
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
      ctx.fillText(`c·μ = ${capacity.toFixed(1)}/hr`, padL + chartW, capY - 4);

      // Filled surge area
      ctx.beginPath();
      profile.forEach((pt, idx) => {
        const x = padL + (pt.hour / 24) * chartW;
        const y = padT + chartH * (1 - pt.rate / maxRate);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(padL + chartW, padT + chartH);
      ctx.lineTo(padL, padT + chartH);
      ctx.closePath();
      ctx.fillStyle = q.rho >= 0.95 ? palette.roseSoft : palette.cyanSoft;
      ctx.fill();

      // Surge stroke
      ctx.beginPath();
      profile.forEach((pt, idx) => {
        const x = padL + (pt.hour / 24) * chartW;
        const y = padT + chartH * (1 - pt.rate / maxRate);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = q.rho >= 0.95 ? palette.rose : palette.cyan;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Animated time-of-day scanner
      const scanHour = ((timeMs * 0.0022) % 24);
      const scanX = padL + (scanHour / 24) * chartW;
      ctx.strokeStyle = palette.amber;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(scanX, padT);
      ctx.lineTo(scanX, padT + chartH);
      ctx.stroke();

      // X-axis hour labels
      ctx.fillStyle = palette.muted;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      for (let h = 0; h <= 24; h += 6) {
        const x = padL + (h / 24) * chartW;
        ctx.fillText(`${String(h).padStart(2, '0')}:00`, x, padT + chartH + 13);
      }

      ctx.fillStyle = palette.text;
      ctx.font = '600 11px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('24h ER Surge Rate λ(t) vs. Service Capacity (c·μ)', padL, 13);

      // --- BOTTOM PANEL: Physical ER Triage Bays (c) + Holding Buffer (K - c) ---
      const floorTop = padT + chartH + 26;
      const floorH = height - floorTop - 10;

      ctx.fillStyle = palette.text;
      ctx.font = '600 11px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `ER Floor State · Expected Occupancy L = ${q.L.toFixed(2)} / K = ${q.K} · Drop P_K = ${(q.pDrop * 100).toFixed(1)}%`,
        padL,
        floorTop + 8
      );

      const expectedBusyBays = Math.min(q.c, q.L);
      const expectedWaiting = Math.max(0, q.L - q.c);
      const waitingSlots = Math.max(0, q.K - q.c);
      const pulse = 0.5 + 0.5 * Math.sin(timeMs * 0.005);

      const baysAreaY = floorTop + 18;
      const baysH = Math.max(30, floorH - 22);
      const bayCols = Math.min(q.c, 6);
      const bayRows = Math.ceil(q.c / bayCols);
      const bayAreaW = Math.floor(chartW * 0.52);
      const cellW = Math.floor((bayAreaW - (bayCols - 1) * 6) / bayCols);
      const cellH = Math.min(34, Math.floor((baysH - (bayRows - 1) * 6) / bayRows));

      for (let i = 0; i < q.c; i++) {
        const col = i % bayCols;
        const row = Math.floor(i / bayCols);
        const bx = padL + col * (cellW + 6);
        const by = baysAreaY + row * (cellH + 6);
        const occupied = i < Math.round(expectedBusyBays);

        ctx.fillStyle = occupied
          ? q.rho >= 0.95
            ? palette.roseSoft
            : palette.cyanSoft
          : palette.surface;
        ctx.strokeStyle = occupied
          ? q.rho >= 0.95
            ? palette.rose
            : palette.cyan
          : palette.grid;
        ctx.lineWidth = 1;
        ctx.fillRect(bx, by, cellW, cellH);
        ctx.strokeRect(bx, by, cellW, cellH);

        ctx.fillStyle = occupied ? palette.text : palette.muted;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`BAY ${i + 1}`, bx + cellW / 2, by + cellH / 2 + 3);

        if (occupied) {
          ctx.beginPath();
          ctx.arc(bx + cellW - 7, by + 7, 2.5 + pulse * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = q.rho >= 0.95 ? palette.rose : palette.cyan;
          ctx.fill();
        }
      }

      // Waiting buffer chairs (K - c)
      const waitX = padL + bayAreaW + 14;
      const waitW = chartW - bayAreaW - 14;
      ctx.fillStyle = palette.muted;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`HOLDING BUFFER (${waitingSlots} slots)`, waitX, baysAreaY - 4);

      const waitCols = Math.min(Math.max(waitingSlots, 1), 8);
      const slotSize = Math.min(18, Math.floor((waitW - (waitCols - 1) * 4) / waitCols));
      const filledWait = Math.round(expectedWaiting);

      for (let w = 0; w < waitingSlots; w++) {
        const col = w % waitCols;
        const row = Math.floor(w / waitCols);
        const sx = waitX + col * (slotSize + 4);
        const sy = baysAreaY + 2 + row * (slotSize + 4);
        if (sy + slotSize > height - 6) break;

        const isFull = w < filledWait;
        ctx.fillStyle = isFull
          ? w >= waitingSlots - 2 && q.pDrop > 0.05
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
      aria-label="ER Triage Surge Curve and Triage Bay Occupancy Canvas"
    />
  );
}
