import { useCallback, useState } from 'react';
import type { LabParameters } from '../types/simulation';
import { clamp } from '../engines/arrivals';

export const DEFAULT_LAB_PARAMS: LabParameters = {
  lambda: 14,
  mu: 4,
  c: 4,
  K: 16,
  surgeAmplitude: 10,
  zThreshold: 3.0,
  firewallContainment: 0.45,
  lateralRisk: 0.28,
  alphabetSize: 62,
  tokenLength: 14,
  fairMitigation: 0.62,
  controlCostPhp: 850_000,
  auditCostPhp: 35_000,
  attackerGainPhp: 250_000,
  breachPenaltyPhp: 1_200_000,
  mtbfHours: 720,
  mttrHours: 1.5,
  redundantGateways: 2,
};

export function useLabState() {
  const [params, setParams] = useState<LabParameters>(DEFAULT_LAB_PARAMS);

  const updateParam = useCallback(
    <K extends keyof LabParameters>(key: K, rawValue: LabParameters[K]) => {
      setParams((prev) => {
        const next: LabParameters = { ...prev, [key]: rawValue };
        // Strict numeric clamping & domain invariants (K >= c)
        const c = Math.round(clamp(next.c, 1, 12));
        const K = Math.max(c, Math.round(clamp(next.K, c, 40)));
        return {
          ...next,
          lambda: clamp(next.lambda, 1, 60),
          mu: clamp(next.mu, 1, 20),
          c,
          K,
          surgeAmplitude: clamp(next.surgeAmplitude, 0, 35),
          zThreshold: clamp(next.zThreshold, 1.5, 5.0),
          firewallContainment: clamp(next.firewallContainment, 0.15, 0.85),
          lateralRisk: clamp(next.lateralRisk, 0.05, 0.55),
          tokenLength: Math.round(clamp(next.tokenLength, 4, 32)),
          fairMitigation: clamp(next.fairMitigation, 0, 0.9),
          controlCostPhp: clamp(next.controlCostPhp, 100_000, 5_000_000),
          auditCostPhp: clamp(next.auditCostPhp, 5_000, 500_000),
          attackerGainPhp: clamp(next.attackerGainPhp, 50_000, 2_000_000),
          breachPenaltyPhp: clamp(next.breachPenaltyPhp, 200_000, 5_000_000),
          mtbfHours: clamp(next.mtbfHours, 100, 2000),
          mttrHours: clamp(next.mttrHours, 0.25, 24),
          redundantGateways: Math.round(clamp(next.redundantGateways, 1, 4)),
        };
      });
    },
    []
  );

  const resetParams = useCallback(() => setParams(DEFAULT_LAB_PARAMS), []);

  return { params, updateParam, resetParams };
}
