import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, Scale } from 'lucide-react';
import type { ThemeMode } from '../types/simulation';
import { solveMMcK } from '../engines/queueing';
import { evaluateHospitalInfrastructure } from '../engines/reliability';
import { analyzeAbsorbingMarkov, buildHospitalVlanMatrix } from '../engines/markov';
import { computeEntropyMetrics } from '../engines/entropy';
import { generateInfusionTelemetryTrace } from '../engines/anomaly';
import { runFairMonteCarlo } from '../engines/fairMonteCarlo';
import { solveSecurityGame } from '../engines/gameTheory';
import { ErTriageCanvas } from '../components/ErTriageCanvas';
import { MarkovGraphCanvas } from '../components/MarkovGraphCanvas';
import { FairHistogramCanvas } from '../components/FairHistogramCanvas';
import { InfusionZScoreCanvas } from '../components/InfusionZScoreCanvas';

interface ScenariosViewProps {
  readonly theme: ThemeMode;
}

type ScenarioId = 'code-blue' | 'vlan-intrusion' | 'ra10173-insider';

function formatPhp(n: number): string {
  return `₱${Math.round(n).toLocaleString('en-PH')}`;
}

export function ScenariosView({ theme }: ScenariosViewProps) {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('code-blue');

  // Decision fork states — each choice genuinely alters engine inputs
  const [fork1, setFork1] = useState<'baseline' | 'surge-bays' | 'full-failover'>('baseline');
  const [fork2, setFork2] = useState<'baseline' | 'vlan-microseg' | 'zero-trust-zscore'>('baseline');
  const [fork3, setFork3] = useState<'baseline' | 'dlp-mfa' | 'nash-audit-dlp'>('baseline');

  // --- SCENARIO 1 ENGINES: Code Blue Ambulance Surge (M/M/c/K + Reliability) ---
  const s1Baseline = useMemo(
    () => ({
      queue: solveMMcK({ lambda: 26, mu: 4.0, c: 4, K: 12 }),
      rel: evaluateHospitalInfrastructure({
        wanFailureRate: 0.0022,
        ehrFailureRate: 0.0005,
        gatewayFailureRate: 0.002,
        missionHours: 168,
        mtbfHours: 360,
        mttrHours: 4.0,
        redundantGateways: 1,
      }),
      surgeAmp: 16,
    }),
    []
  );

  const s1Active = useMemo(() => {
    if (fork1 === 'surge-bays') {
      return {
        queue: solveMMcK({ lambda: 26, mu: 4.5, c: 6, K: 20 }),
        rel: s1Baseline.rel,
        surgeAmp: 16,
      };
    }
    if (fork1 === 'full-failover') {
      return {
        queue: solveMMcK({ lambda: 26, mu: 4.8, c: 7, K: 24 }),
        rel: evaluateHospitalInfrastructure({
          wanFailureRate: 0.0022,
          ehrFailureRate: 0.0005,
          gatewayFailureRate: 0.002,
          missionHours: 168,
          mtbfHours: 1200,
          mttrHours: 0.75,
          redundantGateways: 3,
        }),
        surgeAmp: 16,
      };
    }
    return s1Baseline;
  }, [fork1, s1Baseline]);

  // --- SCENARIO 2 ENGINES: Lateral VLAN Intrusion & Infusion Tampering ---
  const s2Baseline = useMemo(() => {
    const P = buildHospitalVlanMatrix(0.22, 0.48);
    return {
      markov: analyzeAbsorbingMarkov(P, 3),
      entropy: computeEntropyMetrics({ alphabetSize: 10, length: 4, guessesPerSecond: 1e6 }),
      ticks: generateInfusionTelemetryTrace(120, 4.8, 7711),
      threshold: 4.8,
    };
  }, []);

  const s2Active = useMemo(() => {
    if (fork2 === 'vlan-microseg') {
      const P = buildHospitalVlanMatrix(0.55, 0.22);
      return {
        markov: analyzeAbsorbingMarkov(P, 3),
        entropy: computeEntropyMetrics({ alphabetSize: 62, length: 12, guessesPerSecond: 1e6 }),
        ticks: generateInfusionTelemetryTrace(120, 3.6, 7711),
        threshold: 3.6,
      };
    }
    if (fork2 === 'zero-trust-zscore') {
      const P = buildHospitalVlanMatrix(0.78, 0.1);
      return {
        markov: analyzeAbsorbingMarkov(P, 3),
        entropy: computeEntropyMetrics({ alphabetSize: 94, length: 16, guessesPerSecond: 1e6 }),
        ticks: generateInfusionTelemetryTrace(120, 2.8, 7711),
        threshold: 2.8,
      };
    }
    return s2Baseline;
  }, [fork2, s2Baseline]);

  // --- SCENARIO 3 ENGINES: RA 10173 Breach & Insider Snooping (FAIR + Game Theory) ---
  const s3Baseline = useMemo(() => {
    const fair = runFairMonteCarlo(
      {
        tefMin: 0.8,
        tefLikely: 2.2,
        tefMax: 5.0,
        lossLogMu: 14.1,
        lossLogSigma: 0.45,
        secondaryLossMultiplier: 0.7,
        mitigationFactor: 0.0,
        controlCostPhp: 400_000,
      },
      10000,
      104729
    );
    const game = solveSecurityGame({
      auditCost: 85_000,
      attackerGain: 320_000,
      breachPenalty: 600_000,
    });
    return { fair, game };
  }, []);

  const s3Active = useMemo(() => {
    if (fork3 === 'dlp-mfa') {
      const fair = runFairMonteCarlo(
        {
          tefMin: 0.4,
          tefLikely: 1.1,
          tefMax: 2.6,
          lossLogMu: 13.8,
          lossLogSigma: 0.4,
          secondaryLossMultiplier: 0.55,
          mitigationFactor: 0.55,
          controlCostPhp: 750_000,
        },
        10000,
        104729
      );
      const game = solveSecurityGame({
        auditCost: 45_000,
        attackerGain: 260_000,
        breachPenalty: 1_200_000,
      });
      return { fair, game };
    }
    if (fork3 === 'nash-audit-dlp') {
      const fair = runFairMonteCarlo(
        {
          tefMin: 0.2,
          tefLikely: 0.65,
          tefMax: 1.6,
          lossLogMu: 13.5,
          lossLogSigma: 0.38,
          secondaryLossMultiplier: 0.45,
          mitigationFactor: 0.78,
          controlCostPhp: 920_000,
        },
        10000,
        104729
      );
      const game = solveSecurityGame({
        auditCost: 22_000,
        attackerGain: 220_000,
        breachPenalty: 2_500_000,
      });
      return { fair, game };
    }
    return s3Baseline;
  }, [fork3, s3Baseline]);

  return (
    <div className="space-y-6">
      {/* Scenario Selector Strip */}
      <div className="grid gap-3 md:grid-cols-3">
        {(
          [
            {
              id: 'code-blue',
              badge: 'CRISIS 01 · MODULES 1, 3, 6, 12',
              title: 'Code Blue Ambulance Surge',
              summary: 'ER triage bays saturate (ρ > 1.6) during multi-trauma arrival & WAN brownout.',
              icon: Activity,
            },
            {
              id: 'vlan-intrusion',
              badge: 'CRISIS 02 · MODULES 2, 5, 10, 11',
              title: 'Lateral VLAN & IV Infusion Attack',
              summary: '4-digit nurse PIN brute-forced; attacker pivots toward ICU infusion telemetry.',
              icon: ShieldAlert,
            },
            {
              id: 'ra10173-insider',
              badge: 'CRISIS 03 · MODULES 4, 7',
              title: 'RA 10173 Breach & Insider Snooping',
              summary: 'Unchecked EHR queries trigger NPC Circular 16-03 exposure & FAIR tail risk.',
              icon: Scale,
            },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const selected = activeScenario === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveScenario(item.id)}
              className={`border p-4 text-left transition-colors ${
                selected
                  ? 'border-sky-600 bg-sky-50/60 dark:border-cyan-400 dark:bg-cyan-950/30'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-sky-700 dark:text-cyan-400">
                  {item.badge}
                </span>
                <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <h2 className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {item.summary}
              </p>
            </button>
          );
        })}
      </div>

      {/* SCENARIO 1 */}
      {activeScenario === 'code-blue' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase">
                  Incident Brief · 08:00 AM Shift Handover
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                Multi-Trauma Surge & Single-Path WAN Bottleneck
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                An expressway pileup pushes ER arrivals to <span className="font-mono">λ = 26 patients/hr</span>{' '}
                against only <span className="font-mono">c = 4</span> triage bays (<span className="font-mono">μ = 4.0/hr</span>,{' '}
                <span className="font-mono">K = 12</span>). Ambulance diversion surges past 39% while a single WAN link threatens EHR availability.
              </p>

              <div className="mt-4 space-y-2">
                <p className="font-mono text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Select Technical Mitigation Fork:
                </p>
                {(
                  [
                    {
                      id: 'baseline',
                      title: 'A. Unmitigated Baseline (c=4, K=12, 1 Gateway)',
                      desc: 'Keep standard shift staffing and single-path hospital WAN.',
                    },
                    {
                      id: 'surge-bays',
                      title: 'B. Activate Surge Triage Protocol (c=6, K=20)',
                      desc: 'Open 2 reserve bays + fast-track triage (μ=4.5/hr) without WAN failover.',
                    },
                    {
                      id: 'full-failover',
                      title: 'C. Surge Bays + 3× Parallel Gateways & SQLite Sync',
                      desc: 'Scale to c=7, K=24, μ=4.8/hr + triple parallel gateways & offline SQLite cache.',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFork1(opt.id)}
                    className={`w-full border p-3 text-left transition-colors ${
                      fork1 === opt.id
                        ? 'border-sky-600 bg-sky-50/70 dark:border-cyan-400 dark:bg-cyan-950/30'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {opt.title}
                      </span>
                      {fork1 === opt.id && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600 dark:text-cyan-400" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Before vs After Telemetry Table */}
            <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-mono text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Before vs. After Engine Telemetry
              </h4>
              <table className="mt-3 w-full font-mono text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="pb-2">Metric</th>
                    <th className="pb-2 text-right">Baseline</th>
                    <th className="pb-2 text-right">Active Fork</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">Traffic Utilization (ρ)</td>
                    <td className="py-2 text-right text-rose-600 dark:text-rose-400">
                      {s1Baseline.queue.rho.toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {s1Active.queue.rho.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">Ambulance Drop (P_K)</td>
                    <td className="py-2 text-right text-rose-600 dark:text-rose-400">
                      {(s1Baseline.queue.pDrop * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {(s1Active.queue.pDrop * 100).toFixed(2)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">Mean Wait Time (W)</td>
                    <td className="py-2 text-right">{(s1Baseline.queue.W * 60).toFixed(1)} min</td>
                    <td className="py-2 text-right font-semibold">
                      {(s1Active.queue.W * 60).toFixed(1)} min
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">7-Day Survival R(168h)</td>
                    <td className="py-2 text-right">
                      {(s1Baseline.rel.seriesReliability * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 text-right font-semibold text-sky-600 dark:text-cyan-400">
                      {(s1Active.rel.hybridSystemReliability * 100).toFixed(2)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
            <ErTriageCanvas
              theme={theme}
              queue={s1Active.queue}
              surgeAmplitude={s1Active.surgeAmp}
            />
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="font-mono text-[10px] uppercase text-slate-500">Effective λ_eff</div>
                <div className="mt-1 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {s1Active.queue.lambdaEff.toFixed(2)}/hr
                </div>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="font-mono text-[10px] uppercase text-slate-500">Inherent Availability</div>
                <div className="mt-1 font-mono text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {(s1Active.rel.inherentAvailability * 100).toFixed(3)}%
                </div>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="font-mono text-[10px] uppercase text-slate-500">Little's Law Diff</div>
                <div className="mt-1 font-mono text-base font-semibold tabular-nums text-sky-600 dark:text-cyan-400">
                  {s1Active.queue.littlesLawDiff.toExponential(1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENARIO 2 */}
      {activeScenario === 'vlan-intrusion' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase">
                  Incident Brief · Bedside Kiosk Compromise
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                4-Digit Nurse PIN Enumeration → ICU Infusion Tampering
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                An attacker enumerates a legacy 4-digit PIN (<span className="font-mono">H(X) = 13.29 bits</span>) on Triage Kiosk{' '}
                <span className="font-mono">S₀</span> and pivots across EHR Staging (<span className="font-mono">S₁</span>) toward ICU Infusion VLAN (<span className="font-mono">S₂</span>), injecting unauthorized mL/hr dosage spikes.
              </p>

              <div className="mt-4 space-y-2">
                <p className="font-mono text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Select Technical Mitigation Fork:
                </p>
                {(
                  [
                    {
                      id: 'baseline',
                      title: 'A. Legacy 4-Digit PIN + Flat VLAN (τ_crit = 4.8σ)',
                      desc: 'Minimal containment; tampering spikes slip past loose threshold.',
                    },
                    {
                      id: 'vlan-microseg',
                      title: 'B. 12-Char Alphanumeric + VLAN Micro-Segmentation',
                      desc: 'Raises entropy to 71.4 bits and boosts quarantine probability.',
                    },
                    {
                      id: 'zero-trust-zscore',
                      title: 'C. 16-Char Web Crypto Token + Zero-Trust + τ=2.8σ Lockout',
                      desc: '104.9-bit entropy, 78% instant containment, 3/3 infusion spikes blocked.',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFork2(opt.id)}
                    className={`w-full border p-3 text-left transition-colors ${
                      fork2 === opt.id
                        ? 'border-sky-600 bg-sky-50/70 dark:border-cyan-400 dark:bg-cyan-950/30'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {opt.title}
                      </span>
                      {fork2 === opt.id && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600 dark:text-cyan-400" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-mono text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Before vs. After Defense Telemetry
              </h4>
              <table className="mt-3 w-full font-mono text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="pb-2">Metric</th>
                    <th className="pb-2 text-right">Baseline</th>
                    <th className="pb-2 text-right">Active Fork</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">P(Breach from S₀)</td>
                    <td className="py-2 text-right text-rose-600 dark:text-rose-400">
                      {((s2Baseline.markov.absorptionProbabilities[0]?.[1] ?? 0) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {((s2Active.markov.absorptionProbabilities[0]?.[1] ?? 0) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">Token Entropy H(X)</td>
                    <td className="py-2 text-right">{s2Baseline.entropy.entropyBits.toFixed(1)} bits</td>
                    <td className="py-2 text-right font-semibold text-sky-600 dark:text-cyan-400">
                      {s2Active.entropy.entropyBits.toFixed(1)} bits
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">Expected T_crack</td>
                    <td className="py-2 text-right text-rose-600 dark:text-rose-400">
                      {s2Baseline.entropy.humanReadableCrackTime}
                    </td>
                    <td className="py-2 text-right font-semibold">
                      {s2Active.entropy.humanReadableCrackTime}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">Tampering Spikes Flagged</td>
                    <td className="py-2 text-right">
                      {s2Baseline.ticks.filter((t) => t.isAnomaly).length} / 3
                    </td>
                    <td className="py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {s2Active.ticks.filter((t) => t.isAnomaly).length} / 3
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-7">
            <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <MarkovGraphCanvas theme={theme} markov={s2Active.markov} />
            </div>
            <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <InfusionZScoreCanvas
                theme={theme}
                ticks={s2Active.ticks}
                threshold={s2Active.threshold}
              />
            </div>
          </div>
        </div>
      )}

      {/* SCENARIO 3 */}
      {activeScenario === 'ra10173-insider' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Scale className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase">
                  Incident Brief · RA 10173 Statutory Exposure
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                Insider EHR Exfiltration & NPC Circular 16-03 Liability
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Manual audit costs (<span className="font-mono">₱85,000/cycle</span>) discourage frequent EHR log reviews, leaving insider snooping unchecked and exposing the hospital to multi-million peso RA 10173 penalties across 10,000 FAIR Monte Carlo trials.
              </p>

              <div className="mt-4 space-y-2">
                <p className="font-mono text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Select Governance & Control Fork:
                </p>
                {(
                  [
                    {
                      id: 'baseline',
                      title: 'A. Reactive Manual Audits Only (0% Mitigation)',
                      desc: 'High audit cost, weak deterrent penalty, full unmitigated FAIR tail.',
                    },
                    {
                      id: 'dlp-mfa',
                      title: 'B. Deploy EHR DLP + Role-Based MFA (₱750K Control)',
                      desc: 'Cuts TEF by half and reduces expected annual loss exposure by 55%.',
                    },
                    {
                      id: 'nash-audit-dlp',
                      title: 'C. Automated SIEM Audits + DLP + RA 10173 Sanctions',
                      desc: 'Lowers audit cost to ₱22K and raises sanction F to ₱2.5M, crushing q*.',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFork3(opt.id)}
                    className={`w-full border p-3 text-left transition-colors ${
                      fork3 === opt.id
                        ? 'border-sky-600 bg-sky-50/70 dark:border-cyan-400 dark:bg-cyan-950/30'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {opt.title}
                      </span>
                      {fork3 === opt.id && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600 dark:text-cyan-400" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-mono text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Before vs. After Risk & Nash Telemetry
              </h4>
              <table className="mt-3 w-full font-mono text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="pb-2">Metric</th>
                    <th className="pb-2 text-right">Baseline</th>
                    <th className="pb-2 text-right">Active Fork</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">Mean Annual Loss (ALE)</td>
                    <td className="py-2 text-right text-rose-600 dark:text-rose-400">
                      {formatPhp(s3Baseline.fair.aleMean)}
                    </td>
                    <td className="py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPhp(s3Active.fair.aleMitigatedMean)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">P95 Value-at-Risk</td>
                    <td className="py-2 text-right">{formatPhp(s3Baseline.fair.aleP95)}</td>
                    <td className="py-2 text-right font-semibold">{formatPhp(s3Active.fair.aleP95)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">Security ROI (ROSI)</td>
                    <td className="py-2 text-right">-100.0%</td>
                    <td className="py-2 text-right font-semibold text-sky-600 dark:text-cyan-400">
                      {(s3Active.fair.rosi * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700 dark:text-slate-300">Insider Attack Prob (q*)</td>
                    <td className="py-2 text-right text-rose-600 dark:text-rose-400">
                      {(s3Baseline.game.qStar * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {(s3Active.game.qStar * 100).toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
            <FairHistogramCanvas theme={theme} fair={s3Active.fair} />
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="font-mono text-[10px] uppercase text-slate-500">
                  Nash Audit Rate p* = C_audit / (G + F)
                </div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-sky-600 dark:text-cyan-400">
                  {(s3Active.game.pStar * 100).toFixed(2)}%
                </div>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="font-mono text-[10px] uppercase text-slate-500">
                  Nash Exfiltration Rate q* = G / (G + F)
                </div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {(s3Active.game.qStar * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
