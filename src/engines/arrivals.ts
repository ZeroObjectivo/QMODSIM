import type { ArrivalSimulationSummary, SurgePeak } from '../types/simulation';

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Exponential inter-arrival probability density: f(t) = λ · e^(-λt)
 */
export function exponentialPdf(lambda: number, t: number): number {
  const safeLambda = clamp(lambda, 0.01, 1000);
  if (t < 0) return 0;
  return safeLambda * Math.exp(-safeLambda * t);
}

/**
 * Poisson count probability: P(N(t) = k) = ((λ · t)^k · e^(-λt)) / k!
 */
export function poissonPmf(lambda: number, t: number, k: number): number {
  const safeLambda = clamp(lambda, 0.01, 1000);
  const safeT = clamp(t, 0, 1000);
  const intK = Math.floor(k);
  if (intK < 0) return 0;
  const mean = safeLambda * safeT;
  if (mean === 0) return intK === 0 ? 1 : 0;

  let logFactorial = 0;
  for (let i = 2; i <= intK; i++) {
    logFactorial += Math.log(i);
  }
  const logProb = intK * Math.log(mean) - mean - logFactorial;
  return Math.exp(logProb);
}

/**
 * Non-Homogeneous Poisson Process (NHPP) meal-rush order arrival rate:
 * λ(t) = λ_base + Σ [A_i · exp(-(t - t_peak,i)² / (2σ_i²))]
 */
export function nonHomogeneousRate(
  hourOfDay: number,
  baseRate: number,
  surges: readonly SurgePeak[]
): number {
  const safeBase = clamp(baseRate, 0.1, 200);
  let rate = safeBase;
  for (const surge of surges) {
    const sigma = Math.max(0.25, surge.spread);
    const diff = hourOfDay - surge.peakHour;
    rate += Math.max(0, surge.amplitude) * Math.exp(-(diff * diff) / (2 * sigma * sigma));
  }
  return rate;
}

/**
 * Old Yorker's daily branch order profile (10:00 AM – 10:00 PM operating window
 * plotted across 24h) capturing Lunch (12:00 PM), Merienda (3:30 PM), and Dinner (7:00 PM) surges.
 */
export function buildBranchOrderSurgeProfile(
  baseRate: number,
  peakRushAmplitude: number
): readonly { readonly hour: number; readonly rate: number }[] {
  const surges: readonly SurgePeak[] = [
    { label: '12:00 PM Lunch Rush', amplitude: peakRushAmplitude * 0.85, peakHour: 12.0, spread: 1.4 },
    { label: '15:30 PM Merienda Snack Peak', amplitude: peakRushAmplitude * 0.65, peakHour: 15.5, spread: 1.3 },
    { label: '19:00 PM Dinner & Commute Surge', amplitude: peakRushAmplitude, peakHour: 19.0, spread: 1.7 },
  ];

  const points: { hour: number; rate: number }[] = [];
  for (let h = 8; h <= 23; h += 0.5) {
    points.push({
      hour: h,
      rate: nonHomogeneousRate(h, baseRate, surges),
    });
  }
  return points;
}

/**
 * Deterministic inverse-transform Exponential inter-arrival generator
 * for verifying empirical mean inter-arrival against theoretical 1/λ.
 */
export function simulatePoissonInterArrivals(
  lambda: number,
  sampleCount = 15000,
  seed = 20260401
): ArrivalSimulationSummary {
  const safeLambda = clamp(lambda, 0.1, 500);
  const count = Math.max(100, Math.floor(sampleCount));
  const rng = createMulberry32(seed);
  const samples: number[] = [];
  let sum = 0;

  for (let i = 0; i < count; i++) {
    const u = Math.max(1e-12, 1 - rng());
    const interArrival = -Math.log(u) / safeLambda;
    sum += interArrival;
    if (i < 60) {
      samples.push(interArrival);
    }
  }

  const theoreticalMeanInterArrival = 1 / safeLambda;
  const simulatedMeanInterArrival = sum / count;
  const relativeError =
    Math.abs(simulatedMeanInterArrival - theoreticalMeanInterArrival) / theoreticalMeanInterArrival;

  return {
    lambda: safeLambda,
    theoreticalMeanInterArrival,
    simulatedMeanInterArrival,
    relativeError,
    samples,
  };
}
