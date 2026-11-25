import type { ThemeMode } from '../types/simulation';

export interface CanvasPalette {
  readonly bg: string;
  readonly surface: string;
  readonly grid: string;
  readonly axis: string;
  readonly text: string;
  readonly muted: string;
  readonly primary: string;
  readonly primarySoft: string;
  readonly emerald: string;
  readonly emeraldSoft: string;
  readonly amber: string;
  readonly rose: string;
  readonly roseSoft: string;
}

/**
 * Old Yorker's Warm Diner / Retail Operations Canvas Palette
 * (Warm Stone Paper in Light mode, Grillhouse Charcoal in Dark mode)
 */
export function getCanvasTheme(theme: ThemeMode): CanvasPalette {
  if (theme === 'light') {
    return {
      bg: '#FFFFFF',
      surface: '#FAF8F5',
      grid: '#E7E2D8',
      axis: '#A8A29E',
      text: '#1C1917',
      muted: '#57534E',
      primary: '#C2410C',
      primarySoft: 'rgba(194, 65, 12, 0.14)',
      emerald: '#059669',
      emeraldSoft: 'rgba(5, 150, 105, 0.15)',
      amber: '#D97706',
      rose: '#BE123C',
      roseSoft: 'rgba(190, 18, 60, 0.14)',
    };
  }
  return {
    bg: '#171513',
    surface: '#23201D',
    grid: '#2E2A26',
    axis: '#78716C',
    text: '#F5F5F4',
    muted: '#A8A29E',
    primary: '#F59E0B',
    primarySoft: 'rgba(245, 158, 11, 0.16)',
    emerald: '#34D399',
    emeraldSoft: 'rgba(52, 211, 153, 0.16)',
    amber: '#FB923C',
    rose: '#FB7185',
    roseSoft: 'rgba(251, 113, 133, 0.16)',
  };
}
