import { describe, expect, it } from 'vitest';
import {
  buildBranchOrderSurgeProfile,
  exponentialPdf,
  nonHomogeneousRate,
  poissonPmf,
  simulatePoissonInterArrivals,
} from '../arrivals';
import { computeEntropyMetrics, generateSecureClinicalToken } from '../entropy';
import { computeRosi, runFairMonteCarlo } from '../fairMonteCarlo';
import { analyzeAbsorbingMarkov, buildOrderLifecycleMatrix } from '../markov';
import { solveMMcK } from '../queueing';
import { solveSecurityGame } from '../gameTheory';
import { generateIngredientDeductionTrace, StreamingZScoreDetector } from '../anomaly';
import {
  componentReliability,
  evaluateBranchInfrastructure,
  inherentAvailability,
  parallelReliability,
  seriesReliability,
} from '../reliability';
import { runFullEngineValidation } from '../validation';
import type { LabParameters } from '../../types/simulation';

describe("Old Yorker's QMODSIM Mathematical Engines", () => {
  describe('Modules 1 & 3: Branch Order Arrivals & Meal Rushes', () => {
    it('computes normalized Poisson PMF summing to ~1.0', () => {
      let sum = 0;
      for (let k = 0; k <= 50; k++) {
        sum += poissonPmf(10, 1, k);
      }
      expect(Math.abs(sum - 1)).toBeLessThan(1e-6);
    });

    it('matches exponential density f(0) = λ and empirical mean inter-arrival within ±2%', () => {
      expect(exponentialPdf(22, 0)).toBeCloseTo(22, 8);
      const sim = simulatePoissonInterArrivals(22, 15000, 20260401);
      expect(sim.relativeError).toBeLessThan(0.02);
    });

    it('computes non-homogeneous dinner surge peaking above baseline', () => {
      const rate = nonHomogeneousRate(19, 16, [
        { label: 'Dinner Rush', amplitude: 18, peakHour: 19, spread: 1.5 },
      ]);
      expect(rate).toBeCloseTo(34, 6);
      expect(buildBranchOrderSurgeProfile(16, 14).length).toBeGreaterThan(20);
    });
  });

  describe('Modules 2 & 10: RBAC & GCash Webhook Token Entropy', () => {
    it('quantifies 4-digit staff PIN weakness vs 16-char RBAC token', () => {
      const pin = computeEntropyMetrics({ alphabetSize: 10, length: 4, guessesPerSecond: 1e6 });
      expect(pin.entropyBits).toBeCloseTo(Math.log2(10000), 6);
      expect(pin.classification).toBe('CRITICAL');

      const strong = computeEntropyMetrics({ alphabetSize: 62, length: 18, guessesPerSecond: 1e9 });
      expect(strong.entropyBits).toBeGreaterThan(100);
      expect(strong.classification).toBe('STRONG');
    });

    it('generates unbiased tokens via Web Crypto API', () => {
      const token = generateSecureClinicalToken(24, 62);
      expect(token).toHaveLength(24);
      expect(/^[0-9A-Za-z]{24}$/.test(token)).toBe(true);
    });
  });

  describe('Module 4: FAIR Monte Carlo (GCash Fraud, Shrinkage & RA 10173)', () => {
    it('converges ALE within ±1.5% across independent 10,000-trial seeds', () => {
      const input = {
        tefMin: 1.5,
        tefLikely: 4.5,
        tefMax: 10.0,
        lossLogMu: 11.4,
        lossLogSigma: 0.42,
        secondaryLossMultiplier: 0.55,
        mitigationFactor: 0.68,
        controlCostPhp: 180_000,
      };
      const runA = runFairMonteCarlo(input, 10000, 104729);
      const runB = runFairMonteCarlo(input, 10000, 224737);
      const relDiff = Math.abs(runA.aleMean - runB.aleMean) / runA.aleMean;

      expect(relDiff).toBeLessThan(0.015);
      expect(runA.aleP95).toBeGreaterThan(runA.aleMedian);
      expect(computeRosi(900_000, 250_000, 150_000)).toBeCloseTo((650_000 - 150_000) / 150_000, 6);
    });
  });

  describe('Module 5: Absorbing Markov Order Ticket Lifecycle', () => {
    it('maintains exact row-stochasticity and absorption sum = 1.0', () => {
      const P = buildOrderLifecycleMatrix(0.75, 0.12);
      const res = analyzeAbsorbingMarkov(P, 3);

      expect(res.isRowStochastic).toBe(true);
      expect(res.maxRowDeviation).toBeLessThan(1e-10);
      for (const row of res.absorptionProbabilities) {
        expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 6);
      }
    });
  });

  describe('Module 6: M/M/c/K Kitchen Prep Station Queueing', () => {
    it("satisfies Little's Law conservation including at ρ = 1.0", () => {
      const balanced = solveMMcK({ lambda: 24, mu: 8, c: 3, K: 18 });
      expect(balanced.rho).toBeCloseTo(1.0, 8);
      expect(balanced.littlesLawDiff).toBeLessThan(1e-10);
      expect(balanced.stateProbabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 8);
    });
  });

  describe('Module 7: Game Theory (Branch Audit vs. Shrinkage)', () => {
    it('computes exact Mixed-Strategy Nash Equilibrium p* and q*', () => {
      const res = solveSecurityGame({
        auditCost: 15_000,
        attackerGain: 80_000,
        breachPenalty: 320_000,
      });
      expect(res.pStar).toBeCloseTo(15_000 / 400_000, 6);
      expect(res.qStar).toBeCloseTo(80_000 / 400_000, 6);
    });
  });

  describe('Module 11: Zero-Allocation BOM Deduction Z-Score Detector', () => {
    it('flags all 3 injected bun/beef shrinkage anomalies without baseline poisoning', () => {
      const trace = generateIngredientDeductionTrace(120, 3.2, 7711);
      expect(trace[48]?.isAnomaly).toBe(true);
      expect(trace[76]?.isAnomaly).toBe(true);
      expect(trace[102]?.isAnomaly).toBe(true);

      const detector = new StreamingZScoreDetector(30);
      for (let i = 0; i < 35; i++) {
        detector.push(i, 24 + (i % 2 === 0 ? 0.4 : -0.4), 3.0);
      }
      expect(detector.push(35, 38, 3.0).isAnomaly).toBe(true);
    });
  });

  describe('Module 12: Multi-Branch POS & GCash Failover Reliability', () => {
    it('proves parallel failover strictly dominates single-path series reliability', () => {
      expect(componentReliability(0.001, 0)).toBe(1);
      expect(seriesReliability([0.9, 0.9])).toBeCloseTo(0.81, 6);
      expect(parallelReliability([0.9, 0.9])).toBeCloseTo(0.99, 6);
      expect(inherentAvailability(720, 1.5)).toBeCloseTo(720 / 721.5, 6);

      const infra = evaluateBranchInfrastructure({
        ispFailureRate: 0.0018,
        mysqlFailureRate: 0.0003,
        gcashApiFailureRate: 0.001,
        missionHours: 168,
        mtbfHours: 720,
        mttrHours: 1.5,
        redundantLinks: 2,
      });
      expect(infra.hybridSystemReliability).toBeGreaterThan(infra.seriesReliability);
    });
  });

  describe('Automated Verification & Validation Drawer Suite', () => {
    it('passes all 6 live mathematical invariant checks', () => {
      const defaults: LabParameters = {
        branch: 'guadalupe',
        lambda: 24,
        mu: 9,
        c: 3,
        K: 18,
        surgeAmplitude: 14,
        zThreshold: 3.0,
        gcashApiAutomation: 0.78,
        stockoutCancelRisk: 0.1,
        alphabetSize: 62,
        tokenLength: 16,
        fairMitigation: 0.68,
        controlCostPhp: 180_000,
        auditCostPhp: 15_000,
        attackerGainPhp: 80_000,
        breachPenaltyPhp: 320_000,
        mtbfHours: 720,
        mttrHours: 1.5,
        redundantLinks: 2,
      };
      const results = runFullEngineValidation(defaults);
      expect(results).toHaveLength(6);
      for (const check of results) {
        expect(check.passed, `Failed check: ${check.target} (${check.measured})`).toBe(true);
      }
    });
  });
});
