// Branded domain unit types (zero `any`, strict physical/financial units)
export type PatientsPerHour = number & { readonly __brand: 'PatientsPerHour' };
export type Hours = number & { readonly __brand: 'Hours' };
export type Bits = number & { readonly __brand: 'Bits' };
export type PHP = number & { readonly __brand: 'PHP' };
export type Probability = number & { readonly __brand: 'Probability' };
export type ZScore = number & { readonly __brand: 'ZScore' };

export type ThemeMode = 'light' | 'dark';
export type ArchetypeTab = 'scenarios' | 'lab' | 'codex';

export interface SurgePeak {
  readonly label: string;
  readonly amplitude: number; // A_i (patients/hr)
  readonly peakHour: number;  // t_peak,i (0..24)
  readonly spread: number;    // sigma_i (hours)
}

export interface ArrivalSimulationSummary {
  readonly lambda: number;
  readonly theoreticalMeanInterArrival: number;
  readonly simulatedMeanInterArrival: number;
  readonly relativeError: number;
  readonly samples: readonly number[];
}

export interface EntropyInput {
  readonly alphabetSize: 10 | 36 | 62 | 94;
  readonly length: number;
  readonly guessesPerSecond: number;
}

export interface EntropyResult {
  readonly entropyBits: number;
  readonly keyspaceSize: number;
  readonly keyspaceLog10: number;
  readonly timeToCrackSeconds: number;
  readonly humanReadableCrackTime: string;
  readonly classification: 'CRITICAL' | 'WEAK' | 'MODERATE' | 'STRONG';
}

export interface FairInput {
  readonly tefMin: number;
  readonly tefLikely: number;
  readonly tefMax: number;
  readonly lossLogMu: number;
  readonly lossLogSigma: number;
  readonly secondaryLossMultiplier: number;
  readonly mitigationFactor: number; // 0..0.95 reduction in ALE
  readonly controlCostPhp: number;
}

export interface HistogramBin {
  readonly min: number;
  readonly max: number;
  readonly count: number;
  readonly frequency: number;
}

export interface FairSimulationResult {
  readonly trials: number;
  readonly seed: number;
  readonly aleMean: number;
  readonly aleMedian: number;
  readonly aleP90: number;
  readonly aleP95: number;
  readonly aleMax: number;
  readonly aleMitigatedMean: number;
  readonly rosi: number;
  readonly histogram: readonly HistogramBin[];
}

export type MarkovStateId =
  | 'S0_TRIAGE_KIOSK'
  | 'S1_EHR_STAGING'
  | 'S2_ICU_VLAN'
  | 'S3_QUARANTINED'
  | 'S4_COMPROMISED';

export type MarkovStateNode =
  | { readonly id: 'S0_TRIAGE_KIOSK'; readonly label: string; readonly kind: 'transient'; readonly index: 0 }
  | { readonly id: 'S1_EHR_STAGING'; readonly label: string; readonly kind: 'transient'; readonly index: 1 }
  | { readonly id: 'S2_ICU_VLAN'; readonly label: string; readonly kind: 'transient'; readonly index: 2 }
  | { readonly id: 'S3_QUARANTINED'; readonly label: string; readonly kind: 'absorbing-safe'; readonly index: 3 }
  | { readonly id: 'S4_COMPROMISED'; readonly label: string; readonly kind: 'absorbing-breach'; readonly index: 4 };

export interface MarkovAnalysisResult {
  readonly states: readonly MarkovStateNode[];
  readonly transitionMatrix: readonly (readonly number[])[];
  readonly fundamentalMatrix: readonly (readonly number[])[];
  readonly absorptionProbabilities: readonly (readonly number[])[]; // rows: transient, cols: [Quarantined, Compromised]
  readonly meanStepsToAbsorption: readonly number[];
  readonly isRowStochastic: boolean;
  readonly maxRowDeviation: number;
}

export interface QueueingInput {
  readonly lambda: number; // patients/hr
  readonly mu: number;     // patients/hr per bay
  readonly c: number;      // active triage bays
  readonly K: number;      // total ER buffer capacity (c + waiting chairs)
}

export interface QueueingResult {
  readonly lambda: number;
  readonly mu: number;
  readonly c: number;
  readonly K: number;
  readonly rho: number;
  readonly p0: number;
  readonly pDrop: number;
  readonly lambdaEff: number;
  readonly L: number;
  readonly Lq: number;
  readonly W: number;
  readonly Wq: number;
  readonly stateProbabilities: readonly number[];
  readonly littlesLawDiff: number;
}

export interface GameTheoryInput {
  readonly auditCost: number;    // C_audit (PHP)
  readonly attackerGain: number; // G (PHP)
  readonly breachPenalty: number; // F (PHP)
}

export interface GameTheoryResult {
  readonly pStar: number; // Defender optimal audit probability
  readonly qStar: number; // Attacker optimal exfiltration probability
  readonly expectedDefenderUtility: number;
  readonly expectedAttackerUtility: number;
  readonly payoffMatrix: {
    readonly auditExfiltrate: readonly [number, number];
    readonly auditComply: readonly [number, number];
    readonly monitorExfiltrate: readonly [number, number];
    readonly monitorComply: readonly [number, number];
  };
}

export interface AnomalyTick {
  readonly step: number;
  readonly value: number;
  readonly mean: number;
  readonly stdDev: number;
  readonly zScore: number;
  readonly isAnomaly: boolean;
}

export interface ReliabilityInput {
  readonly wanFailureRate: number;      // failures / hr
  readonly ehrFailureRate: number;      // failures / hr
  readonly gatewayFailureRate: number;  // failures / hr
  readonly missionHours: number;        // t (hours)
  readonly mtbfHours: number;
  readonly mttrHours: number;
  readonly redundantGateways: number;   // 1..4 parallel gateways
}

export interface ReliabilityResult {
  readonly seriesReliability: number;
  readonly parallelGatewayReliability: number;
  readonly hybridSystemReliability: number;
  readonly inherentAvailability: number;
  readonly expectedAnnualDowntimeHours: number;
  readonly curvePoints: readonly { readonly hour: number; readonly series: number; readonly redundant: number }[];
}

export interface ValidationResult {
  readonly target: string;
  readonly standard: string;
  readonly measured: string;
  readonly passed: boolean;
}

export interface LabParameters {
  readonly lambda: number;
  readonly mu: number;
  readonly c: number;
  readonly K: number;
  readonly surgeAmplitude: number;
  readonly zThreshold: number;
  readonly firewallContainment: number; // 0.15..0.85
  readonly lateralRisk: number;         // 0.05..0.55
  readonly alphabetSize: 10 | 36 | 62 | 94;
  readonly tokenLength: number;
  readonly fairMitigation: number;      // 0..0.90
  readonly controlCostPhp: number;
  readonly auditCostPhp: number;
  readonly attackerGainPhp: number;
  readonly breachPenaltyPhp: number;
  readonly mtbfHours: number;
  readonly mttrHours: number;
  readonly redundantGateways: number;
}
