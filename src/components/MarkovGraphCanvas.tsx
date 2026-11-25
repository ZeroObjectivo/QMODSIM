import { useEffect, useRef } from 'react';
import type { MarkovAnalysisResult, ThemeMode } from '../types/simulation';
import { getCanvasTheme } from './canvasTheme';

interface MarkovGraphCanvasProps {
  readonly theme: ThemeMode;
  readonly markov: MarkovAnalysisResult;
}

/**
 * Animated 5-state Hospital VLAN Absorbing Markov State Graph:
 * S0 Triage Kiosk -> S1 EHR Staging -> S2 ICU VLAN -> {S3 Quarantined, S4 Compromised}
 */
export function MarkovGraphCanvas({ theme, markov }: MarkovGraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ theme, markov });
  stateRef.current = { theme, markov };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const render = (timeMs: number) => {
      const { theme: activeTheme, markov: m } = stateRef.current;
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

      const nodes = [
        { idx: 0, x: width * 0.14, y: height * 0.52, code: 'S₀', name: 'Triage Kiosk', color: palette.cyan },
        { idx: 1, x: width * 0.41, y: height * 0.52, code: 'S₁', name: 'EHR Staging', color: palette.amber },
        { idx: 2, x: width * 0.67, y: height * 0.52, code: 'S₂', name: 'ICU VLAN', color: palette.amber },
        { idx: 3, x: width * 0.87, y: height * 0.24, code: 'S₃', name: 'Quarantined', color: palette.emerald },
        { idx: 4, x: width * 0.87, y: height * 0.78, code: 'S₄', name: 'Compromised', color: palette.rose },
      ] as const;

      const edges: readonly { from: number; to: number; curve: number }[] = [
        { from: 0, to: 1, curve: 0 },
        { from: 1, to: 2, curve: 0 },
        { from: 0, to: 3, curve: -46 },
        { from: 1, to: 3, curve: -24 },
        { from: 2, to: 3, curve: 0 },
        { from: 1, to: 4, curve: 26 },
        { from: 2, to: 4, curve: 0 },
      ];

      // Draw directed edges + animated telemetry packet dots
      const tPhase = (timeMs * 0.00075) % 1;

      for (const edge of edges) {
        const prob = m.transitionMatrix[edge.from]?.[edge.to] ?? 0;
        if (prob < 0.005) continue;

        const a = nodes[edge.from]!;
        const b = nodes[edge.to]!;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2 + edge.curve;

        const strokeColor =
          edge.to === 3 ? palette.emerald : edge.to === 4 ? palette.rose : palette.cyan;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx, my, b.x, b.y);
        ctx.strokeStyle = strokeColor;
        ctx.globalAlpha = Math.max(0.25, Math.min(0.95, prob * 1.4));
        ctx.lineWidth = 1.2 + prob * 2.5;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Animated flow particle along quadratic Bezier
        const u = (tPhase + edge.from * 0.23 + edge.to * 0.11) % 1;
        const inv = 1 - u;
        const px = inv * inv * a.x + 2 * inv * u * mx + u * u * b.x;
        const py = inv * inv * a.y + 2 * inv * u * my + u * u * b.y;
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();

        // Transition probability label
        const lx = 0.25 * a.x + 0.5 * mx + 0.25 * b.x;
        const ly = 0.25 * a.y + 0.5 * my + 0.25 * b.y - 6;
        ctx.fillStyle = palette.muted;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(prob.toFixed(2), lx, ly);
      }

      // Draw nodes
      for (const node of nodes) {
        const radius = 24;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = palette.surface;
        ctx.fill();
        ctx.lineWidth = node.idx >= 3 ? 2.2 : 1.5;
        ctx.strokeStyle = node.color;
        ctx.stroke();

        // Double ring for absorbing states
        if (node.idx >= 3) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius - 4, 0, Math.PI * 2);
          ctx.lineWidth = 1;
          ctx.strokeStyle = node.color;
          ctx.stroke();
        }

        ctx.fillStyle = palette.text;
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.code, node.x, node.y + 4);

        ctx.fillStyle = palette.muted;
        ctx.font = '10px "Inter", sans-serif';
        ctx.fillText(node.name, node.x, node.y + radius + 14);
      }

      // Header summary
      const pSafeFromS0 = (m.absorptionProbabilities[0]?.[0] ?? 0) * 100;
      const pBreachFromS0 = (m.absorptionProbabilities[0]?.[1] ?? 0) * 100;
      ctx.fillStyle = palette.text;
      ctx.font = '600 11px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `From S₀ → P(Quarantined) = ${pSafeFromS0.toFixed(1)}% · P(Breach) = ${pBreachFromS0.toFixed(1)}%`,
        12,
        16
      );

      ctx.restore();
      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-[260px] w-full block"
      aria-label="Hospital VLAN Absorbing Markov Chain State Graph"
    />
  );
}
