import type { FairInput, FairSimulationResult, HistogramBin } from '../types/simulation';
import { clamp, createMulberry32 } from './arrivals';

/**
 * Marsaglia-Tsang Gamma(shape, 1) sampler for exact Beta-PERT generation.
 */
function sampleGamma(shape: number, rng: () => number): number {
  if (shape < 1) {
    const u = Math.max(1e-12, rng());
    return sampleGamma(shape + 1, rng) * Math.pow(u, 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x = 0;
    let v = 0;
    do {
      const u1 = Math.max(1e-12, rng());
      const u2 = rng();
      x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(Math.max(1e-12, u)) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

/**
 * Threat Event Frequency: TEF ~ Beta-PERT(a_min, m_likely, b_max)
 */
export function sampleBetaPert(
  aMin: number,
  mLikely: number,
  bMax: number,
  rng: () => number
): number {
  const min = Math.max(0, aMin);
  const max = Math.max(min, bMax);
  const likely = clamp(mLikely, min, max);
  if (max - min < 1e-9) return min;

  const alpha = 1 + (4 * (likely - min)) / (max - min);
  const beta = 1 + (4 * (max - likely)) / (max - min);
  const g1 = sampleGamma(alpha, rng);
  const g2 = sampleGamma(beta, rng);
  const y = g1 / (g1 + g2);
  return min + y * (max - min);
}

/**
 * Loss Magnitude: LM ~ Lognormal(μ, σ)
 */
export function sampleLognormal(mu: number, sigma: number, rng: () => number): number {
  const u1 = Math.max(1e-12, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.exp(mu + Math.max(0.05, sigma) * z);
}

/**
 * Return on Security Investment:
 * ROSI = [(ALE_base - ALE_mitigated) - C_control] / C_control
 */
export function computeRosi(
  aleBase: number,
  aleMitigated: number,
  controlCost: number
): number {
  const safeCost = Math.max(1, controlCost);
  return ((aleBase - aleMitigated) - safeCost) / safeCost;
}

/**
 * Runs FAIR Monte Carlo simulation (default 10,000 trials) in Philippine Pesos (PHP)
 * modeling RA 10173 breach fines, forensic response, and clinical downtime.
 */
export function runFairMonteCarlo(
  input: FairInput,
  trials = 10000,
  seed = 42001
): FairSimulationResult {
  const safeTrials = Math.round(clamp(trials, 500, 50000));
  const rng = createMulberry32(seed);
  const losses = new Float64Array(safeTrials);
  const secondaryMult = clamp(input.secondaryLossMultiplier, 0, 3);
  const mitigation = clamp(input.mitigationFactor, 0, 0.95);

  let sum = 0;
  let maxLoss = 0;

  for (let i = 0; i < safeTrials; i++) {
    const tef = sampleBetaPert(input.tefMin, input.tefLikely, input.tefMax, rng);
    const primaryLoss = sampleLognormal(input.lossLogMu, input.lossLogSigma, rng);
    const secondaryLoss = primaryLoss * secondaryMult;
    const annualLoss = tef * (primaryLoss + secondaryLoss);
    losses[i] = annualLoss;
    sum += annualLoss;
    if (annualLoss > maxLoss) maxLoss = annualLoss;
  }

  const sorted = Float64Array.from(losses).sort();
  const aleMean = sum / safeTrials;
  const aleMedian = sorted[Math.floor(safeTrials * 0.5)] ?? aleMean;
  const aleP90 = sorted[Math.floor(safeTrials * 0.9)] ?? aleMean;
  const aleP95 = sorted[Math.floor(safeTrials * 0.95)] ?? aleMean;
  const aleMitigatedMean = aleMean * (1 - mitigation);
  const rosi = computeRosi(aleMean, aleMitigatedMean, input.controlCostPhp);

  // Build 28-bin histogram capped at P98 for clean visual readability
  const binCount = 28;
  const chartCap = Math.max(1, sorted[Math.floor(safeTrials * 0.98)] ?? maxLoss);
  const binWidth = chartCap / binCount;
  const counts = new Uint32Array(binCount);

  for (let i = 0; i < safeTrials; i++) {
    const val = losses[i] ?? 0;
    const idx = Math.min(binCount - 1, Math.floor(val / binWidth));
    counts[idx] = (counts[idx] ?? 0) + 1;
  }

  const histogram: HistogramBin[] = [];
  for (let b = 0; b < binCount; b++) {
    const count = counts[b] ?? 0;
    histogram.push({
      min: b * binWidth,
      max: (b + 1) * binWidth,
      count,
      frequency: count / safeTrials,
    });
  }

  return {
    trials: safeTrials,
    seed,
    aleMean,
    aleMedian,
    aleP90,
    aleP95,
    aleMax: maxLoss,
    aleMitigatedMean,
    rosi,
    histogram,
  };
}
