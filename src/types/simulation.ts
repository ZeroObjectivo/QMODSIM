// Branded domain unit types (zero `any`, strict physical/financial units)
export type OrdersPerHour = number & { readonly __brand: 'OrdersPerHour' };
export type Hours = number & { readonly __brand: 'Hours' };
export type Bits = number & { readonly __brand: 'Bits' };
export type PHP = number & { readonly __brand: 'PHP' };
export type Probability = number & { readonly __brand: 'Probability' };
export type ZScore = number & { readonly __brand: 'ZScore' };

export type ThemeMode = 'light' | 'dark';
export type ArchetypeTab = 'scenarios' | 'lab' | 'codex';
export type BranchId = 'guadalupe' | 'bangkal' | 'taguig' | 'cainta' | 'davao';

export interface SurgePeak {
  readonly label: string;
  readonly amplitude: number; // A_i (orders/hr)
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
  readonly mitigationFactor: number;
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
  | 'S0_CART_SELECT'
  | 'S1_GCASH_VERIFY'
  | 'S2_KITCHEN_PREP'
  | 'S3_FULFILLED'
  | 'S4_ABANDONED_FRAUD';

export type MarkovStateNode =
  | { readonly id: 'S0_CART_SELECT'; readonly label: string; readonly kind: 'transient'; readonly index: 0 }
  | { readonly id: 'S1_GCASH_VERIFY'; readonly label: string; readonly kind: 'transient'; readonly index: 1 }
  | { readonly id: 'S2_KITCHEN_PREP'; readonly label: string; readonly kind: 'transient'; readonly index: 2 }
  | { readonly id: 'S3_FULFILLED'; readonly label: string; readonly kind: 'absorbing-safe'; readonly index: 3 }
  | { readonly id: 'S4_ABANDONED_FRAUD'; readonly label: string; readonly kind: 'absorbing-loss'; readonly index: 4 };

export interface MarkovAnalysisResult {
  readonly states: readonly MarkovStateNode[];
  readonly transitionMatrix: readonly (readonly number[])[];
  readonly fundamentalMatrix: readonly (readonly number[])[];
  readonly absorptionProbabilities: readonly (readonly number[])[]; // cols: [Fulfilled, Abandoned/Fraud]
  readonly meanStepsToAbsorption: readonly number[];
  readonly isRowStochastic: boolean;
  readonly maxRowDeviation: number;
}

export interface QueueingInput {
  readonly lambda: number; // orders/hr
  readonly mu: number;     // orders/hr per prep station
  readonly c: number;      // active kitchen grill/prep stations
  readonly K: number;      // total active order ticket buffer
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
  readonly auditCost: number;
  readonly attackerGain: number;
  readonly breachPenalty: number;
}

export interface GameTheoryResult {
  readonly pStar: number;
  readonly qStar: number;
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
  readonly ispFailureRate: number;      // Branch ISP failures / hr
  readonly mysqlFailureRate: number;    // Centralized MySQL failures / hr
  readonly gcashApiFailureRate: number; // GCash API gateway failures / hr
  readonly missionHours: number;        // t (hours)
  readonly mtbfHours: number;
  readonly mttrHours: number;
  readonly redundantLinks: number;      // 1..4 failover gateways / branches
}

export interface ReliabilityResult {
  readonly seriesReliability: number;
  readonly parallelLinkReliability: number;
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
  readonly branch: BranchId;
  readonly lambda: number;
  readonly mu: number;
  readonly c: number;
  readonly K: number;
  readonly surgeAmplitude: number;
  readonly zThreshold: number;
  readonly gcashApiAutomation: number; // 0.20..0.90 instant verification rate
  readonly stockoutCancelRisk: number; // 0.04..0.45 abandonment/stockout risk
  readonly alphabetSize: 10 | 36 | 62 | 94;
  readonly tokenLength: number;
  readonly fairMitigation: number;
  readonly controlCostPhp: number;
  readonly auditCostPhp: number;
  readonly attackerGainPhp: number;
  readonly breachPenaltyPhp: number;
  readonly mtbfHours: number;
  readonly mttrHours: number;
  readonly redundantLinks: number;
}
