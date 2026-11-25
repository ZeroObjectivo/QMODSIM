import { BookOpen, Scale, Sigma } from 'lucide-react';

interface FormulaCard {
  readonly module: string;
  readonly title: string;
  readonly equations: readonly string[];
  readonly derivation: string;
  readonly domainBinding: string;
}

const FORMULA_CATALOG: readonly FormulaCard[] = [
  {
    module: 'Modules 1 & 3',
    title: 'Stochastic Processes & Non-Homogeneous ER Arrival Rates',
    equations: [
      'f(t) = λ · e^(-λt)   (Exponential inter-arrival density, t ≥ 0)',
      'P(N(t) = k) = ((λ · t)^k · e^(-λt)) / k!   (Poisson count probability)',
      'λ(t) = λ_base + Σ [A_i · exp(-(t - t_peak,i)² / (2σ_i²))]   (Gaussian surge profile)',
    ],
    derivation:
      'Inter-arrival times of a homogeneous Poisson process with rate λ follow an Exponential(λ) distribution with mean E[T] = 1/λ. Layering Gaussian surge kernels models predictable 08:00 AM shift handovers and acute Code Blue ambulance bursts.',
    domainBinding: 'ER ambulance arrivals, walk-in triage registration, and bot flood stress testing.',
  },
  {
    module: 'Modules 2 & 10',
    title: 'Information Entropy & Clinical Token Cryptanalysis',
    equations: [
      'H(X) = -Σ [P(x_i) · log₂(P(x_i))] = log₂(|Σ|^L) = L · log₂(|Σ|)',
      'S = |Σ|^L   (Uniform keyspace complexity)',
      'T_crack = S / (2 · R_rate)   (Expected brute-force compromise time)',
    ],
    derivation:
      'For uniformly sampled credentials generated via Web Crypto CSPRNG (crypto.getRandomValues), each symbol contributes log₂(|Σ|) bits of entropy. A 4-digit nurse PIN yields only 13.29 bits (10⁴ states), whereas a 16-char ASCII-94 token yields 104.9 bits.',
    domainBinding: 'Bedside EHR cart authentication, smart IV infusion pump pairing, and session tokens.',
  },
  {
    module: 'Module 4',
    title: 'FAIR Monte Carlo Risk Quantification & ROSI',
    equations: [
      'TEF ~ Beta-PERT(a_min, m_likely, b_max)',
      'LM ~ Lognormal(μ, σ)',
      'Loss_Total = Σ (Loss_Primary + Loss_Secondary)',
      'ROSI = [(ALE_base - ALE_mitigated) - C_control] / C_control',
    ],
    derivation:
      'Using 10,000 independent Monte Carlo trials offloaded to a Web Worker, Beta-PERT captures expert-bounded threat frequency while Lognormal captures heavy-tailed RA 10173 breach fines and clinical downtime. Convergence is verified across two independent seeds within ±1.5%.',
    domainBinding: 'RA 10173 breach penalty modeling, ransomware downtime, and DLP/SIEM budget justification.',
  },
  {
    module: 'Module 5',
    title: 'Absorbing Markov Chains & Hospital VLAN Dynamics',
    equations: [
      'P = [ Q  R ] / [ 0  I ]   (Canonical absorbing transition matrix, Σ P_ij = 1.0)',
      'N = (I - Q)⁻¹   (Fundamental matrix: expected visits to transient states)',
      'B = N · R   (Absorption probabilities into S₃ Quarantined vs. S₄ Compromised)',
      't = N · 1   (Mean hops from each transient node to absorption)',
    ],
    derivation:
      'Partitioning hospital network states into transient nodes (S₀ Triage Kiosk, S₁ EHR Staging, S₂ ICU VLAN) and absorbing endpoints (S₃ Quarantined, S₄ Compromised) allows closed-form calculation of breach likelihood via Gauss-Jordan inversion.',
    domainBinding: 'Zero-Trust VLAN micro-segmentation and automated EDR quarantine containment.',
  },
  {
    module: 'Module 6',
    title: 'Finite-Capacity Multi-Server Queueing (M/M/c/K)',
    equations: [
      'ρ = λ / (c · μ)   (Server traffic utilization)',
      'P_drop = P_K = P₀ · (cᶜ · ρᴷ) / c!   (Ambulance diversion / buffer rejection)',
      'λ_eff = λ · (1 - P_K)   (Effective admitted patient throughput)',
      'L = λ_eff · W   (Little’s Law conservation invariant: |L - λ_eff · W| < 10⁻⁵)',
    ],
    derivation:
      'State probabilities P_n are computed iteratively via P_n / P_{n-1} = λ / (min(n, c) · μ) and normalized so Σ P_n = 1. This formulation remains numerically exact even at critical saturation (ρ = 1.0).',
    domainBinding: 'ER triage physician bays (c), waiting room buffer capacity (K), and ambulance diversion.',
  },
  {
    module: 'Module 7',
    title: 'Game Theory in Clinical Network Defense',
    equations: [
      'p* = C_audit / (G + F)   (Defender optimal audit probability)',
      'q* = G / (G + F)   (Insider optimal exfiltration probability)',
    ],
    derivation:
      'In a 2×2 normal-form inspection game between the Hospital Data Protection Officer (Audit/Monitor) and a malicious insider (Exfiltrate/Comply), the mixed-strategy Nash equilibrium makes each player indifferent across pure strategies. Lowering C_audit via automated SIEM directly reduces equilibrium risk.',
    domainBinding: 'Balancing DPO audit overhead against insider EHR record snooping.',
  },
  {
    module: 'Module 11',
    title: 'Zero-Allocation Streaming Z-Score Anomaly Detection',
    equations: [
      'μ_t = (1 / W) · Σ x_{t-k}   (Sliding window mean, W = 30)',
      'σ_t² = (1 / W) · Σ (x_{t-k} - μ_t)²   (Sliding variance)',
      'Z_t = |x_t - μ_t| / σ_t ≥ τ_crit   (Anomaly lockout criterion)',
    ],
    derivation:
      'Implemented over a fixed-capacity circular Float64Array maintaining running sums in O(1) time per tick with zero heap allocations. Flagged spikes are excluded from rolling baseline updates to prevent adversarial baseline poisoning.',
    domainBinding: 'Real-time IV infusion pump dosage telemetry (mL/hr) tamper lockout.',
  },
  {
    module: 'Module 12',
    title: 'System Reliability & Redundant Availability Modeling',
    equations: [
      'R_i(t) = e^(-λ_fail,i · t)   (Exponential component survival)',
      'R_sys(t) = Π R_i(t)   (Series single-path reliability)',
      'R_parallel(t) = 1 - Π (1 - R_i(t))   (Parallel redundant failover)',
      'A = MTBF / (MTBF + MTTR)   (Inherent steady-state availability)',
    ],
    derivation:
      'Replacing a single WAN/gateway dependency with parallel redundant gateways and an offline SQLite sync queue converts a fragile series chain into a high-availability hybrid topology.',
    domainBinding: 'Hospital WAN brownout survival, redundant clinical gateways, and offline triage sync.',
  },
];

export function CodexView() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-sky-700 dark:text-cyan-400">
          <BookOpen className="h-4 w-4" />
          <span className="font-mono text-xs font-semibold uppercase">
            CODEX · Formal Mathematical & Statutory Reference
          </span>
        </div>
        <h2 className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-slate-100">
          AEGIS-ER Governing Equations, Parameter Units & Philippine Legal Crosswalk
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          All formulas below are rendered in clean Unicode mathematical typography and map 1-to-1 to
          the verified pure TypeScript engines under <code className="font-mono">src/engines/</code>.
        </p>
      </div>

      {/* Governing Equations Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {FORMULA_CATALOG.map((card) => (
          <article
            key={card.module}
            className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase text-sky-700 dark:text-cyan-400">
                {card.module}
              </span>
              <Sigma className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {card.title}
            </h3>

            <div className="mt-3 space-y-1.5 border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100">
              {card.equations.map((eq) => (
                <div key={eq} className="leading-relaxed">
                  {eq}
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {card.derivation}
            </p>
            <div className="mt-2.5 border-t border-slate-100 pt-2 font-mono text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">ER Binding:</span>{' '}
              {card.domainBinding}
            </div>
          </article>
        ))}
      </div>

      {/* Statutory & Regulatory Compliance Crosswalk */}
      <div className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Scale className="h-4 w-4" />
          <h3 className="font-mono text-xs font-semibold uppercase">
            Statutory & Clinical Compliance Crosswalk (Philippines)
          </h3>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 font-mono text-[11px] uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2.5 pr-4">Statute / Circular</th>
                <th className="py-2.5 pr-4">Mandate for Hospital ER Telemetry</th>
                <th className="py-2.5 pr-4">QMODSIM Engine Verification</th>
                <th className="py-2.5">Target Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              <tr>
                <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                  RA 10173 · Sec. 20
                </td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                  Reasonable and appropriate organizational, physical, and technical safeguards for Sensitive Personal Information (medical records).
                </td>
                <td className="py-3 pr-4 font-mono text-sky-700 dark:text-cyan-400">
                  entropy.ts · markov.ts
                </td>
                <td className="py-3 text-slate-700 dark:text-slate-300">
                  ≥ 96-bit Web Crypto tokens + VLAN micro-segmentation
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                  RA 10173 · Sec. 25–33
                </td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                  Criminal & civil penalties (₱500K–₱5M + imprisonment) for unauthorized access, negligent disposal, or malicious disclosure of patient records.
                </td>
                <td className="py-3 pr-4 font-mono text-sky-700 dark:text-cyan-400">
                  fairMonteCarlo.ts · gameTheory.ts
                </td>
                <td className="py-3 text-slate-700 dark:text-slate-300">
                  10,000-trial FAIR ALE & Nash-optimal SIEM audits
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                  NPC Circular 16-03
                </td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                  Mandatory 72-hour personal data breach notification and formal quantitative risk impact assessment.
                </td>
                <td className="py-3 pr-4 font-mono text-sky-700 dark:text-cyan-400">
                  anomaly.ts · fairMonteCarlo.ts
                </td>
                <td className="py-3 text-slate-700 dark:text-slate-300">
                  Real-time O(1) Z-score alerting + P95 VaR reporting
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                  DOH AO 2016-0042
                </td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                  Hospital Emergency Department triage wait thresholds, surge readiness, and continuity of care during infrastructure outages.
                </td>
                <td className="py-3 pr-4 font-mono text-sky-700 dark:text-cyan-400">
                  queueing.ts · reliability.ts
                </td>
                <td className="py-3 text-slate-700 dark:text-slate-300">
                  M/M/c/K drop rate P_K &lt; 2% + offline SQLite failover
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
