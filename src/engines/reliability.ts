import type { ReliabilityInput, ReliabilityResult } from '../types/simulation';
import { clamp } from './arrivals';

/**
 * Exponential component reliability: R_i(t) = e^(-λ_i · t)
 */
export function componentReliability(failureRatePerHour: number, hours: number): number {
  const rate = Math.max(0, failureRatePerHour);
  const t = Math.max(0, hours);
  return Math.exp(-rate * t);
}

/**
 * Series system reliability: R_sys(t) = Π R_i(t)
 */
export function seriesReliability(reliabilities: readonly number[]): number {
  return reliabilities.reduce((acc, r) => acc * clamp(r, 0, 1), 1);
}

/**
 * Parallel redundancy reliability: R_parallel(t) = 1 - Π (1 - R_i(t))
 */
export function parallelReliability(reliabilities: readonly number[]): number {
  const allFailProb = reliabilities.reduce((acc, r) => acc * (1 - clamp(r, 0, 1)), 1);
  return 1 - allFailProb;
}

/**
 * Inherent availability: A = MTBF / (MTBF + MTTR)
 */
export function inherentAvailability(mtbfHours: number, mttrHours: number): number {
  const mtbf = Math.max(0.01, mtbfHours);
  const mttr = Math.max(0, mttrHours);
  return mtbf / (mtbf + mttr);
}

export function evaluateHospitalInfrastructure(input: ReliabilityInput): ReliabilityResult {
  const t = clamp(input.missionHours, 1, 8760);
  const gateways = Math.round(clamp(input.redundantGateways, 1, 4));

  const rWan = componentReliability(input.wanFailureRate, t);
  const rEhr = componentReliability(input.ehrFailureRate, t);
  const rGateway = componentReliability(input.gatewayFailureRate, t);

  const seriesVal = seriesReliability([rWan, rEhr, rGateway]);
  const parallelGateways = parallelReliability(Array.from({ length: gateways }, () => rGateway));
  // Hybrid: Parallel redundant gateways + offline SQLite failover (99.6% local survival) in series with EHR core
  const rWanOrSqlite = parallelReliability([rWan, 0.996]);
  const hybridSystemReliability = seriesReliability([rWanOrSqlite, rEhr, parallelGateways]);

  const availability = inherentAvailability(input.mtbfHours, input.mttrHours);
  const expectedAnnualDowntimeHours = (1 - availability) * 8760;

  const curvePoints: { hour: number; series: number; redundant: number }[] = [];
  for (let h = 0; h <= 720; h += 30) {
    const rw = componentReliability(input.wanFailureRate, h);
    const re = componentReliability(input.ehrFailureRate, h);
    const rg = componentReliability(input.gatewayFailureRate, h);
    const pG = parallelReliability(Array.from({ length: gateways }, () => rg));
    curvePoints.push({
      hour: h,
      series: seriesReliability([rw, re, rg]),
      redundant: seriesReliability([parallelReliability([rw, 0.996]), re, pG]),
    });
  }

  return {
    seriesReliability: seriesVal,
    parallelGatewayReliability: parallelGateways,
    hybridSystemReliability,
    inherentAvailability: availability,
    expectedAnnualDowntimeHours,
    curvePoints,
  };
}
