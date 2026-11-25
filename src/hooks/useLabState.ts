import { useCallback, useState } from 'react';
import type { BranchId, LabParameters } from '../types/simulation';
import { clamp } from '../engines/arrivals';

export const BRANCH_PRESETS: Record<
  BranchId,
  { readonly name: string; readonly lambda: number; readonly c: number; readonly K: number }
> = {
  guadalupe: { name: 'Guadalupe Nuevo (Flagship)', lambda: 26, c: 3, K: 18 },
  bangkal: { name: 'Bangkal, Makati', lambda: 21, c: 3, K: 15 },
  taguig: { name: 'Taguig Branch', lambda: 24, c: 3, K: 16 },
  cainta: { name: 'Cainta, Rizal', lambda: 18, c: 2, K: 14 },
  davao: { name: 'Davao Regional', lambda: 22, c: 3, K: 16 },
};

export const DEFAULT_LAB_PARAMS: LabParameters = {
  branch: 'guadalupe',
  lambda: 26,
  mu: 9.5,
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

export function useLabState() {
  const [params, setParams] = useState<LabParameters>(DEFAULT_LAB_PARAMS);

  const updateParam = useCallback(
    <K extends keyof LabParameters>(key: K, rawValue: LabParameters[K]) => {
      setParams((prev) => {
        const branchOverride =
          key === 'branch'
            ? {
                lambda: BRANCH_PRESETS[rawValue as BranchId].lambda,
                c: BRANCH_PRESETS[rawValue as BranchId].c,
                K: BRANCH_PRESETS[rawValue as BranchId].K,
              }
            : {};
        const next: LabParameters = { ...prev, [key]: rawValue, ...branchOverride };
        const c = Math.round(clamp(next.c, 1, 10));
        const K = Math.max(c, Math.round(clamp(next.K, c, 45)));
        return {
          ...next,
          lambda: clamp(next.lambda, 2, 80),
          mu: clamp(next.mu, 2, 25),
          c,
          K,
          surgeAmplitude: clamp(next.surgeAmplitude, 0, 35),
          zThreshold: clamp(next.zThreshold, 1.5, 5.0),
          gcashApiAutomation: clamp(next.gcashApiAutomation, 0.2, 0.9),
          stockoutCancelRisk: clamp(next.stockoutCancelRisk, 0.03, 0.45),
          tokenLength: Math.round(clamp(next.tokenLength, 4, 32)),
          fairMitigation: clamp(next.fairMitigation, 0, 0.92),
          controlCostPhp: clamp(next.controlCostPhp, 40_000, 1_200_000),
          auditCostPhp: clamp(next.auditCostPhp, 3_000, 150_000),
          attackerGainPhp: clamp(next.attackerGainPhp, 20_000, 500_000),
          breachPenaltyPhp: clamp(next.breachPenaltyPhp, 50_000, 2_000_000),
          mtbfHours: clamp(next.mtbfHours, 100, 2000),
          mttrHours: clamp(next.mttrHours, 0.25, 24),
          redundantLinks: Math.round(clamp(next.redundantLinks, 1, 4)),
        };
      });
    },
    []
  );

  const resetParams = useCallback(() => setParams(DEFAULT_LAB_PARAMS), []);

  return { params, updateParam, resetParams };
}
