import type { MarkovAnalysisResult, MarkovStateNode } from '../types/simulation';
import { clamp } from './arrivals';

export const OLD_YORKERS_ORDER_STATES: readonly MarkovStateNode[] = [
  { id: 'S0_CART_SELECT', label: 'S₀ Cart & Branch Select', kind: 'transient', index: 0 },
  { id: 'S1_GCASH_VERIFY', label: 'S₁ GCash Payment Verify', kind: 'transient', index: 1 },
  { id: 'S2_KITCHEN_PREP', label: 'S₂ Kitchen Prep & BOM Deduct', kind: 'transient', index: 2 },
  { id: 'S3_FULFILLED', label: 'S₃ Fulfilled & Deducted', kind: 'absorbing-safe', index: 3 },
  { id: 'S4_ABANDONED_FRAUD', label: 'S₄ Abandoned / Fraud / Stockout', kind: 'absorbing-loss', index: 4 },
];

/**
 * Builds canonical 5×5 absorbing Markov transition matrix P = [ Q R ; 0 I ]
 * for Old Yorker's multi-branch order lifecycle where every row strictly sums to 1.0.
 */
export function buildOrderLifecycleMatrix(
  gcashApiAutomation: number,
  stockoutCancelRisk: number
): number[][] {
  const apiRate = clamp(gcashApiAutomation, 0.2, 0.9);
  const dropRisk = clamp(stockoutCancelRisk, 0.03, 0.45);

  // Row 0: S0 Cart & Branch Select -> [stay browsing, proceed to GCash verify, direct COD prep, 0, cart abandon]
  const r0Abandon = Math.min(dropRisk * 0.75, 0.32);
  const r0ToGcash = Math.min(0.68, Math.max(0.25, apiRate * 0.72));
  const r0ToCodPrep = Math.min(0.18, Math.max(0.05, 1 - r0Abandon - r0ToGcash - 0.08));
  const r0Stay = Math.max(0, 1 - (r0ToGcash + r0ToCodPrep + r0Abandon));

  // Row 1: S1 GCash Payment Verify -> [retry cart, waiting screenshot/API, verified to kitchen, 0, fake/timeout drop]
  const r1Retry = 0.03;
  const r1Verify = Math.min(0.88, Math.max(0.25, apiRate));
  const r1FraudTimeout = Math.min(dropRisk * 0.85, 1 - r1Retry - r1Verify - 0.02);
  const r1Wait = Math.max(0, 1 - (r1Retry + r1Verify + r1FraudTimeout));

  // Row 2: S2 Kitchen Prep & BOM Deduct -> [0, 0, still grilling, fulfilled & deducted, stockout cancel]
  const r2Stockout = Math.min(dropRisk * 0.7, 0.35);
  const r2Fulfill = Math.min(0.82, Math.max(0.45, 0.55 + apiRate * 0.3 - dropRisk * 0.3));
  const r2Grilling = Math.max(0, 1 - (r2Fulfill + r2Stockout));

  return [
    [r0Stay, r0ToGcash, r0ToCodPrep, 0, r0Abandon],
    [r1Retry, r1Wait, r1Verify, 0, r1FraudTimeout],
    [0, 0, r2Grilling, r2Fulfill, r2Stockout],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1],
  ];
}

/**
 * Exact Gauss-Jordan matrix inversion for fundamental matrix N = (I - Q)⁻¹.
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

  const meanStepsToAbsorption = N.map((row) => row.reduce((acc, v) => acc + v, 0));

  return {
    states: OLD_YORKERS_ORDER_STATES,
    transitionMatrix,
    fundamentalMatrix: N,
    absorptionProbabilities: B,
    meanStepsToAbsorption,
    isRowStochastic,
    maxRowDeviation,
  };
}
