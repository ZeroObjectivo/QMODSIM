import type { QueueingInput, QueueingResult } from '../types/simulation';
import { clamp } from './arrivals';

/**
 * Exact finite-capacity multi-server M/M/c/K queueing solver.
 * Computes state weights iteratively via r_n = λ / (min(n, c) · μ) to remain
 * numerically exact at ρ = 1 and prevent factorial overflow.
 */
export function solveMMcK(input: QueueingInput): QueueingResult {
  const lambda = clamp(input.lambda, 0.1, 200);
  const mu = clamp(input.mu, 0.1, 100);
  const c = Math.round(clamp(input.c, 1, 24));
  const K = Math.max(c, Math.round(clamp(input.K, c, 80)));

  const rho = lambda / (c * mu);

  // Unnormalized state weights w_n = P_n / P_0
  const weights: number[] = new Array<number>(K + 1).fill(0);
  weights[0] = 1;
  let weightSum = 1;

  for (let n = 1; n <= K; n++) {
    const activeServers = Math.min(n, c);
    const prev = weights[n - 1] ?? 0;
    const w = prev * (lambda / (activeServers * mu));
    weights[n] = w;
    weightSum += w;
  }

  const p0 = 1 / weightSum;
  const stateProbabilities = weights.map((w) => w * p0);
  const pDrop = stateProbabilities[K] ?? 0;
  const lambdaEff = lambda * (1 - pDrop);

  let L = 0;
  let Lq = 0;
  for (let n = 0; n <= K; n++) {
    const pn = stateProbabilities[n] ?? 0;
    L += n * pn;
    if (n > c) {
      Lq += (n - c) * pn;
    }
  }

  const W = lambdaEff > 1e-12 ? L / lambdaEff : 0;
  const Wq = lambdaEff > 1e-12 ? Lq / lambdaEff : 0;
  const littlesLawDiff = Math.abs(L - lambdaEff * W);

  return {
    lambda,
    mu,
    c,
    K,
    rho,
    p0,
    pDrop,
    lambdaEff,
    L,
    Lq,
    W,
    Wq,
    stateProbabilities,
    littlesLawDiff,
  };
}
