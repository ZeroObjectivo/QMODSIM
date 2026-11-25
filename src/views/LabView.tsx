import { useMemo, useState } from 'react';
import { KeyRound, RefreshCw, RotateCcw } from 'lucide-react';
import type { LabParameters, ThemeMode } from '../types/simulation';
import { solveMMcK } from '../engines/queueing';
import { analyzeAbsorbingMarkov, buildHospitalVlanMatrix } from '../engines/markov';
import { computeEntropyMetrics, generateSecureClinicalToken } from '../engines/entropy';
import { solveSecurityGame } from '../engines/gameTheory';
import { generateInfusionTelemetryTrace } from '../engines/anomaly';
import { evaluateHospitalInfrastructure } from '../engines/reliability';
import { useFairWorker } from '../hooks/useFairWorker';
import { ErTriageCanvas } from '../components/ErTriageCanvas';
import { MarkovGraphCanvas } from '../components/MarkovGraphCanvas';
import { FairHistogramCanvas } from '../components/FairHistogramCanvas';
import { InfusionZScoreCanvas } from '../components/InfusionZScoreCanvas';

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
        <span className="text-slate-700 dark:text-slate-300">{label}</span>
        <span className="font-mono font-semibold tabular-nums text-sky-700 dark:text-cyan-400">
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
        className="h-1.5 w-full cursor-pointer appearance-none bg-slate-200 accent-sky-600 dark:bg-slate-800 dark:accent-cyan-400"
      />
    </label>
  );
}

export function LabView({ theme, params, onUpdate, onReset }: LabViewProps) {
  const [sampleToken, setSampleToken] = useState<string>(() =>
    generateSecureClinicalToken(params.tokenLength, params.alphabetSize)
  );

  const queue = useMemo(
    () => solveMMcK({ lambda: params.lambda, mu: params.mu, c: params.c, K: params.K }),
    [params.lambda, params.mu, params.c, params.K]
  );

  const markov = useMemo(() => {
    const P = buildHospitalVlanMatrix(params.firewallContainment, params.lateralRisk);
    return analyzeAbsorbingMarkov(P, 3);
  }, [params.firewallContainment, params.lateralRisk]);

  const fairInput = useMemo(
    () => ({
      tefMin: 0.4,
      tefLikely: 1.4,
      tefMax: 3.8,
      lossLogMu: 13.9,
      lossLogSigma: 0.42,
      secondaryLossMultiplier: 0.65,
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
    () => generateInfusionTelemetryTrace(120, params.zThreshold, 7711),
    [params.zThreshold]
  );

  const reliability = useMemo(
    () =>
      evaluateHospitalInfrastructure({
        wanFailureRate: 0.0012,
        ehrFailureRate: 0.0004,
        gatewayFailureRate: 0.0015,
        missionHours: 168,
        mtbfHours: params.mtbfHours,
        mttrHours: params.mttrHours,
        redundantGateways: params.redundantGateways,
      }),
    [params.mtbfHours, params.mttrHours, params.redundantGateways]
  );

  const regenerateToken = (len = params.tokenLength, alpha = params.alphabetSize) => {
    setSampleToken(generateSecureClinicalToken(len, alpha));
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Telemetry Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          {
            label: 'ER Utilization (ρ)',
            val: queue.rho.toFixed(2),
            sub: queue.rho >= 0.95 ? 'SATURATED' : queue.rho >= 0.75 ? 'ELEVATED' : 'STABLE',
            tone:
              queue.rho >= 0.95
                ? 'text-rose-600 dark:text-rose-400'
                : queue.rho >= 0.75
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Diversion Drop (P_K)',
            val: `${(queue.pDrop * 100).toFixed(2)}%`,
            sub: `λ_eff = ${queue.lambdaEff.toFixed(1)}/hr`,
            tone: 'text-slate-900 dark:text-slate-100',
          },
          {
            label: 'VLAN Breach Prob',
            val: `${((markov.absorptionProbabilities[0]?.[1] ?? 0) * 100).toFixed(1)}%`,
            sub: `t₀ = ${(markov.meanStepsToAbsorption[0] ?? 0).toFixed(1)} hops`,
            tone: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'FAIR Mitigated ALE',
            val: formatPhp(fairResult.aleMitigatedMean),
            sub: `ROSI ${(fairResult.rosi * 100).toFixed(0)}%`,
            tone: 'text-sky-700 dark:text-cyan-400',
          },
          {
            label: 'Token Entropy H(X)',
            val: `${entropy.entropyBits.toFixed(1)} bits`,
            sub: entropy.classification,
            tone:
              entropy.classification === 'STRONG'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400',
          },
          {
            label: '7-Day Survival R(t)',
            val: `${(reliability.hybridSystemReliability * 100).toFixed(2)}%`,
            sub: `A = ${(reliability.inherentAvailability * 100).toFixed(2)}%`,
            tone: 'text-emerald-600 dark:text-emerald-400',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {kpi.label}
            </div>
            <div className={`mt-1 font-mono text-lg font-semibold tabular-nums ${kpi.tone}`}>
              {kpi.val}
            </div>
            <div className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ROW 1: Queueing & Surge Arrivals (Modules 1, 3, 6) */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                Modules 1, 3 & 6 · ER Triage Queue (M/M/c/K)
              </h3>
              <p className="font-mono text-[11px] text-slate-500">
                Non-homogeneous surges & finite bed buffer
              </p>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 border border-slate-200 px-2 py-1 font-mono text-[11px] text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          <div className="mt-4 space-y-3.5">
            <SliderRow
              label="Baseline ER Arrival Rate (λ)"
              valueDisplay={`${params.lambda.toFixed(1)} pts/hr`}
              min={1}
              max={50}
              step={0.5}
              value={params.lambda}
              onChange={(v) => onUpdate('lambda', v)}
            />
            <SliderRow
              label="Triage Physician Service Rate (μ)"
              valueDisplay={`${params.mu.toFixed(1)} pts/hr`}
              min={1}
              max={15}
              step={0.5}
              value={params.mu}
              onChange={(v) => onUpdate('mu', v)}
            />
            <SliderRow
              label="Active ER Triage Bays (c)"
              valueDisplay={`${params.c} bays`}
              min={1}
              max={12}
              step={1}
              value={params.c}
              onChange={(v) => onUpdate('c', v)}
            />
            <SliderRow
              label="Total Holding Capacity (K)"
              valueDisplay={`${params.K} slots`}
              min={params.c}
              max={40}
              step={1}
              value={params.K}
              onChange={(v) => onUpdate('K', v)}
            />
            <SliderRow
              label="Code Blue Surge Amplitude (A)"
              valueDisplay={`+${params.surgeAmplitude.toFixed(0)} pts/hr`}
              min={0}
              max={30}
              step={1}
              value={params.surgeAmplitude}
              onChange={(v) => onUpdate('surgeAmplitude', v)}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 font-mono text-xs tabular-nums dark:border-slate-800">
            <div>
              <span className="text-slate-500">Mean in ER (L): </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {queue.L.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Mean Wait (W): </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {(queue.W * 60).toFixed(1)}m
              </span>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
          <ErTriageCanvas theme={theme} queue={queue} surgeAmplitude={params.surgeAmplitude} />
        </div>
      </div>

      {/* ROW 2: Absorbing Markov VLAN & FAIR Monte Carlo (Modules 4 & 5) */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                Module 5 · Absorbing Markov Chain (Hospital VLAN)
              </h3>
              <p className="font-mono text-[11px] text-slate-500">
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

          <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2 dark:border-slate-800">
            <SliderRow
              label="EDR / Firewall Containment"
              valueDisplay={`${(params.firewallContainment * 100).toFixed(0)}%`}
              min={0.15}
              max={0.85}
              step={0.05}
              value={params.firewallContainment}
              onChange={(v) => onUpdate('firewallContainment', v)}
            />
            <SliderRow
              label="Lateral VLAN Pivot Risk"
              valueDisplay={`${(params.lateralRisk * 100).toFixed(0)}%`}
              min={0.05}
              max={0.55}
              step={0.05}
              value={params.lateralRisk}
              onChange={(v) => onUpdate('lateralRisk', v)}
            />
          </div>
        </div>

        <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                Module 4 · FAIR Monte Carlo Risk (Web Worker)
              </h3>
              <p className="font-mono text-[11px] text-slate-500">
                10,000 trials · Beta-PERT TEF × Lognormal LM (PHP)
              </p>
            </div>
            <span className="font-mono text-[11px] text-sky-700 dark:text-cyan-400">
              {fairBusy ? 'RUNNING WORKER...' : '10,000 TRIALS'}
            </span>
          </div>

          <div className="mt-3">
            <FairHistogramCanvas theme={theme} fair={fairResult} />
          </div>

          <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2 dark:border-slate-800">
            <SliderRow
              label="Control Mitigation Factor"
              valueDisplay={`${(params.fairMitigation * 100).toFixed(0)}%`}
              min={0}
              max={0.9}
              step={0.05}
              value={params.fairMitigation}
              onChange={(v) => onUpdate('fairMitigation', v)}
            />
            <SliderRow
              label="Annual Control Cost (C_control)"
              valueDisplay={formatPhp(params.controlCostPhp)}
              min={150_000}
              max={3_000_000}
              step={50_000}
              value={params.controlCostPhp}
              onChange={(v) => onUpdate('controlCostPhp', v)}
            />
          </div>
        </div>
      </div>

      {/* ROW 3: Streaming Z-Score Anomaly + Entropy, Game Theory, Reliability */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                Module 11 · Zero-Allocation IV Infusion Z-Score Detector
              </h3>
              <p className="font-mono text-[11px] text-slate-500">
                Circular Float64Array (W=30) · Z_t = |x_t - μ_t| / σ_t ≥ τ_crit
              </p>
            </div>
            <span className="font-mono text-xs font-semibold tabular-nums text-rose-600 dark:text-rose-400">
              {anomalyTicks.filter((t) => t.isAnomaly).length} Alerts
            </span>
          </div>

          <div className="mt-3">
            <InfusionZScoreCanvas
              theme={theme}
              ticks={anomalyTicks}
              threshold={params.zThreshold}
            />
          </div>

          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
            <SliderRow
              label="Clinical Lockout Z-Score Threshold (τ_crit)"
              valueDisplay={`±${params.zThreshold.toFixed(1)}σ`}
              min={1.5}
              max={5.0}
              step={0.1}
              value={params.zThreshold}
              onChange={(v) => onUpdate('zThreshold', v)}
            />
          </div>
        </div>

        {/* Modules 2 & 10: Entropy & Web Crypto Token Generator */}
        <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                Modules 2 & 10 · Entropy & Web Crypto Tokens
              </h3>
              <p className="font-mono text-[11px] text-slate-500">
                H(X) = log₂(|Σ|^L) · crypto.getRandomValues()
              </p>
            </div>
            <KeyRound className="h-4 w-4 text-sky-600 dark:text-cyan-400" />
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <span className="block text-xs text-slate-700 dark:text-slate-300">
                Credential Alphabet Size (|Σ|)
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
                        ? 'border-sky-600 bg-sky-50 text-sky-700 dark:border-cyan-400 dark:bg-cyan-950/40 dark:text-cyan-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    |Σ|={size}
                  </button>
                ))}
              </div>
            </div>

            <SliderRow
              label="Credential / Session Token Length (L)"
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

            <div className="grid grid-cols-2 gap-2 border border-slate-200 bg-slate-50 p-3 font-mono text-xs tabular-nums dark:border-slate-800 dark:bg-slate-950/50">
              <div>
                <div className="text-[10px] text-slate-500">SHANNON ENTROPY</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {entropy.entropyBits.toFixed(2)} bits
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">T_CRACK (@ 10⁷/s)</div>
                <div className="font-semibold text-sky-700 dark:text-cyan-400">
                  {entropy.humanReadableCrackTime}
                </div>
              </div>
            </div>

            <div className="border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-slate-500">
                  CSPRNG Sample Token
                </span>
                <button
                  type="button"
                  onClick={() => regenerateToken()}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-sky-700 hover:underline dark:text-cyan-400"
                >
                  <RefreshCw className="h-3 w-3" />
                  Roll
                </button>
              </div>
              <div className="mt-1 truncate font-mono text-xs text-slate-900 dark:text-slate-100">
                {sampleToken}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4: Module 7 Game Theory & Module 12 Reliability */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">
          <div className="border-b border-slate-200 pb-2.5 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
              Module 7 · Game Theory (EHR Audit vs. Insider Snooping)
            </h3>
            <p className="font-mono text-[11px] text-slate-500">
              Mixed-Strategy Nash: p* = C_audit / (G + F) · q* = G / (G + F)
            </p>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <SliderRow
              label="Audit Cost (C)"
              valueDisplay={formatPhp(params.auditCostPhp)}
              min={10_000}
              max={200_000}
              step={5_000}
              value={params.auditCostPhp}
              onChange={(v) => onUpdate('auditCostPhp', v)}
            />
            <SliderRow
              label="Insider Gain (G)"
              valueDisplay={formatPhp(params.attackerGainPhp)}
              min={50_000}
              max={1_000_000}
              step={25_000}
              value={params.attackerGainPhp}
              onChange={(v) => onUpdate('attackerGainPhp', v)}
            />
            <SliderRow
              label="RA 10173 Fine (F)"
              valueDisplay={formatPhp(params.breachPenaltyPhp)}
              min={200_000}
              max={4_000_000}
              step={100_000}
              value={params.breachPenaltyPhp}
              onChange={(v) => onUpdate('breachPenaltyPhp', v)}
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 font-mono text-xs tabular-nums dark:border-slate-800">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60">
                  <th className="border border-slate-200 p-2 text-left dark:border-slate-800">
                    Defender \ Insider
                  </th>
                  <th className="border border-slate-200 p-2 text-center dark:border-slate-800">
                    Exfiltrate (q*={(game.qStar * 100).toFixed(1)}%)
                  </th>
                  <th className="border border-slate-200 p-2 text-center dark:border-slate-800">
                    Comply ({((1 - game.qStar) * 100).toFixed(1)}%)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 p-2 font-semibold dark:border-slate-800">
                    Audit (p*={(game.pStar * 100).toFixed(1)}%)
                  </td>
                  <td className="border border-slate-200 p-2 text-center dark:border-slate-800">
                    ({formatPhp(game.payoffMatrix.auditExfiltrate[0])},{' '}
                    {formatPhp(game.payoffMatrix.auditExfiltrate[1])})
                  </td>
                  <td className="border border-slate-200 p-2 text-center dark:border-slate-800">
                    ({formatPhp(game.payoffMatrix.auditComply[0])}, ₱0)
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2 font-semibold dark:border-slate-800">
                    Monitor ({((1 - game.pStar) * 100).toFixed(1)}%)
                  </td>
                  <td className="border border-slate-200 p-2 text-center dark:border-slate-800">
                    ({formatPhp(game.payoffMatrix.monitorExfiltrate[0])},{' '}
                    {formatPhp(game.payoffMatrix.monitorExfiltrate[1])})
                  </td>
                  <td className="border border-slate-200 p-2 text-center dark:border-slate-800">
                    (₱0, ₱0)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">
          <div className="border-b border-slate-200 pb-2.5 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
              Module 12 · System Reliability & Offline SQLite Failover
            </h3>
            <p className="font-mono text-[11px] text-slate-500">
              R_sys = Π R_i(t) · R_parallel = 1 - Π(1 - R_i) · A = MTBF / (MTBF + MTTR)
            </p>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <SliderRow
              label="Parallel Gateways"
              valueDisplay={`${params.redundantGateways}×`}
              min={1}
              max={4}
              step={1}
              value={params.redundantGateways}
              onChange={(v) => onUpdate('redundantGateways', v)}
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
            <div className="border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="text-[10px] text-slate-500">SERIES R(168h)</div>
              <div className="mt-1 text-base font-semibold text-amber-600 dark:text-amber-400">
                {(reliability.seriesReliability * 100).toFixed(2)}%
              </div>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="text-[10px] text-slate-500">FAILOVER R(168h)</div>
              <div className="mt-1 text-base font-semibold text-emerald-600 dark:text-emerald-400">
                {(reliability.hybridSystemReliability * 100).toFixed(2)}%
              </div>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="text-[10px] text-slate-500">ANNUAL DOWNTIME</div>
              <div className="mt-1 text-base font-semibold text-sky-700 dark:text-cyan-400">
                {reliability.expectedAnnualDowntimeHours.toFixed(1)} hrs/yr
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
