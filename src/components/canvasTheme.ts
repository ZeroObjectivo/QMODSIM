import type { ThemeMode } from '../types/simulation';

export interface CanvasPalette {
  readonly bg: string;
  readonly surface: string;
  readonly grid: string;
  readonly axis: string;
  readonly text: string;
  readonly muted: string;
  readonly cyan: string;
  readonly cyanSoft: string;
  readonly emerald: string;
  readonly emeraldSoft: string;
  readonly amber: string;
  readonly rose: string;
  readonly roseSoft: string;
}

export function getCanvasTheme(theme: ThemeMode): CanvasPalette {
  if (theme === 'light') {
    return {
      bg: '#FFFFFF',
      surface: '#F8FAFC',
      grid: '#E2E8F0',
      axis: '#94A3B8',
      text: '#0F172A',
      muted: '#475569',
      cyan: '#0284C7',
      cyanSoft: 'rgba(2, 132, 199, 0.14)',
      emerald: '#059669',
      emeraldSoft: 'rgba(5, 150, 105, 0.15)',
      amber: '#D97706',
      rose: '#E11D48',
      roseSoft: 'rgba(225, 29, 72, 0.14)',
    };
  }
  return {
    bg: '#0F172A',
    surface: '#111C33',
    grid: '#1E293B',
    axis: '#475569',
    text: '#F1F5F9',
    muted: '#94A3B8',
    cyan: '#22D3EE',
    cyanSoft: 'rgba(34, 211, 238, 0.14)',
    emerald: '#34D399',
    emeraldSoft: 'rgba(52, 211, 153, 0.16)',
    amber: '#FBBF24',
    rose: '#FB7185',
    roseSoft: 'rgba(251, 113, 133, 0.16)',
  };
}
