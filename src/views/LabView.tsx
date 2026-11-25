import { useMemo, useState } from 'react';
import { KeyRound, MapPin, RefreshCw, RotateCcw } from 'lucide-react';
import type { BranchId, LabParameters, ThemeMode } from '../types/simulation';
import { BRANCH_PRESETS } from '../hooks/useLabState';
import { solveMMcK } from '../engines/queueing';
import { analyzeAbsorbingMarkov, buildOrderLifecycleMatrix } from '../engines/markov';
import { computeEntropyMetrics, generateSecureClinicalToken } from '../engines/entropy';
import { solveSecurityGame } from '../engines/gameTheory';
import { generateIngredientDeductionTrace } from '../engines/anomaly';
import { evaluateBranchInfrastructure } from '../engines/reliability';
import { useFairWorker } from '../hooks/useFairWorker';
import { BranchKitchenCanvas } from '../components/BranchKitchenCanvas';
import { MarkovGraphCanvas } from '../components/MarkovGraphCanvas';
import { FairHistogramCanvas } from '../components/FairHistogramCanvas';
import { BomShrinkageCanvas } from '../components/BomShrinkageCanvas';

interface LabViewProps {
  readonly theme: ThemeMode;
  readonly params: LabParameters;
  readonly onUpdate: <K extends keyof LabParameters>(key: K, value: LabParameters[K]) => void;
  readonly onReset: () => void;
}

function formatPhp(n: number): string {
  return `₱${Math.round(n).toLocaleString('en-PH')}`;
}

interface SliderRowProps {
  readonly label: string;
  readonly valueDisplay: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly value: number;
  readonly onChange: (val: number) => void;
}

function SliderRow({ label, valueDisplay, min, max, step, value, onChange }: SliderRowProps) {
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-stone-700 dark:text-stone-300">{label}</span>
        <span className="font-mono font-semibold tabular-nums text-orange-700 dark:text-amber-400">
          {valueDisplay}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none bg-stone-200 accent-orange-700 dark:bg-stone-800 dark:accent-amber-500"
      />
    </label>
  );
}

export function LabView({ theme, params, onUpdate, onReset }: LabViewProps) {
  const [sampleToken, setSampleToken] = useState<string>(() =>
    generateSecureClinicalToken(params.tokenLength, params.alphabetSize)
  );

  const activeBranchName = BRANCH_PRESETS[params.branch].name;

  const queue = useMemo(
    () => solveMMcK({ lambda: params.lambda, mu: params.mu, c: params.c, K: params.K }),
    [params.lambda, params.mu, params.c, params.K]
  );

  const markov = useMemo(() => {
    const P = buildOrderLifecycleMatrix(params.gcashApiAutomation, params.stockoutCancelRisk);
    return analyzeAbsorbingMarkov(P, 3);
  }, [params.gcashApiAutomation, params.stockoutCancelRisk]);

  const fairInput = useMemo(
    () => ({
      tefMin: 1.5,
      tefLikely: 4.5,
      tefMax: 10.0,
      lossLogMu: 11.4,
      lossLogSigma: 0.42,
      secondaryLossMultiplier: 0.55,
      mitigationFactor: params.fairMitigation,
      controlCostPhp: params.controlCostPhp,
    }),
    [params.fairMitigation, params.controlCostPhp]
  );

  const { result: fairResult, isComputing: fairBusy } = useFairWorker(fairInput, 10000, 104729);

  const entropy = useMemo(
    () =>
      computeEntropyMetrics({
        alphabetSize: params.alphabetSize,
        length: params.tokenLength,
        guessesPerSecond: 1e7,
      }),
    [params.alphabetSize, params.tokenLength]
  );

  const game = useMemo(
    () =>
      solveSecurityGame({
        auditCost: params.auditCostPhp,
        attackerGain: params.attackerGainPhp,
        breachPenalty: params.breachPenaltyPhp,
      }),
    [params.auditCostPhp, params.attackerGainPhp, params.breachPenaltyPhp]
  );

  const anomalyTicks = useMemo(
    () => generateIngredientDeductionTrace(120, params.zThreshold, 7711),
    [params.zThreshold]
  );

  const reliability = useMemo(
    () =>
      evaluateBranchInfrastructure({
        ispFailureRate: 0.0018,
        mysqlFailureRate: 0.0003,
        gcashApiFailureRate: 0.001,
        missionHours: 168,
        mtbfHours: params.mtbfHours,
        mttrHours: params.mttrHours,
        redundantLinks: params.redundantLinks,
      }),
    [params.mtbfHours, params.mttrHours, params.redundantLinks]
  );

  const regenerateToken = (len = params.tokenLength, alpha = params.alphabetSize) => {
    setSampleToken(generateSecureClinicalToken(len, alpha));
  };

  return (
    <div className="space-y-6">
      {/* Branch Location Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-[#171513]">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200">
          <MapPin className="h-4 w-4 text-orange-700 dark:text-amber-400" />
          <span className="font-mono uppercase">Active Old Yorker's Branch:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(BRANCH_PRESETS) as BranchId[]).map((id) => {
            const selected = params.branch === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onUpdate('branch', id)}
                className={`border px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                  selected
                    ? 'border-orange-700 bg-amber-50 text-orange-800 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-900'
                }`}
              >
                {BRANCH_PRESETS[id].name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top KPI Telemetry Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          {
            label: 'Grill Utilization (ρ)',
            val: queue.rho.toFixed(2),
            sub: queue.rho >= 0.95 ? 'SATURATED' : queue.rho >= 0.75 ? 'PEAK RUSH' : 'OPTIMAL',
            tone:
              queue.rho >= 0.95
                ? 'text-rose-700 dark:text-rose-400'
                : queue.rho >= 0.75
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Dropped Orders (P_K)',
            val: `${(queue.pDrop * 100).toFixed(2)}%`,
            sub: `λ_eff = ${queue.lambdaEff.toFixed(1)}/hr`,
            tone: 'text-stone-900 dark:text-stone-100',
          },
          {
            label: 'Order Fulfill Prob',
            val: `${((markov.absorptionProbabilities[0]?.[0] ?? 0) * 100).toFixed(1)}%`,
            sub: `t₀ = ${(markov.meanStepsToAbsorption[0] ?? 0).toFixed(1)} stages`,
            tone: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'FAIR Mitigated ALE',
            val: formatPhp(fairResult.aleMitigatedMean),
            sub: `ROSI ${(fairResult.rosi * 100).toFixed(0)}%`,
            tone: 'text-orange-700 dark:text-amber-400',
          },
          {
            label: 'RBAC Entropy H(X)',
            val: `${entropy.entropyBits.toFixed(1)} bits`,
            sub: entropy.classification,
            tone:
              entropy.classification === 'STRONG'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400',
          },
          {
            label: '7-Day POS Survival',
            val: `${(reliability.hybridSystemReliability * 100).toFixed(2)}%`,
            sub: `A = ${(reliability.inherentAvailability * 100).toFixed(2)}%`,
            tone: 'text-emerald-600 dark:text-emerald-400',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="border border-stone-200 bg-white p-3.5 dark:border-stone-800 dark:bg-[#171513]"
          >
            <div className="font-mono text-[10px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {kpi.label}
            </div>
            <div className={`mt-1 font-mono text-lg font-semibold tabular-nums ${kpi.tone}`}>
              {kpi.val}
            </div>
            <div className="mt-0.5 font-mono text-[11px] tabular-nums text-stone-500 dark:text-stone-400">
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ROW 1: Queueing & Surge Arrivals (Modules 1, 3, 6) */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513] lg:col-span-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 dark:border-stone-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-900 dark:text-stone-100">
                Modules 1, 3 & 6 · Kitchen Queue (M/M/c/K)
              </h3>
              <p className="font-mono text-[11px] text-stone-500">
                Meal rushes & finite order ticket buffer
              </p>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 border border-stone-200 px-2 py-1 font-mono text-[11px] text-stone-600 hover:bg-stone-100 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          <div className="mt-4 space-y-3.5">
            <SliderRow
              label="Branch Order Arrival Rate (λ)"
              valueDisplay={`${params.lambda.toFixed(1)} ord/hr`}
              min={2}
              max={65}
              step={0.5}
              value={params.lambda}
              onChange={(v) => onUpdate('lambda', v)}
            />
            <SliderRow
              label="Grill Station Fulfillment Rate (μ)"
              valueDisplay={`${params.mu.toFixed(1)} ord/hr`}
              min={2}
              max={20}
              step={0.5}
              value={params.mu}
              onChange={(v) => onUpdate('mu', v)}
            />
            <SliderRow
              label="Active Kitchen Grill Stations (c)"
              valueDisplay={`${params.c} stations`}
              min={1}
              max={10}
              step={1}
              value={params.c}
              onChange={(v) => onUpdate('c', v)}
            />
            <SliderRow
              label="Active Order Buffer Capacity (K)"
              valueDisplay={`${params.K} tickets`}
              min={params.c}
              max={45}
              step={1}
              value={params.K}
              onChange={(v) => onUpdate('K', v)}
            />
            <SliderRow
              label="7:00 PM Dinner Rush Surge (A)"
              valueDisplay={`+${params.surgeAmplitude.toFixed(0)} ord/hr`}
              min={0}
              max={30}
              step={1}
              value={params.surgeAmplitude}
              onChange={(v) => onUpdate('surgeAmplitude', v)}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-stone-200 pt-3 font-mono text-xs tabular-nums dark:border-stone-800">
            <div>
              <span className="text-stone-500">Active Orders (L): </span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {queue.L.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-stone-500">Turnaround (W): </span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {(queue.W * 60).toFixed(1)}m
              </span>
            </div>
          </div>
        </div>

        <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513] lg:col-span-8">
          <BranchKitchenCanvas
            theme={theme}
            queue={queue}
            surgeAmplitude={params.surgeAmplitude}
            branchName={activeBranchName}
          />
        </div>
      </div>

      {/* ROW 2: Absorbing Markov Order Lifecycle & FAIR Monte Carlo (Modules 4 & 5) */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513] lg:col-span-6">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 dark:border-stone-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-900 dark:text-stone-100">
                Module 5 · Absorbing Markov Order Ticket Lifecycle
              </h3>
              <p className="font-mono text-[11px] text-stone-500">
                N = (I - Q)⁻¹ · B = N · R · t = N · 1
              </p>
            </div>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              Σ P_ij = 1.0000
            </span>
          </div>

          <div className="mt-3">
            <MarkovGraphCanvas theme={theme} markov={markov} />
          </div>

          <div className="mt-3 grid gap-3 border-t border-stone-200 pt-3 sm:grid-cols-2 dark:border-stone-800">
            <SliderRow
              label="GCash API Instant Verification"
              valueDisplay={`${(params.gcashApiAutomation * 100).toFixed(0)}%`}
              min={0.2}
              max={0.9}
              step={0.05}
              value={params.gcashApiAutomation}
              onChange={(v) => onUpdate('gcashApiAutomation', v)}
            />
            <SliderRow
              label="Stockout / Receipt Fraud Risk"
              valueDisplay={`${(params.stockoutCancelRisk * 100).toFixed(0)}%`}
              min={0.03}
              max={0.45}
              step={0.02}
              value={params.stockoutCancelRisk}
              onChange={(v) => onUpdate('stockoutCancelRisk', v)}
            />
          </div>
        </div>

        <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513] lg:col-span-6">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 dark:border-stone-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-900 dark:text-stone-100">
                Module 4 · FAIR Monte Carlo Risk (Web Worker)
              </h3>
              <p className="font-mono text-[11px] text-stone-500">
                10,000 trials · Shrinkage, Fake GCash & RA 10173 (PHP)
              </p>
            </div>
            <span className="font-mono text-[11px] text-orange-700 dark:text-amber-400">
              {fairBusy ? 'RUNNING WORKER...' : '10,000 TRIALS'}
            </span>
          </div>

          <div className="mt-3">
            <FairHistogramCanvas theme={theme} fair={fairResult} />
          </div>

          <div className="mt-3 grid gap-3 border-t border-stone-200 pt-3 sm:grid-cols-2 dark:border-stone-800">
            <SliderRow
              label="Automation Mitigation Factor"
              valueDisplay={`${(params.fairMitigation * 100).toFixed(0)}%`}
              min={0}
              max={0.92}
              step={0.04}
              value={params.fairMitigation}
              onChange={(v) => onUpdate('fairMitigation', v)}
            />
            <SliderRow
              label="Annual System Control Cost"
              valueDisplay={formatPhp(params.controlCostPhp)}
              min={40_000}
              max={800_000}
              step={20_000}
              value={params.controlCostPhp}
              onChange={(v) => onUpdate('controlCostPhp', v)}
            />
          </div>
        </div>
      </div>

      {/* ROW 3: BOM Z-Score Anomaly + RBAC/GCash Entropy */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513] lg:col-span-7">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 dark:border-stone-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-900 dark:text-stone-100">
                Module 11 · Zero-Allocation BOM Ingredient Z-Score Detector
              </h3>
              <p className="font-mono text-[11px] text-stone-500">
                Circular Float64Array (W=30) · Flags abnormal hotdog bun/beef shrinkage
              </p>
            </div>
            <span className="font-mono text-xs font-semibold tabular-nums text-rose-700 dark:text-rose-400">
              {anomalyTicks.filter((t) => t.isAnomaly).length} Alerts
            </span>
          </div>

          <div className="mt-3">
            <BomShrinkageCanvas
              theme={theme}
              ticks={anomalyTicks}
              threshold={params.zThreshold}
            />
          </div>

          <div className="mt-3 border-t border-stone-200 pt-3 dark:border-stone-800">
            <SliderRow
              label="BOM Shrinkage Alert Threshold (τ_crit)"
              valueDisplay={`±${params.zThreshold.toFixed(1)}σ`}
              min={1.5}
              max={5.0}
              step={0.1}
              value={params.zThreshold}
              onChange={(v) => onUpdate('zThreshold', v)}
            />
          </div>
        </div>

        <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513] lg:col-span-5">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 dark:border-stone-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-900 dark:text-stone-100">
                Modules 2 & 10 · RBAC & GCash Webhook Entropy
              </h3>
              <p className="font-mono text-[11px] text-stone-500">
                H(X) = log₂(|Σ|^L) · crypto.getRandomValues()
              </p>
            </div>
            <KeyRound className="h-4 w-4 text-orange-700 dark:text-amber-400" />
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <span className="block text-xs text-stone-700 dark:text-stone-300">
                Credential / Token Alphabet Size (|Σ|)
              </span>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {([10, 36, 62, 94] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      onUpdate('alphabetSize', size);
                      regenerateToken(params.tokenLength, size);
                    }}
                    className={`border py-1 font-mono text-xs font-semibold ${
                      params.alphabetSize === size
                        ? 'border-orange-700 bg-amber-50 text-orange-800 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-900'
                    }`}
                  >
                    |Σ|={size}
                  </button>
                ))}
              </div>
            </div>

            <SliderRow
              label="Admin / Branch Manager Token Length (L)"
              valueDisplay={`${params.tokenLength} chars`}
              min={4}
              max={32}
              step={1}
              value={params.tokenLength}
              onChange={(v) => {
                onUpdate('tokenLength', v);
                regenerateToken(v, params.alphabetSize);
              }}
            />

            <div className="grid grid-cols-2 gap-2 border border-stone-200 bg-stone-50 p-3 font-mono text-xs tabular-nums dark:border-stone-800 dark:bg-[#0E0D0C]">
              <div>
                <div className="text-[10px] text-stone-500">SHANNON ENTROPY</div>
                <div className="font-semibold text-stone-900 dark:text-stone-100">
                  {entropy.entropyBits.toFixed(2)} bits
                </div>
              </div>
              <div>
                <div className="text-[10px] text-stone-500">T_CRACK (@ 10⁷/s)</div>
                <div className="font-semibold text-orange-700 dark:text-amber-400">
                  {entropy.humanReadableCrackTime}
                </div>
              </div>
            </div>

            <div className="border border-stone-200 bg-stone-50 p-2.5 dark:border-stone-800 dark:bg-[#0E0D0C]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-stone-500">
                  CSPRNG Sample Session Token
                </span>
                <button
                  type="button"
                  onClick={() => regenerateToken()}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-orange-700 hover:underline dark:text-amber-400"
                >
                  <RefreshCw className="h-3 w-3" />
                  Roll
                </button>
              </div>
              <div className="mt-1 truncate font-mono text-xs text-stone-900 dark:text-stone-100">
                {sampleToken}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4: Module 7 Game Theory & Module 12 Reliability */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513] lg:col-span-6">
          <div className="border-b border-stone-200 pb-2.5 dark:border-stone-800">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-900 dark:text-stone-100">
              Module 7 · Game Theory (Branch Audit vs. Shrinkage / Fraud)
            </h3>
            <p className="font-mono text-[11px] text-stone-500">
              Mixed-Strategy Nash: p* = C_audit / (G + F) · q* = G / (G + F)
            </p>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <SliderRow
              label="Audit Cost (C)"
              valueDisplay={formatPhp(params.auditCostPhp)}
              min={3_000}
              max={100_000}
              step={2_000}
              value={params.auditCostPhp}
              onChange={(v) => onUpdate('auditCostPhp', v)}
            />
            <SliderRow
              label="Shrinkage Gain (G)"
              valueDisplay={formatPhp(params.attackerGainPhp)}
              min={20_000}
              max={300_000}
              step={10_000}
              value={params.attackerGainPhp}
              onChange={(v) => onUpdate('attackerGainPhp', v)}
            />
            <SliderRow
              label="Penalty / Loss (F)"
              valueDisplay={formatPhp(params.breachPenaltyPhp)}
              min={50_000}
              max={1_500_000}
              step={25_000}
              value={params.breachPenaltyPhp}
              onChange={(v) => onUpdate('breachPenaltyPhp', v)}
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse border border-stone-200 font-mono text-xs tabular-nums dark:border-stone-800">
              <thead>
                <tr className="bg-stone-50 dark:bg-[#0E0D0C]">
                  <th className="border border-stone-200 p-2 text-left dark:border-stone-800">
                    Owner \ Threat
                  </th>
                  <th className="border border-stone-200 p-2 text-center dark:border-stone-800">
                    Skim / Fraud (q*={(game.qStar * 100).toFixed(1)}%)
                  </th>
                  <th className="border border-stone-200 p-2 text-center dark:border-stone-800">
                    Comply ({((1 - game.qStar) * 100).toFixed(1)}%)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-stone-200 p-2 font-semibold dark:border-stone-800">
                    Audit (p*={(game.pStar * 100).toFixed(1)}%)
                  </td>
                  <td className="border border-stone-200 p-2 text-center dark:border-stone-800">
                    ({formatPhp(game.payoffMatrix.auditExfiltrate[0])},{' '}
                    {formatPhp(game.payoffMatrix.auditExfiltrate[1])})
                  </td>
                  <td className="border border-stone-200 p-2 text-center dark:border-stone-800">
                    ({formatPhp(game.payoffMatrix.auditComply[0])}, ₱0)
                  </td>
                </tr>
                <tr>
                  <td className="border border-stone-200 p-2 font-semibold dark:border-stone-800">
                    Monitor ({((1 - game.pStar) * 100).toFixed(1)}%)
                  </td>
                  <td className="border border-stone-200 p-2 text-center dark:border-stone-800">
                    ({formatPhp(game.payoffMatrix.monitorExfiltrate[0])},{' '}
                    {formatPhp(game.payoffMatrix.monitorExfiltrate[1])})
                  </td>
                  <td className="border border-stone-200 p-2 text-center dark:border-stone-800">
                    (₱0, ₱0)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513] lg:col-span-6">
          <div className="border-b border-stone-200 pb-2.5 dark:border-stone-800">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-900 dark:text-stone-100">
              Module 12 · Multi-Branch POS, MySQL & GCash Failover
            </h3>
            <p className="font-mono text-[11px] text-stone-500">
              R_sys = Π R_i(t) · R_parallel = 1 - Π(1 - R_i) · A = MTBF / (MTBF + MTTR)
            </p>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <SliderRow
              label="Redundant ISP Links"
              valueDisplay={`${params.redundantLinks}×`}
              min={1}
              max={4}
              step={1}
              value={params.redundantLinks}
              onChange={(v) => onUpdate('redundantLinks', v)}
            />
            <SliderRow
              label="MTBF (hours)"
              valueDisplay={`${params.mtbfHours}h`}
              min={120}
              max={2000}
              step={40}
              value={params.mtbfHours}
              onChange={(v) => onUpdate('mtbfHours', v)}
            />
            <SliderRow
              label="MTTR (hours)"
              valueDisplay={`${params.mttrHours.toFixed(2)}h`}
              min={0.25}
              max={12}
              step={0.25}
              value={params.mttrHours}
              onChange={(v) => onUpdate('mttrHours', v)}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs tabular-nums">
            <div className="border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-[#0E0D0C]">
              <div className="text-[10px] text-stone-500">SERIES R(168h)</div>
              <div className="mt-1 text-base font-semibold text-amber-700 dark:text-amber-400">
                {(reliability.seriesReliability * 100).toFixed(2)}%
              </div>
            </div>
            <div className="border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-[#0E0D0C]">
              <div className="text-[10px] text-stone-500">FAILOVER R(168h)</div>
              <div className="mt-1 text-base font-semibold text-emerald-600 dark:text-emerald-400">
                {(reliability.hybridSystemReliability * 100).toFixed(2)}%
              </div>
            </div>
            <div className="border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-[#0E0D0C]">
              <div className="text-[10px] text-stone-500">ANNUAL DOWNTIME</div>
              <div className="mt-1 text-base font-semibold text-orange-700 dark:text-amber-400">
                {reliability.expectedAnnualDowntimeHours.toFixed(1)} hrs/yr
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
