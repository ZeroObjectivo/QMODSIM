import { describe, expect, it } from 'vitest';
import {
  buildDailyErSurgeProfile,
  exponentialPdf,
  nonHomogeneousRate,
  poissonPmf,
  simulatePoissonInterArrivals,
} from '../arrivals';
import { computeEntropyMetrics, generateSecureClinicalToken } from '../entropy';
import { computeRosi, runFairMonteCarlo } from '../fairMonteCarlo';
import { analyzeAbsorbingMarkov, buildHospitalVlanMatrix } from '../markov';
import { solveMMcK } from '../queueing';
import { solveSecurityGame } from '../gameTheory';
import { generateInfusionTelemetryTrace, StreamingZScoreDetector } from '../anomaly';
import {
  componentReliability,
  evaluateHospitalInfrastructure,
  inherentAvailability,
  parallelReliability,
  seriesReliability,
} from '../reliability';
import { runFullEngineValidation } from '../validation';
import type { LabParameters } from '../../types/simulation';

describe('AEGIS-ER QMODSIM Mathematical Engines', () => {
  describe('Modules 1 & 3: Stochastic Arrivals', () => {
    it('computes normalized Poisson PMF summing to ~1.0', () => {
      let sum = 0;
      for (let k = 0; k <= 40; k++) {
        sum += poissonPmf(6, 1, k);
      }
      expect(Math.abs(sum - 1)).toBeLessThan(1e-6);
    });

    it('matches exponential density f(0) = λ', () => {
      expect(exponentialPdf(12, 0)).toBeCloseTo(12, 8);
      expect(exponentialPdf(12, -1)).toBe(0);
    });

    it('matches empirical mean inter-arrival to 1/λ within ±2%', () => {
      const sim = simulatePoissonInterArrivals(14, 15000, 20260401);
      expect(sim.relativeError).toBeLessThan(0.02);
    });

    it('computes non-homogeneous Gaussian surge profile peaking above baseline', () => {
      const rate = nonHomogeneousRate(14, 10, [
        { label: 'Code Blue', amplitude: 15, peakHour: 14, spread: 1.5 },
      ]);
      expect(rate).toBeCloseTo(25, 6);
      const profile = buildDailyErSurgeProfile(10, 12);
      expect(profile.length).toBeGreaterThan(24);
    });
  });

  describe('Modules 2 & 10: Information Entropy & Web Crypto Tokens', () => {
    it('computes exact Shannon entropy for 4-digit PIN vs 16-char alphanumeric', () => {
      const pin = computeEntropyMetrics({ alphabetSize: 10, length: 4, guessesPerSecond: 1e6 });
      expect(pin.entropyBits).toBeCloseTo(Math.log2(10000), 6);
      expect(pin.classification).toBe('CRITICAL');

      const strong = computeEntropyMetrics({ alphabetSize: 62, length: 18, guessesPerSecond: 1e9 });
      expect(strong.entropyBits).toBeGreaterThan(100);
      expect(strong.classification).toBe('STRONG');
    });

    it('generates unbiased tokens of exact requested length via Web Crypto API', () => {
      const token = generateSecureClinicalToken(24, 62);
      expect(token).toHaveLength(24);
      expect(/^[0-9A-Za-z]{24}$/.test(token)).toBe(true);
    });
  });

  describe('Module 4: FAIR Monte Carlo & ROSI', () => {
    it('converges ALE within ±1.5% across independent 10,000-trial seeds', () => {
      const input = {
        tefMin: 0.4,
        tefLikely: 1.4,
        tefMax: 3.8,
        lossLogMu: 13.9,
        lossLogSigma: 0.42,
        secondaryLossMultiplier: 0.65,
        mitigationFactor: 0.62,
        controlCostPhp: 850_000,
      };
      const runA = runFairMonteCarlo(input, 10000, 104729);
      const runB = runFairMonteCarlo(input, 10000, 224737);
      const relDiff = Math.abs(runA.aleMean - runB.aleMean) / runA.aleMean;

      expect(relDiff).toBeLessThan(0.015);
      expect(runA.aleP95).toBeGreaterThan(runA.aleMedian);
      expect(computeRosi(2_000_000, 500_000, 500_000)).toBeCloseTo(2.0, 6);
    });
  });

  describe('Module 5: Absorbing Markov Chains (Hospital VLAN)', () => {
    it('maintains row-stochasticity and exact absorption probability sums = 1.0', () => {
      const P = buildHospitalVlanMatrix(0.45, 0.28);
      const res = analyzeAbsorbingMarkov(P, 3);

      expect(res.isRowStochastic).toBe(true);
      expect(res.maxRowDeviation).toBeLessThan(1e-10);

      for (const row of res.absorptionProbabilities) {
        const sum = row.reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1.0, 6);
      }
      for (const steps of res.meanStepsToAbsorption) {
        expect(steps).toBeGreaterThan(0);
      }
    });
  });

  describe('Module 6: M/M/c/K Queueing Theory', () => {
    it("satisfies Little's Law conservation |L - λ_eff·W| < 10⁻⁵ including at ρ = 1", () => {
      const balanced = solveMMcK({ lambda: 16, mu: 4, c: 4, K: 16 });
      expect(balanced.rho).toBeCloseTo(1.0, 8);
      expect(balanced.littlesLawDiff).toBeLessThan(1e-10);

      const probSum = balanced.stateProbabilities.reduce((a, b) => a + b, 0);
      expect(probSum).toBeCloseTo(1.0, 8);

      const saturated = solveMMcK({ lambda: 30, mu: 4, c: 4, K: 12 });
      expect(saturated.pDrop).toBeGreaterThan(0.3);
      expect(saturated.littlesLawDiff).toBeLessThan(1e-10);
    });
  });

  describe('Module 7: Game Theory Security Defense', () => {
    it('computes exact Mixed-Strategy Nash Equilibrium p* and q*', () => {
      const res = solveSecurityGame({
        auditCost: 40_000,
        attackerGain: 200_000,
        breachPenalty: 800_000,
      });
      expect(res.pStar).toBeCloseTo(0.04, 6);
      expect(res.qStar).toBeCloseTo(0.2, 6);
    });
  });

  describe('Module 11: Zero-Allocation Streaming Z-Score Detector', () => {
    it('detects all 3 injected IV infusion dosage anomalies without poisoning baseline', () => {
      const trace = generateInfusionTelemetryTrace(120, 3.2, 7711);
      expect(trace[48]?.isAnomaly).toBe(true);
      expect(trace[76]?.isAnomaly).toBe(true);
      expect(trace[102]?.isAnomaly).toBe(true);

      const detector = new StreamingZScoreDetector(30);
      for (let i = 0; i < 35; i++) {
        detector.push(i, 50 + (i % 2 === 0 ? 0.5 : -0.5), 3.0);
      }
      const spike = detector.push(35, 65, 3.0);
      expect(spike.isAnomaly).toBe(true);
      expect(spike.zScore).toBeGreaterThan(10);
    });
  });

  describe('Module 12: System Reliability & Availability', () => {
    it('proves parallel redundancy strictly dominates single-path series reliability', () => {
      expect(componentReliability(0.001, 0)).toBe(1);
      expect(seriesReliability([0.9, 0.9])).toBeCloseTo(0.81, 6);
      expect(parallelReliability([0.9, 0.9])).toBeCloseTo(0.99, 6);
      expect(inherentAvailability(720, 2)).toBeCloseTo(720 / 722, 6);

      const infra = evaluateHospitalInfrastructure({
        wanFailureRate: 0.0012,
        ehrFailureRate: 0.0004,
        gatewayFailureRate: 0.0015,
        missionHours: 168,
        mtbfHours: 720,
        mttrHours: 1.5,
        redundantGateways: 2,
      });
      expect(infra.hybridSystemReliability).toBeGreaterThan(infra.seriesReliability);
    });
  });

  describe('Automated Verification & Validation Drawer Suite', () => {
    it('passes all 6 live mathematical invariant checks', () => {
      const defaults: LabParameters = {
        lambda: 14,
        mu: 4,
        c: 4,
        K: 16,
        surgeAmplitude: 10,
        zThreshold: 3.0,
        firewallContainment: 0.45,
        lateralRisk: 0.25,
        alphabetSize: 62,
        tokenLength: 16,
        fairMitigation: 0.65,
        controlCostPhp: 850_000,
        auditCostPhp: 35_000,
        attackerGainPhp: 250_000,
        breachPenaltyPhp: 1_200_000,
        mtbfHours: 720,
        mttrHours: 1.5,
        redundantGateways: 2,
      };
      const results = runFullEngineValidation(defaults);
      expect(results.length).toBe(6);
      for (const check of results) {
        expect(check.passed, `Failed check: ${check.target} (${check.measured})`).toBe(true);
      }
    });
  });
});
