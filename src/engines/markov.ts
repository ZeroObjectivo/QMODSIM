import type { MarkovAnalysisResult, MarkovStateNode } from '../types/simulation';
import { clamp } from './arrivals';

export const HOSPITAL_VLAN_STATES: readonly MarkovStateNode[] = [
  { id: 'S0_TRIAGE_KIOSK', label: 'S₀ Triage Kiosk', kind: 'transient', index: 0 },
  { id: 'S1_EHR_STAGING', label: 'S₁ EHR Staging', kind: 'transient', index: 1 },
  { id: 'S2_ICU_VLAN', label: 'S₂ ICU Telemetry VLAN', kind: 'transient', index: 2 },
  { id: 'S3_QUARANTINED', label: 'S₃ Quarantined (Safe)', kind: 'absorbing-safe', index: 3 },
  { id: 'S4_COMPROMISED', label: 'S₄ Compromised (Breach)', kind: 'absorbing-breach', index: 4 },
];

/**
 * Builds canonical 5×5 absorbing Markov transition matrix P = [ Q R ; 0 I ]
 * where every row strictly sums to 1.0.
 */
export function buildHospitalVlanMatrix(
  firewallContainment: number,
  lateralRisk: number
): number[][] {
  const contain = clamp(firewallContainment, 0.1, 0.85);
  const lateral = clamp(lateralRisk, 0.05, 0.65);

  // Row 0: Triage Kiosk -> [stay, move to EHR, direct ICU, quarantined, compromised]
  const r0Move = Math.min(lateral, 1 - contain - 0.1);
  const r0Stay = Math.max(0.05, 1 - contain - r0Move - 0.02);
  const r0Breach = Math.max(0, 1 - (r0Stay + r0Move + contain));

  // Row 1: EHR Staging -> [back to kiosk, stay, pivot to ICU, quarantined, compromised]
  const r1Pivot = Math.min(lateral * 0.9, 1 - contain - 0.12);
  const r1Back = 0.05;
  const r1Breach = Math.min(0.18, Math.max(0.02, lateral * 0.28));
  const r1Stay = Math.max(0.04, 1 - (r1Back + r1Pivot + contain + r1Breach));
  const r1Contain = Math.max(0, 1 - (r1Back + r1Stay + r1Pivot + r1Breach));

  // Row 2: ICU Telemetry VLAN -> [kiosk=0, back to EHR, stay, quarantined, compromised]
  const r2Back = 0.04;
  const r2Breach = Math.min(0.55, Math.max(0.05, lateral * 0.85));
  const r2Contain = Math.min(contain * 0.9, 1 - r2Back - r2Breach - 0.05);
  const r2Stay = Math.max(0, 1 - (r2Back + r2Contain + r2Breach));

  return [
    [r0Stay, r0Move, 0, contain, r0Breach],
    [r1Back, r1Stay, r1Pivot, r1Contain, r1Breach],
    [0, r2Back, r2Stay, r2Contain, r2Breach],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1],
  ];
}

/**
 * Exact Gauss-Jordan matrix inversion for small dense matrices (N = (I - Q)⁻¹).
 */
export function invertMatrix(matrix: readonly (readonly number[])[]): number[][] {
  const n = matrix.length;
  const aug: number[][] = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxAbs = Math.abs(aug[col]?.[col] ?? 0);
    for (let r = col + 1; r < n; r++) {
      const val = Math.abs(aug[r]?.[col] ?? 0);
      if (val > maxAbs) {
        maxAbs = val;
        pivotRow = r;
      }
    }

    if (maxAbs < 1e-12) {
      throw new Error('Singular matrix encountered during fundamental matrix inversion');
    }

    if (pivotRow !== col) {
      const tmp = aug[col]!;
      aug[col] = aug[pivotRow]!;
      aug[pivotRow] = tmp;
    }

    const pivotVal = aug[col]![col]!;
    for (let j = 0; j < 2 * n; j++) {
      aug[col]![j] = aug[col]![j]! / pivotVal;
    }

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r]![col]!;
      for (let j = 0; j < 2 * n; j++) {
        aug[r]![j] = aug[r]![j]! - factor * aug[col]![j]!;
      }
    }
  }

  return aug.map((row) => row.slice(n));
}

/**
 * Analyzes an absorbing Markov chain in canonical form P = [Q R ; 0 I]:
 * - Fundamental matrix N = (I - Q)⁻¹
 * - Absorption probabilities B = N · R
 * - Expected steps to absorption t = N · 1
 */
export function analyzeAbsorbingMarkov(
  transitionMatrix: readonly (readonly number[])[],
  transientCount = 3
): MarkovAnalysisResult {
  const nTotal = transitionMatrix.length;
  const absorbingCount = nTotal - transientCount;

  let maxRowDeviation = 0;
  for (const row of transitionMatrix) {
    const sum = row.reduce((acc, v) => acc + v, 0);
    maxRowDeviation = Math.max(maxRowDeviation, Math.abs(sum - 1));
  }
  const isRowStochastic = maxRowDeviation < 1e-5;

  // Build (I - Q)
  const iMinusQ: number[][] = [];
  for (let i = 0; i < transientCount; i++) {
    const row: number[] = [];
    for (let j = 0; j < transientCount; j++) {
      const qVal = transitionMatrix[i]?.[j] ?? 0;
      row.push((i === j ? 1 : 0) - qVal);
    }
    iMinusQ.push(row);
  }

  const N = invertMatrix(iMinusQ);

  // B = N · R
  const B: number[][] = [];
  for (let i = 0; i < transientCount; i++) {
    const row: number[] = [];
    for (let k = 0; k < absorbingCount; k++) {
      let acc = 0;
      for (let j = 0; j < transientCount; j++) {
        acc += (N[i]?.[j] ?? 0) * (transitionMatrix[j]?.[transientCount + k] ?? 0);
      }
      row.push(acc);
    }
    B.push(row);
  }

  // t = N · 1
  const meanStepsToAbsorption = N.map((row) => row.reduce((acc, v) => acc + v, 0));

  return {
    states: HOSPITAL_VLAN_STATES,
    transitionMatrix,
    fundamentalMatrix: N,
    absorptionProbabilities: B,
    meanStepsToAbsorption,
    isRowStochastic,
    maxRowDeviation,
  };
}
