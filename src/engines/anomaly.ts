import type { AnomalyTick } from '../types/simulation';
import { clamp, createMulberry32 } from './arrivals';

/**
 * Zero-allocation streaming Z-Score anomaly detector backed by a fixed-capacity
 * circular Float64Array of window size W = 30. Maintains running sum and sum-of-squares
 * in O(1) time per 15-minute branch BOM stock deduction log.
 */
export class StreamingZScoreDetector {
  private readonly buffer: Float64Array;
  private readonly capacity: number;
  private head = 0;
  private count = 0;
  private sum = 0;
  private sumSq = 0;

  constructor(windowSize = 30) {
    this.capacity = Math.max(5, Math.floor(windowSize));
    this.buffer = new Float64Array(this.capacity);
  }

  public push(step: number, value: number, thresholdSigma: number): AnomalyTick {
    const tau = clamp(thresholdSigma, 1.0, 6.0);

    let mean = value;
    let stdDev = 0;
    let zScore = 0;
    let isAnomaly = false;

    if (this.count >= 5) {
      mean = this.sum / this.count;
      const variance = Math.max(0, this.sumSq / this.count - mean * mean);
      stdDev = Math.sqrt(variance);
      zScore = stdDev > 1e-6 ? Math.abs(value - mean) / stdDev : 0;
      isAnomaly = zScore >= tau;
    }

    if (!isAnomaly) {
      if (this.count === this.capacity) {
        const evicted = this.buffer[this.head] ?? 0;
        this.sum -= evicted;
        this.sumSq -= evicted * evicted;
      } else {
        this.count += 1;
      }

      this.buffer[this.head] = value;
      this.sum += value;
      this.sumSq += value * value;
      this.head = (this.head + 1) % this.capacity;
    }

    return { step, value, mean, stdDev, zScore, isAnomaly };
  }

  public reset(): void {
    this.buffer.fill(0);
    this.head = 0;
    this.count = 0;
    this.sum = 0;
    this.sumSq = 0;
  }
}

/**
 * Generates an Old Yorker's BOM raw ingredient deduction trace (baseline ~24 hotdog buns/beef
 * units deducted per 15-min interval) with 3 injected unrecorded shrinkage / manual void spikes.
 */
export function generateIngredientDeductionTrace(
  length = 120,
  thresholdSigma = 3.0,
  seed = 7711
): readonly AnomalyTick[] {
  const rng = createMulberry32(seed);
  const detector = new StreamingZScoreDetector(30);
  const ticks: AnomalyTick[] = [];

  for (let i = 0; i < length; i++) {
    const u1 = Math.max(1e-12, rng());
    const u2 = rng();
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 1.3;
    let unitsDeducted = 24 + noise;

    // Inject abnormal shrinkage / void spikes at steps 48, 76, 102
    if (i === 48) unitsDeducted = 34.2;
    else if (i === 76) unitsDeducted = 14.8;
    else if (i === 102) unitsDeducted = 37.5;

    ticks.push(detector.push(i, unitsDeducted, thresholdSigma));
  }

  return ticks;
}
