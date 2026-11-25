import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Flame, Scale, ShieldAlert } from 'lucide-react';
import type { ThemeMode } from '../types/simulation';
import { solveMMcK } from '../engines/queueing';
import { evaluateBranchInfrastructure } from '../engines/reliability';
import { analyzeAbsorbingMarkov, buildOrderLifecycleMatrix } from '../engines/markov';
import { computeEntropyMetrics } from '../engines/entropy';
import { generateIngredientDeductionTrace } from '../engines/anomaly';
import { runFairMonteCarlo } from '../engines/fairMonteCarlo';
import { solveSecurityGame } from '../engines/gameTheory';
import { BranchKitchenCanvas } from '../components/BranchKitchenCanvas';
import { MarkovGraphCanvas } from '../components/MarkovGraphCanvas';
import { FairHistogramCanvas } from '../components/FairHistogramCanvas';
import { BomShrinkageCanvas } from '../components/BomShrinkageCanvas';

interface ScenariosViewProps {
  readonly theme: ThemeMode;
}

type ScenarioId = 'dinner-rush' | 'gcash-bom' | 'shrinkage-fair';

function formatPhp(n: number): string {
  return `₱${Math.round(n).toLocaleString('en-PH')}`;
}

export function ScenariosView({ theme }: ScenariosViewProps) {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('dinner-rush');

  const [fork1, setFork1] = useState<'baseline' | 'web-portal' | 'full-failover'>('baseline');
  const [fork2, setFork2] = useState<'baseline' | 'gcash-api' | 'rbac-bom-zscore'>('baseline');
  const [fork3, setFork3] = useState<'baseline' | 'bom-audit' | 'nash-rbac-dlp'>('baseline');

  // --- SCENARIO 1: Guadalupe Nuevo Dinner Rush & Messenger Bottleneck ---
  const s1Baseline = useMemo(
    () => ({
      queue: solveMMcK({ lambda: 34, mu: 5.5, c: 2, K: 10 }),
      rel: evaluateBranchInfrastructure({
        ispFailureRate: 0.0025,
        mysqlFailureRate: 0.0004,
        gcashApiFailureRate: 0.0014,
        missionHours: 168,
        mtbfHours: 320,
        mttrHours: 4.0,
        redundantLinks: 1,
      }),
      surgeAmp: 18,
    }),
    []
  );

  const s1Active = useMemo(() => {
    if (fork1 === 'web-portal') {
      return {
        queue: solveMMcK({ lambda: 34, mu: 10.5, c: 3, K: 18 }),
        rel: s1Baseline.rel,
        surgeAmp: 18,
      };
    }
    if (fork1 === 'full-failover') {
      return {
        queue: solveMMcK({ lambda: 34, mu: 12.0, c: 4, K: 24 }),
        rel: evaluateBranchInfrastructure({
          ispFailureRate: 0.0025,
          mysqlFailureRate: 0.0004,
          gcashApiFailureRate: 0.0014,
          missionHours: 168,
          mtbfHours: 1100,
          mttrHours: 0.75,
          redundantLinks: 3,
        }),
        surgeAmp: 18,
      };
    }
    return s1Baseline;
  }, [fork1, s1Baseline]);

  // --- SCENARIO 2: Fake GCash Screenshots, Weak Staff PIN & BOM Shrinkage ---
  const s2Baseline = useMemo(() => {
    const P = buildOrderLifecycleMatrix(0.32, 0.36);
    return {
      markov: analyzeAbsorbingMarkov(P, 3),
      entropy: computeEntropyMetrics({ alphabetSize: 10, length: 4, guessesPerSecond: 1e6 }),
      ticks: generateIngredientDeductionTrace(120, 4.8, 7711),
      threshold: 4.8,
    };
  }, []);

  const s2Active = useMemo(() => {
    if (fork2 === 'gcash-api') {
      const P = buildOrderLifecycleMatrix(0.76, 0.14);
      return {
        markov: analyzeAbsorbingMarkov(P, 3),
        entropy: computeEntropyMetrics({ alphabetSize: 62, length: 12, guessesPerSecond: 1e6 }),
        ticks: generateIngredientDeductionTrace(120, 3.6, 7711),
        threshold: 3.6,
      };
    }
    if (fork2 === 'rbac-bom-zscore') {
      const P = buildOrderLifecycleMatrix(0.88, 0.05);
      return {
        markov: analyzeAbsorbingMarkov(P, 3),
        entropy: computeEntropyMetrics({ alphabetSize: 94, length: 16, guessesPerSecond: 1e6 }),
        ticks: generateIngredientDeductionTrace(120, 2.8, 7711),
        threshold: 2.8,
      };
    }
    return s2Baseline;
  }, [fork2, s2Baseline]);

  // --- SCENARIO 3: Multi-Branch Shrinkage, Receipt Fraud & RA 10173 Exposure ---
  const s3Baseline = useMemo(() => {
    const fair = runFairMonteCarlo(
      {
        tefMin: 2.5,
        tefLikely: 6.5,
        tefMax: 14.0,
        lossLogMu: 11.6,
        lossLogSigma: 0.45,
        secondaryLossMultiplier: 0.65,
        mitigationFactor: 0.0,
        controlCostPhp: 120_000,
      },
      10000,
      104729
    );
    const game = solveSecurityGame({
      auditCost: 42_000,
      attackerGain: 120_000,
      breachPenalty: 180_000,
    });
    return { fair, game };
  }, []);

  const s3Active = useMemo(() => {
    if (fork3 === 'bom-audit') {
      const fair = runFairMonteCarlo(
        {
          tefMin: 1.2,
          tefLikely: 3.2,
          tefMax: 7.0,
          lossLogMu: 11.3,
          lossLogSigma: 0.4,
          secondaryLossMultiplier: 0.45,
          mitigationFactor: 0.58,
          controlCostPhp: 180_000,
        },
        10000,
        104729
      );
      const game = solveSecurityGame({
        auditCost: 20_000,
        attackerGain: 90_000,
        breachPenalty: 420_000,
      });
      return { fair, game };
    }
    if (fork3 === 'nash-rbac-dlp') {
      const fair = runFairMonteCarlo(
        {
          tefMin: 0.6,
          tefLikely: 1.8,
          tefMax: 4.0,
          lossLogMu: 11.0,
          lossLogSigma: 0.36,
          secondaryLossMultiplier: 0.35,
          mitigationFactor: 0.8,
          controlCostPhp: 240_000,
        },
        10000,
        104729
      );
      const game = solveSecurityGame({
        auditCost: 10_000,
        attackerGain: 75_000,
        breachPenalty: 750_000,
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
              id: 'dinner-rush',
              badge: 'CRISIS 01 · MODULES 1, 3, 6, 12',
              title: 'Guadalupe Nuevo Dinner Rush Saturation',
              summary: 'Messenger chat ordering + manual GCash checks saturate grill stations (ρ > 3.0).',
              icon: Flame,
            },
            {
              id: 'gcash-bom',
              badge: 'CRISIS 02 · MODULES 2, 5, 10, 11',
              title: 'Fake GCash Receipts & Bun/Beef Shrinkage',
              summary: 'Weak 4-digit staff PINs, doctored receipts & unrecorded BOM deductions.',
              icon: ShieldAlert,
            },
            {
              id: 'shrinkage-fair',
              badge: 'CRISIS 03 · MODULES 4, 7',
              title: 'Multi-Branch Shrinkage & RA 10173 Risk',
              summary: 'Unchecked end-of-day tallies across 5 branches drive heavy FAIR tail losses.',
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
                  ? 'border-orange-700 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/30'
                  : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-800 dark:bg-[#171513] dark:hover:bg-stone-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-orange-700 dark:text-amber-400">
                  {item.badge}
                </span>
                <Icon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
              </div>
              <h2 className="mt-1.5 text-sm font-semibold text-stone-900 dark:text-stone-100">
                {item.title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                {item.summary}
              </p>
            </button>
          );
        })}
      </div>

      {/* SCENARIO 1 */}
      {activeScenario === 'dinner-rush' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#171513]">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase">
                  Branch Brief · 07:00 PM Guadalupe Nuevo Peak
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-stone-900 dark:text-stone-100">
                Manual Messenger Ordering & Kitchen Queue Overflow
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                During the 07:00 PM dinner surge, orders spike to{' '}
                <span className="font-mono">λ = 34 orders/hr</span> while manual Messenger replies
                and screenshot checking limit fulfillment to <span className="font-mono">μ = 5.5/hr</span>{' '}
                across <span className="font-mono">c = 2</span> grill stations (<span className="font-mono">K = 10</span>).
              </p>

              <div className="mt-4 space-y-2">
                <p className="font-mono text-[11px] font-semibold uppercase text-stone-500 dark:text-stone-400">
                  Select Technical Mitigation Fork:
                </p>
                {(
                  [
                    {
                      id: 'baseline',
                      title: 'A. Legacy Messenger + Manual GCash (c=2, μ=5.5, K=10)',
                      desc: 'Staff manually check screenshots and tally hotdog buns at closing.',
                    },
                    {
                      id: 'web-portal',
                      title: 'B. Old Yorker’s Web Portal + GCash API (c=3, μ=10.5, K=18)',
                      desc: 'Direct D2C branch ordering + instant GCash API frees staff for grilling.',
                    },
                    {
                      id: 'full-failover',
                      title: 'C. Portal + 4th Peak Grill + 3× Redundant ISP/COD Failover',
                      desc: 'Scales to c=4, μ=12.0/hr, K=24 with multi-link failover across branches.',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFork1(opt.id)}
                    className={`w-full border p-3 text-left transition-colors ${
                      fork1 === opt.id
                        ? 'border-orange-700 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/30'
                        : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 dark:border-stone-800 dark:bg-[#0E0D0C]/60 dark:hover:bg-stone-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100">
                        {opt.title}
                      </span>
                      {fork1 === opt.id && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-700 dark:text-amber-400" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513]">
              <h4 className="font-mono text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">
                Before vs. After Branch Telemetry
              </h4>
              <table className="mt-3 w-full font-mono text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-[11px] text-stone-500 dark:border-stone-800 dark:text-stone-400">
                    <th className="pb-2">Metric</th>
                    <th className="pb-2 text-right">Baseline</th>
                    <th className="pb-2 text-right">Active Fork</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                  <tr>
                    <td className="py-2 text-stone-700 dark:text-stone-300">Kitchen Utilization (ρ)</td>
                    <td className="py-2 text-right text-rose-700 dark:text-rose-400">
                      {s1Baseline.queue.rho.toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-semibold text-stone-900 dark:text-stone-100">
                      {s1Active.queue.rho.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-stone-700 dark:text-stone-300">Overlooked / Dropped (P_K)</td>
                    <td className="py-2 text-right text-rose-700 dark:text-rose-400">
                      {(s1Baseline.queue.pDrop * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {(s1Active.queue.pDrop * 100).toFixed(2)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-stone-700 dark:text-stone-300">Mean Order Turnaround (W)</td>
                    <td className="py-2 text-right">{(s1Baseline.queue.W * 60).toFixed(1)} min</td>
                    <td className="py-2 text-right font-semibold">
                      {(s1Active.queue.W * 60).toFixed(1)} min
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-stone-700 dark:text-stone-300">7-Day POS Survival R(168h)</td>
                    <td className="py-2 text-right">
                      {(s1Baseline.rel.seriesReliability * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 text-right font-semibold text-orange-700 dark:text-amber-400">
                      {(s1Active.rel.hybridSystemReliability * 100).toFixed(2)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513] lg:col-span-7">
            <BranchKitchenCanvas
              theme={theme}
              queue={s1Active.queue}
              surgeAmplitude={s1Active.surgeAmp}
              branchName="Guadalupe Nuevo (Flagship)"
            />
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-stone-200 pt-4 dark:border-stone-800">
              <div className="border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-[#0E0D0C]">
                <div className="font-mono text-[10px] uppercase text-stone-500">Served Rate λ_eff</div>
                <div className="mt-1 font-mono text-base font-semibold tabular-nums text-stone-900 dark:text-stone-100">
                  {s1Active.queue.lambdaEff.toFixed(1)}/hr
                </div>
              </div>
              <div className="border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-[#0E0D0C]">
                <div className="font-mono text-[10px] uppercase text-stone-500">Inherent Availability</div>
                <div className="mt-1 font-mono text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {(s1Active.rel.inherentAvailability * 100).toFixed(3)}%
                </div>
              </div>
              <div className="border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-[#0E0D0C]">
                <div className="font-mono text-[10px] uppercase text-stone-500">Little's Law Diff</div>
                <div className="mt-1 font-mono text-base font-semibold tabular-nums text-orange-700 dark:text-amber-400">
                  {s1Active.queue.littlesLawDiff.toExponential(1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENARIO 2 */}
      {activeScenario === 'gcash-bom' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#171513]">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <ShieldAlert className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase">
                  Branch Brief · Bangkal & Taguig Cashless Audit
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-stone-900 dark:text-stone-100">
                Doctored GCash Screenshots, Weak PINs & BOM Shrinkage
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                Manual receipt verification causes checkout abandonment and fraud losses at{' '}
                <span className="font-mono">S₁</span>, while 4-digit branch PINs (<span className="font-mono">13.29 bits</span>) and unmonitored hotdog bun/beef deductions hide shrinkage spikes.
              </p>

              <div className="mt-4 space-y-2">
                <p className="font-mono text-[11px] font-semibold uppercase text-stone-500 dark:text-stone-400">
                  Select Technical Mitigation Fork:
                </p>
                {(
                  [
                    {
                      id: 'baseline',
                      title: 'A. Manual GCash Screenshots + 4-Digit Staff PIN (τ=4.8σ)',
                      desc: 'Slow verification, high fraud/abandonment, undetected BOM shrinkage.',
                    },
                    {
                      id: 'gcash-api',
                      title: 'B. Automated GCash API + 12-Char RBAC Session Token',
                      desc: 'Instant webhook verification raises fulfillment rate and token entropy to 71.4 bits.',
                    },
                    {
                      id: 'rbac-bom-zscore',
                      title: 'C. GCash Webhook HMAC + 16-Char CSPRNG + BOM Z-Score (τ=2.8σ)',
                      desc: '104.9-bit entropy, 88% instant verification, 3/3 shrinkage spikes caught.',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFork2(opt.id)}
                    className={`w-full border p-3 text-left transition-colors ${
                      fork2 === opt.id
                        ? 'border-orange-700 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/30'
                        : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 dark:border-stone-800 dark:bg-[#0E0D0C]/60 dark:hover:bg-stone-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100">
                        {opt.title}
                      </span>
                      {fork2 === opt.id && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-700 dark:text-amber-400" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513]">
              <h4 className="font-mono text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">
                Before vs. After Order & Security Telemetry
              </h4>
              <table className="mt-3 w-full font-mono text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-[11px] text-stone-500 dark:border-stone-800 dark:text-stone-400">
                    <th className="pb-2">Metric</th>
                    <th className="pb-2 text-right">Baseline</th>
                    <th className="pb-2 text-right">Active Fork</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                  <tr>
                    <td className="py-2 text-stone-700 dark:text-stone-300">P(Fulfilled from S₀)</td>
                    <td className="py-2 text-right text-rose-700 dark:text-rose-400">
                      {((s2Baseline.markov.absorptionProbabilities[0]?.[0] ?? 0) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {((s2Active.markov.absorptionProbabilities[0]?.[0] ?? 0) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-stone-700 dark:text-stone-300">RBAC Token Entropy</td>
                    <td className="py-2 text-right">{s2Baseline.entropy.entropyBits.toFixed(1)} bits</td>
                    <td className="py-2 text-right font-semibold text-orange-700 dark:text-amber-400">
                      {s2Active.entropy.entropyBits.toFixed(1)} bits
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-stone-700 dark:text-stone-300">Expected T_crack</td>
                    <td className="py-2 text-right text-rose-700 dark:text-rose-400">
                      {s2Baseline.entropy.humanReadableCrackTime}
                    </td>
                    <td className="py-2 text-right font-semibold">
                      {s2Active.entropy.humanReadableCrackTime}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-stone-700 dark:text-stone-300">BOM Shrinkage Flagged</td>
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
            <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513]">
              <MarkovGraphCanvas theme={theme} markov={s2Active.markov} />
            </div>
            <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513]">
              <BomShrinkageCanvas
                theme={theme}
                ticks={s2Active.ticks}
                threshold={s2Active.threshold}
              />
            </div>
          </div>
        </div>
      )}

      {/* SCENARIO 3 */}
      {activeScenario === 'shrinkage-fair' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#171513]">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Scale className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase">
                  Enterprise Brief · 5-Branch Consolidated Risk (PHP)
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-stone-900 dark:text-stone-100">
                Inventory Shrinkage, Fake GCash Loss & RA 10173 Exposure
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                Across Guadalupe Nuevo, Bangkal, Taguig, Cainta, and Davao, manual end-of-day
                inventory counts cost <span className="font-mono">₱42,000/cycle</span> in labor and
                leave branches exposed to recurring stock shrinkage, receipt fraud, and customer PII
                leakage under RA 10173.
              </p>

              <div className="mt-4 space-y-2">
                <p className="font-mono text-[11px] font-semibold uppercase text-stone-500 dark:text-stone-400">
                  Select Governance & Automation Fork:
                </p>
                {(
                  [
                    {
                      id: 'baseline',
                      title: 'A. Manual End-of-Day Physical Counts Only (0% Mitigation)',
                      desc: 'High audit labor cost, unverified screenshots, full FAIR tail exposure.',
                    },
                    {
                      id: 'bom-audit',
                      title: 'B. Automated BOM Stock Deduction + GCash API (₱180K)',
                      desc: 'Cuts threat event frequency in half and reduces annual loss by 58%.',
                    },
                    {
                      id: 'nash-rbac-dlp',
                      title: 'C. Full RBAC + Real-Time Analytics + Automated Spot Audits',
                      desc: 'Drops audit cost to ₱10K and slashes equilibrium shrinkage rate q*.',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFork3(opt.id)}
                    className={`w-full border p-3 text-left transition-colors ${
                      fork3 === opt.id
                        ? 'border-orange-700 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/30'
                        : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 dark:border-stone-800 dark:bg-[#0E0D0C]/60 dark:hover:bg-stone-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100">
                        {opt.title}
                      </span>
                      {fork3 === opt.id && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-700 dark:text-amber-400" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513]">
              <h4 className="font-mono text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">
                Before vs. After Financial & Nash Telemetry
              </h4>
              <table className="mt-3 w-full font-mono text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-[11px] text-stone-500 dark:border-stone-800 dark:text-stone-400">
                    <th className="pb-2">Metric</th>
                    <th className="pb-2 text-right">Baseline</th>
                    <th className="pb-2 text-right">Active Fork</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                  <tr>
                    <td className="py-2 text-stone-700 dark:text-stone-300">Annual Loss Exposure (ALE)</td>
                    <td className="py-2 text-right text-rose-700 dark:text-rose-400">
                      {formatPhp(s3Baseline.fair.aleMean)}
                    </td>
                    <td className="py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPhp(s3Active.fair.aleMitigatedMean)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-stone-700 dark:text-stone-300">P95 Tail Risk (VaR)</td>
                    <td className="py-2 text-right">{formatPhp(s3Baseline.fair.aleP95)}</td>
                    <td className="py-2 text-right font-semibold">{formatPhp(s3Active.fair.aleP95)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-stone-700 dark:text-stone-300">Security ROI (ROSI)</td>
                    <td className="py-2 text-right">-100.0%</td>
                    <td className="py-2 text-right font-semibold text-orange-700 dark:text-amber-400">
                      {(s3Active.fair.rosi * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-stone-700 dark:text-stone-300">Shrinkage Equilibrium (q*)</td>
                    <td className="py-2 text-right text-rose-700 dark:text-rose-400">
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

          <div className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513] lg:col-span-7">
            <FairHistogramCanvas theme={theme} fair={s3Active.fair} />
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-200 pt-4 dark:border-stone-800">
              <div className="border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-[#0E0D0C]">
                <div className="font-mono text-[10px] uppercase text-stone-500">
                  Nash Audit Rate p* = C_audit / (G + F)
                </div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-orange-700 dark:text-amber-400">
                  {(s3Active.game.pStar * 100).toFixed(2)}%
                </div>
              </div>
              <div className="border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-[#0E0D0C]">
                <div className="font-mono text-[10px] uppercase text-stone-500">
                  Nash Fraud/Shrinkage Rate q* = G / (G + F)
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
