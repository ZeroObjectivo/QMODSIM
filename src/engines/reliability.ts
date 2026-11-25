import type { ReliabilityInput, ReliabilityResult } from '../types/simulation';
import { clamp } from './arrivals';

export function componentReliability(failureRatePerHour: number, hours: number): number {
  const rate = Math.max(0, failureRatePerHour);
  const t = Math.max(0, hours);
  return Math.exp(-rate * t);
}

export function seriesReliability(reliabilities: readonly number[]): number {
  return reliabilities.reduce((acc, r) => acc * clamp(r, 0, 1), 1);
}

export function parallelReliability(reliabilities: readonly number[]): number {
  const allFailProb = reliabilities.reduce((acc, r) => acc * (1 - clamp(r, 0, 1)), 1);
  return 1 - allFailProb;
}

export function inherentAvailability(mtbfHours: number, mttrHours: number): number {
  const mtbf = Math.max(0.01, mtbfHours);
  const mttr = Math.max(0, mttrHours);
  return mtbf / (mtbf + mttr);
}

/**
 * Evaluates Old Yorker's multi-branch POS, MySQL DB & GCash API reliability:
 * compares single-path series vs. parallel redundant links + COD/offline sync failover.
 */
export function evaluateBranchInfrastructure(input: ReliabilityInput): ReliabilityResult {
  const t = clamp(input.missionHours, 1, 8760);
  const links = Math.round(clamp(input.redundantLinks, 1, 4));

  const rIsp = componentReliability(input.ispFailureRate, t);
  const rMysql = componentReliability(input.mysqlFailureRate, t);
  const rGcash = componentReliability(input.gcashApiFailureRate, t);

  const seriesVal = seriesReliability([rIsp, rMysql, rGcash]);
  const parallelLinks = parallelReliability(Array.from({ length: links }, () => rIsp));
  // Hybrid: Parallel redundant ISP/4G failover + COD fallback (99.4% survival during GCash hiccups) + MySQL primary
  const rPaymentFailover = parallelReliability([rGcash, 0.994]);
  const hybridSystemReliability = seriesReliability([parallelLinks, rMysql, rPaymentFailover]);

  const availability = inherentAvailability(input.mtbfHours, input.mttrHours);
  const expectedAnnualDowntimeHours = (1 - availability) * 8760;

  const curvePoints: { hour: number; series: number; redundant: number }[] = [];
  for (let h = 0; h <= 720; h += 30) {
    const ri = componentReliability(input.ispFailureRate, h);
    const rm = componentReliability(input.mysqlFailureRate, h);
    const rg = componentReliability(input.gcashApiFailureRate, h);
    const pL = parallelReliability(Array.from({ length: links }, () => ri));
    curvePoints.push({
      hour: h,
      series: seriesReliability([ri, rm, rg]),
      redundant: seriesReliability([pL, rm, parallelReliability([rg, 0.994])]),
    });
  }

  return {
    seriesReliability: seriesVal,
    parallelLinkReliability: parallelLinks,
    hybridSystemReliability,
    inherentAvailability: availability,
    expectedAnnualDowntimeHours,
    curvePoints,
  };
}
