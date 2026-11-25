import type { LabParameters, ValidationResult } from '../types/simulation';
import { simulatePoissonInterArrivals } from './arrivals';
import { solveMMcK } from './queueing';
import { buildHospitalVlanMatrix } from './markov';
import { runFairMonteCarlo } from './fairMonteCarlo';
import { generateInfusionTelemetryTrace } from './anomaly';
import { evaluateHospitalInfrastructure } from './reliability';

/**
 * Core automated mathematical verification routine matching Section 6 of the
 * QMODSIM Student Guide.
 */
export function runInvariantChecks(params: {
  lambda: number;
  simulatedMeanInterArrival: number;
  meanQueueLength: number;
  lambdaEff: number;
  meanWaitTime: number;
  transitionMatrix: readonly (readonly number[])[];
  aleSeedA: number;
  aleSeedB: number;
}): ValidationResult[] {
  const expectedInterArrival = 1 / params.lambda;
  const poissonError =
    Math.abs(params.simulatedMeanInterArrival - expectedInterArrival) / expectedInterArrival;

  const littlesLawDiff = Math.abs(
    params.meanQueueLength - params.lambdaEff * params.meanWaitTime
  );

  const isRowStochastic = params.transitionMatrix.every(
    (row) => Math.abs(row.reduce((sum, val) => sum + val, 0) - 1.0) < 1e-5
  );

  const fairConvergenceDiff =
    Math.abs(params.aleSeedA - params.aleSeedB) / (params.aleSeedA || 1);

  return [
    {
      target: 'Poisson Arrival Invariant',
      standard: 'Mean inter-arrival matches 1/λ within ±2.0%',
      measured: `Error: ${(poissonError * 100).toFixed(2)}%`,
      passed: poissonError < 0.02,
    },
    {
      target: "Little's Law Conservation",
      standard: '|L - (λ_eff · W)| < 10⁻⁵ across buffer states',
      measured: `Diff: ${littlesLawDiff.toExponential(2)}`,
      passed: littlesLawDiff < 1e-5,
    },
    {
      target: 'Markov Row-Stochasticity',
      standard: 'Σ P_ij = 1.0 for all states i in S',
      measured: isRowStochastic ? 'All rows = 1.0000' : 'Row sum mismatch',
      passed: isRowStochastic,
    },
    {
      target: 'FAIR Monte Carlo Convergence',
      standard: 'ALE converges within ±1.5% across 10,000 trials',
      measured: `Variance: ${(fairConvergenceDiff * 100).toFixed(2)}%`,
      passed: fairConvergenceDiff < 0.015,
    },
  ];
}

/**
 * Runs the complete live Verification & Validation suite against the active
 * LAB parameters for the in-app Verification Drawer.
 */
export function runFullEngineValidation(lab: LabParameters): ValidationResult[] {
  const arrivalSim = simulatePoissonInterArrivals(lab.lambda, 15000, 20260401);
  const queue = solveMMcK({ lambda: lab.lambda, mu: lab.mu, c: lab.c, K: lab.K });
  const markovMatrix = buildHospitalVlanMatrix(lab.firewallContainment, lab.lateralRisk);

  const fairInput = {
    tefMin: 0.4,
    tefLikely: 1.4,
    tefMax: 3.8,
    lossLogMu: 13.9,
    lossLogSigma: 0.42,
    secondaryLossMultiplier: 0.65,
    mitigationFactor: lab.fairMitigation,
    controlCostPhp: lab.controlCostPhp,
  };
  const fairA = runFairMonteCarlo(fairInput, 10000, 104729);
  const fairB = runFairMonteCarlo(fairInput, 10000, 224737);

  const coreChecks = runInvariantChecks({
    lambda: lab.lambda,
    simulatedMeanInterArrival: arrivalSim.simulatedMeanInterArrival,
    meanQueueLength: queue.L,
    lambdaEff: queue.lambdaEff,
    meanWaitTime: queue.W,
    transitionMatrix: markovMatrix,
    aleSeedA: fairA.aleMean,
    aleSeedB: fairB.aleMean,
  });

  // Additional domain invariants: Z-Score anomaly recall & Reliability monotonicity
  const ticks = generateInfusionTelemetryTrace(120, Math.min(lab.zThreshold, 3.5), 7711);
  const detectedSpikes = [48, 76, 102].filter((idx) => ticks[idx]?.isAnomaly).length;

  const rel = evaluateHospitalInfrastructure({
    wanFailureRate: 0.0012,
    ehrFailureRate: 0.0004,
    gatewayFailureRate: 0.0015,
    missionHours: 168,
    mtbfHours: lab.mtbfHours,
    mttrHours: lab.mttrHours,
    redundantGateways: lab.redundantGateways,
  });
  const relMonotonic =
    rel.seriesReliability >= 0 &&
    rel.hybridSystemReliability >= rel.seriesReliability &&
    rel.hybridSystemReliability <= 1;

  return [
    ...coreChecks,
    {
      target: 'IV Infusion Z-Score Spike Recall',
      standard: 'Detects 3/3 injected dosage tampering spikes',
      measured: `Detected: ${detectedSpikes}/3 spikes`,
      passed: detectedSpikes === 3,
    },
    {
      target: 'Redundancy Reliability Dominance',
      standard: '0 ≤ R_series(t) ≤ R_redundant(t) ≤ 1',
      measured: `R_s=${rel.seriesReliability.toFixed(4)} ≤ R_r=${rel.hybridSystemReliability.toFixed(4)}`,
      passed: relMonotonic,
    },
  ];
}
