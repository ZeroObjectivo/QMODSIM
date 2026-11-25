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
    title: 'Stochastic Processes & Multi-Branch Meal Rush Arrivals',
    equations: [
      'f(t) = λ · e^(-λt)   (Exponential inter-arrival density, t ≥ 0)',
      'P(N(t) = k) = ((λ · t)^k · e^(-λt)) / k!   (Poisson order count probability)',
      'λ(t) = λ_base + Σ [A_i · exp(-(t - t_peak,i)² / (2σ_i²))]   (Lunch / Merienda / Dinner surges)',
    ],
    derivation:
      'Inter-arrival times between incoming web and walk-in hotdog orders follow Exponential(λ) with mean E[T] = 1/λ. Layering Gaussian surge kernels captures 12:00 PM lunch, 3:30 PM merienda, and 7:00 PM dinner rushes across Guadalupe Nuevo, Bangkal, Taguig, Cainta, and Davao.',
    domainBinding: 'Direct web portal orders replacing manual Facebook Messenger chat surges.',
  },
  {
    module: 'Modules 2 & 10',
    title: 'Information Entropy & RBAC / GCash Webhook Security',
    equations: [
      'H(X) = -Σ [P(x_i) · log₂(P(x_i))] = log₂(|Σ|^L) = L · log₂(|Σ|)',
      'S = |Σ|^L   (Uniform credential keyspace)',
      'T_crack = S / (2 · R_rate)   (Expected brute-force compromise time)',
    ],
    derivation:
      'For uniformly sampled RBAC session tokens and GCash webhook secrets generated via Web Crypto CSPRNG (crypto.getRandomValues), each character contributes log₂(|Σ|) bits. Upgrading from a 4-digit branch PIN (13.29 bits) to a 16-char ASCII-94 secret (104.9 bits) eliminates brute-force compromise.',
    domainBinding: 'Admin / Branch Manager / Staff RBAC authentication and GCash API webhook signing.',
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
      'Executed across 10,000 trials in a dedicated Web Worker, Beta-PERT captures annual frequency of fake GCash receipts, unrecorded shrinkage, and stockouts while Lognormal captures heavy-tailed financial losses and RA 10173 breach exposure in PHP.',
    domainBinding: 'Quantifying ROI of Old Yorker’s automated ordering, GCash API, and BOM inventory system.',
  },
  {
    module: 'Module 5',
    title: 'Absorbing Markov Chains & Order Ticket Lifecycle',
    equations: [
      'P = [ Q  R ] / [ 0  I ]   (Canonical transition matrix, Σ P_ij = 1.0)',
      'N = (I - Q)⁻¹   (Fundamental matrix: expected visits to transient order stages)',
      'B = N · R   (Absorption probabilities into S₃ Fulfilled vs. S₄ Drop/Fraud)',
      't = N · 1   (Expected stages from branch selection to order completion)',
    ],
    derivation:
      'Modeling S₀ (Cart/Branch Select), S₁ (GCash Verification), and S₂ (Kitchen Prep & BOM Deduction) as transient states leading to absorbing endpoints S₃ (Fulfilled) or S₄ (Abandoned/Fraud/Stockout) proves how instant GCash API verification boosts conversion.',
    domainBinding: 'End-to-end Old Yorker’s checkout, GCash webhook verification, and BOM stock deduction.',
  },
  {
    module: 'Module 6',
    title: 'Finite-Capacity Multi-Station Queueing (M/M/c/K)',
    equations: [
      'ρ = λ / (c · μ)   (Kitchen grill/prep utilization)',
      'P_drop = P_K = P₀ · (cᶜ · ρᴷ) / c!   (Overlooked / rejected order probability)',
      'λ_eff = λ · (1 - P_K)   (Effective served order throughput)',
      'L = λ_eff · W   (Little’s Law conservation invariant: |L - λ_eff · W| < 10⁻⁵)',
    ],
    derivation:
      'State probabilities P_n are solved iteratively via P_n / P_{n-1} = λ / (min(n, c) · μ) and normalized so Σ P_n = 1. Automating order intake and payment checks directly raises μ, lowering P_K and customer wait time W.',
    domainBinding: 'Kitchen grill stations (c), order ticket rail capacity (K), and peak-hour wait reduction.',
  },
  {
    module: 'Module 7',
    title: 'Game Theory in Multi-Branch Audit & Fraud Defense',
    equations: [
      'p* = C_audit / (G + F)   (Owner optimal branch audit probability)',
      'q* = G / (G + F)   (Equilibrium shrinkage / fake-receipt attempt rate)',
    ],
    derivation:
      'In a 2×2 inspection game between the Business Owner (Audit/Monitor) and opportunistic shrinkage or receipt fraud (Skim/Comply), automated daily analytics slashes C_audit and lowers equilibrium loss.',
    domainBinding: 'Centralized Admin Dashboard audits vs. manual end-of-day branch tally discrepancies.',
  },
  {
    module: 'Module 11',
    title: 'Zero-Allocation Streaming Z-Score BOM Anomaly Detection',
    equations: [
      'μ_t = (1 / W) · Σ x_{t-k}   (Sliding window mean, W = 30)',
      'σ_t² = (1 / W) · Σ (x_{t-k} - μ_t)²   (Sliding variance)',
      'Z_t = |x_t - μ_t| / σ_t ≥ τ_crit   (Shrinkage / void alert criterion)',
    ],
    derivation:
      'Implemented via a fixed-capacity circular Float64Array maintaining running sums in O(1) time per 15-minute branch stock log. Anomalous spikes are excluded from rolling baseline updates to prevent poisoning μ_t.',
    domainBinding: 'Automated Bill-of-Materials (hotdog buns, beef franks, packaging) shrinkage detection.',
  },
  {
    module: 'Module 12',
    title: 'Multi-Branch Reliability & Failover Availability',
    equations: [
      'R_i(t) = e^(-λ_fail,i · t)   (Exponential component survival)',
      'R_sys(t) = Π R_i(t)   (Single-path series reliability)',
      'R_parallel(t) = 1 - Π (1 - R_i(t))   (Parallel redundant ISP / COD fallback)',
      'A = MTBF / (MTBF + MTTR)   (Inherent steady-state availability)',
    ],
    derivation:
      'Combining parallel dual-ISP/4G links with Cash-on-Delivery (COD) payment fallback protects Old Yorker’s branches against single-path ISP or e-wallet gateway brownouts.',
    domainBinding: 'Continuous operation across Guadalupe Nuevo, Bangkal, Taguig, Cainta, and Davao.',
  },
];

export function CodexView() {
  return (
    <div className="space-y-6">
      <div className="border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#171513]">
        <div className="flex items-center gap-2 text-orange-700 dark:text-amber-400">
          <BookOpen className="h-4 w-4" />
          <span className="font-mono text-xs font-semibold uppercase">
            CODEX · Formal Mathematical & Statutory Reference
          </span>
        </div>
        <h2 className="mt-1.5 text-lg font-semibold text-stone-900 dark:text-stone-100">
          Old Yorker's Governing Equations, IPO Mapping & Philippine Regulatory Crosswalk
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
          All equations below use clean Unicode typography (zero raw LaTeX) and bind 1-to-1 to the
          verified pure TypeScript engines under <code className="font-mono">src/engines/</code>.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {FORMULA_CATALOG.map((card) => (
          <article
            key={card.module}
            className="border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#171513]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase text-orange-700 dark:text-amber-400">
                {card.module}
              </span>
              <Sigma className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <h3 className="mt-1 text-sm font-semibold text-stone-900 dark:text-stone-100">
              {card.title}
            </h3>

            <div className="mt-3 space-y-1.5 border border-stone-200 bg-stone-50 p-3 font-mono text-xs text-stone-900 dark:border-stone-800 dark:bg-[#0E0D0C] dark:text-stone-100">
              {card.equations.map((eq) => (
                <div key={eq} className="leading-relaxed">
                  {eq}
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              {card.derivation}
            </p>
            <div className="mt-2.5 border-t border-stone-100 pt-2 font-mono text-[11px] text-stone-500 dark:border-stone-800 dark:text-stone-400">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                Old Yorker's Binding:
              </span>{' '}
              {card.domainBinding}
            </div>
          </article>
        ))}
      </div>

      {/* Statutory & Regulatory Compliance Crosswalk */}
      <div className="border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#171513]">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Scale className="h-4 w-4" />
          <h3 className="font-mono text-xs font-semibold uppercase">
            Statutory & E-Commerce Compliance Crosswalk (Philippines)
          </h3>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 font-mono text-[11px] uppercase text-stone-500 dark:border-stone-800 dark:text-stone-400">
                <th className="py-2.5 pr-4">Statute / Standard</th>
                <th className="py-2.5 pr-4">Mandate for Old Yorker's Multi-Branch Platform</th>
                <th className="py-2.5 pr-4">QMODSIM Engine Verification</th>
                <th className="py-2.5">Target Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
              <tr>
                <td className="py-3 pr-4 font-mono font-semibold text-stone-900 dark:text-stone-100">
                  RA 10173 · Sec. 20
                </td>
                <td className="py-3 pr-4 text-stone-600 dark:text-stone-400">
                  Technical and organizational safeguards protecting customer delivery addresses, phone numbers, and order histories across branches.
                </td>
                <td className="py-3 pr-4 font-mono text-orange-700 dark:text-amber-400">
                  entropy.ts · fairMonteCarlo.ts
                </td>
                <td className="py-3 text-stone-700 dark:text-stone-300">
                  RBAC (Admin / Manager / Staff) + ≥ 96-bit Web Crypto tokens
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-semibold text-stone-900 dark:text-stone-100">
                  RA 8792 (E-Commerce Act)
                </td>
                <td className="py-3 pr-4 text-stone-600 dark:text-stone-400">
                  Legal recognition and integrity of electronic commercial transactions, digital receipts, and automated e-wallet API logs.
                </td>
                <td className="py-3 pr-4 font-mono text-orange-700 dark:text-amber-400">
                  markov.ts · entropy.ts
                </td>
                <td className="py-3 text-stone-700 dark:text-stone-300">
                  Automated GCash API webhook verification replacing screenshots
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-semibold text-stone-900 dark:text-stone-100">
                  RA 10175 (Cybercrime Act)
                </td>
                <td className="py-3 pr-4 text-stone-600 dark:text-stone-400">
                  Deterrence and auditability of computer-related fraud, doctored payment proofs, and unauthorized inventory record tampering.
                </td>
                <td className="py-3 pr-4 font-mono text-orange-700 dark:text-amber-400">
                  anomaly.ts · gameTheory.ts
                </td>
                <td className="py-3 text-stone-700 dark:text-stone-300">
                  O(1) BOM shrinkage Z-score alerts + Nash-optimal branch audits
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-semibold text-stone-900 dark:text-stone-100">
                  BIR / DTI Retail Standards
                </td>
                <td className="py-3 pr-4 text-stone-600 dark:text-stone-400">
                  Accurate multi-branch sales reporting, real-time menu availability, and continuous POS uptime across dispersed outlets.
                </td>
                <td className="py-3 pr-4 font-mono text-orange-700 dark:text-amber-400">
                  queueing.ts · reliability.ts
                </td>
                <td className="py-3 text-stone-700 dark:text-stone-300">
                  M/M/c/K drop rate P_K &lt; 2% + multi-link/COD failover
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
