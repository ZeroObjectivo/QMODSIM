# MATHEMATICAL_VERIFICATION.md — Quantitative Verification & Validation Report

**Project:** Optimizing Multi-Branch Retail: An Integrated Ordering and Inventory System for Old Yorker's (QMODSIM Web Artifact)  
**Institution:** University of Makati — College of Computing and Information Sciences  
**Live App V&V Drawer:** `https://old-yorkers-qmodsim.vercel.app/` (top-right **`V&V 6/6`** button)  
**Test Runner:** Vitest `5.1.2` (`npm test` → `src/engines/__tests__/engines.test.ts`)  
**Overall Result:** **PASS — 6/6 Live Invariants & 12/12 Automated Unit Tests Passing**

---

## 1. Live In-App Verification & Validation Invariants (`src/engines/validation.ts`)

Every check executes directly against the pure TypeScript math engines under `src/engines/` using active **LAB** parameters and can be re-run live by defense panelists inside the **Verification & Validation Drawer**:

| # | Invariant Target | Theoretical Standard | Engine Module | Status |
| :-: | :--- | :--- | :--- | :---: |
| 1 | **Poisson Arrival Invariant** | Simulated mean inter-arrival matches `1/λ` within `±2.0%` (`15,000` samples) | `src/engines/arrivals.ts` | **PASS** |
| 2 | **Little's Law Conservation** | `\|L - (λ_eff · W)\| < 10⁻⁵` across finite `M/M/c/K` order buffer states (including `ρ = 1.0`) | `src/engines/queueing.ts` | **PASS** |
| 3 | **Markov Row-Stochasticity** | `Σ P_ij = 1.0` within `10⁻⁵` for all 5 order lifecycle states `i in S` | `src/engines/markov.ts` | **PASS** |
| 4 | **FAIR Monte Carlo Convergence** | Annual Loss Exposure (ALE) converges within `±1.5%` across two independent `10,000`-trial seeds | `src/engines/fairMonteCarlo.ts` | **PASS** |
| 5 | **BOM Shrinkage Z-Score Spike Recall** | Zero-allocation circular `Float64Array(30)` detects `3/3` injected bun/beef deduction spikes | `src/engines/anomaly.ts` | **PASS** |
| 6 | **Branch Failover Reliability Dominance** | `0 ≤ R_series(t) ≤ R_redundant(t) ≤ 1` over `168h` mission window | `src/engines/reliability.ts` | **PASS** |

---

## 2. Automated Vitest Unit Test Coverage (`src/engines/__tests__/engines.test.ts`)

Executed via `npm test` (`vitest run` v5.1.2 — **12/12 passed**):

| QMODSIM Module | Pure Engine File | Verified Mathematical Properties |
| :--- | :--- | :--- |
| **Modules 1 & 3:** Stochastic Processes & Arrivals | `src/engines/arrivals.ts` | Normalized Poisson PMF (`Σ P(N=k) = 1.0`), exponential PDF `f(0) = λ`, empirical inter-arrival error `< 2%`, Gaussian dinner surge `λ(t)` peak |
| **Modules 2 & 10:** Entropy & Cryptanalysis | `src/engines/entropy.ts` | Exact Shannon entropy `H(X) = log₂(\|Σ\|^L)` (4-digit PIN = `13.29 bits` CRITICAL vs. 18-char alphanumeric `> 100 bits` STRONG), unbiased Web Crypto CSPRNG output length & charset |
| **Module 4:** Monte Carlo & FAIR Risk | `src/engines/fairMonteCarlo.ts` | Dual-seed `10,000`-trial convergence `< 1.5%`, tail ordering `P95 > Median`, exact `ROSI = [(ALE_base - ALE_mitigated) - C_control] / C_control` |
| **Module 5:** Absorbing Markov Chains | `src/engines/markov.ts` | Exact Gauss-Jordan `N = (I - Q)⁻¹`, row-stochasticity `< 10⁻¹⁰`, absorption matrix `B = N · R` rows sum to `1.000000` |
| **Module 6:** Queueing Theory (`M/M/c/K`) | `src/engines/queueing.ts` | Exact iterative state weights stable at `ρ = 1.0`, `Σ P_n = 1.0`, Little's Law residual `< 10⁻¹⁰` |
| **Module 7:** Game Theory Defense | `src/engines/gameTheory.ts` | Exact Mixed-Strategy Nash Equilibrium `p* = C_audit / (G + F)` and `q* = G / (G + F)` |
| **Module 11:** Streaming Z-Score Anomaly | `src/engines/anomaly.ts` | `O(1)` zero-allocation circular buffer (`W = 30`), baseline poisoning protection, `3/3` injected shrinkage spikes flagged |
| **Module 12:** Reliability & Availability | `src/engines/reliability.ts` | `R(0) = 1`, exact series `Π R_i` & parallel `1 - Π(1 - R_i)`, inherent availability `MTBF / (MTBF + MTTR)`, hybrid failover dominance |

---

## 3. Reproducing Verification Locally

```bash
npm test           # Runs all 12 Vitest mathematical verification tests
npm run typecheck  # Verifies strict TypeScript domain & unit contracts (tsc --noEmit)
```
