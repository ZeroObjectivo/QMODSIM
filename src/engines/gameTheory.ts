import type { GameTheoryInput, GameTheoryResult } from '../types/simulation';
import { clamp } from './arrivals';

/**
 * 2×2 Normal-Form Security Game: Hospital DPO Audit vs. Insider EHR Snooping.
 * Mixed-Strategy Nash Equilibrium:
 * - Defender audit probability: p* = C_audit / (G + F)
 * - Attacker exfiltration probability: q* = G / (G + F)
 */
export function solveSecurityGame(input: GameTheoryInput): GameTheoryResult {
  const auditCost = clamp(input.auditCost, 500, 2_000_000);
  const attackerGain = clamp(input.attackerGain, 1_000, 10_000_000);
  const breachPenalty = clamp(input.breachPenalty, 1_000, 50_000_000);

  const denom = attackerGain + breachPenalty;
  const pStar = clamp(auditCost / denom, 0, 1);
  const qStar = clamp(attackerGain / denom, 0, 1);

  // Payoffs: [U_defender, U_attacker]
  const auditExfiltrate: readonly [number, number] = [
    breachPenalty - auditCost,
    -breachPenalty,
  ];
  const auditComply: readonly [number, number] = [-auditCost, 0];
  const monitorExfiltrate: readonly [number, number] = [-attackerGain, attackerGain];
  const monitorComply: readonly [number, number] = [0, 0];

  const expectedDefenderUtility =
    pStar * qStar * auditExfiltrate[0] +
    pStar * (1 - qStar) * auditComply[0] +
    (1 - pStar) * qStar * monitorExfiltrate[0] +
    (1 - pStar) * (1 - qStar) * monitorComply[0];

  const expectedAttackerUtility =
    pStar * qStar * auditExfiltrate[1] +
    pStar * (1 - qStar) * auditComply[1] +
    (1 - pStar) * qStar * monitorExfiltrate[1] +
    (1 - pStar) * (1 - qStar) * monitorComply[1];

  return {
    pStar,
    qStar,
    expectedDefenderUtility,
    expectedAttackerUtility,
    payoffMatrix: {
      auditExfiltrate,
      auditComply,
      monitorExfiltrate,
      monitorComply,
    },
  };
}
