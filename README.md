# Old Yorker's · Multi-Branch Ordering & Inventory QMODSIM

An interactive Quantitative Modeling and Simulation (QMODSIM) single-page web application validating the operational capacity, inventory accuracy, and cybersecurity resilience of **Optimizing Multi-Branch Retail: An Integrated Ordering and Inventory System for Old Yorker's** (University of Makati — College of Computing and Information Sciences).

- **GitHub Repository:** [https://github.com/ZeroObjectivo/QMODSIM](https://github.com/ZeroObjectivo/QMODSIM)
- **Old Yorker's Production Storefront:** [https://old-yorkers.vercel.app/](https://old-yorkers.vercel.app/)
- **QMODSIM Live Deployment (Vercel):** https://old-yorkers-qmodsim.vercel.app/
- **Capstone Proposal (Chapters 1–2 Summary):** [PROPOSAL.md](./PROPOSAL.md)
- **Technical Specification:** [SPEC.md](./SPEC.md)
- **Design System:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- **Agentic AI Workflow & OWASP Vetting Log:** [AI_USAGE.md](./AI_USAGE.md)

---

## Team Roster (University of Makati — CCIS)

| Member | Role |
| :--- | :--- |
| **Calm Kaisha Boregas** | Project Lead & Systems Architect |
| **Peter Paul Marfil** | Stochastic & Queueing Engine Verification / RRL |
| **Pepe Bayotlang** | Cybersecurity, Markov Order Lifecycle & Cryptanalysis |
| **Christian Salazar** | Frontend Telemetry Canvas & Dual-Theme UI / RRL |
| **Princess Mariel Pagal** | Statutory Compliance (RA 10173 / RA 8792) & Documentation |

---

## Core Interface Architecture

1. **SCENARIOS** — Three narrative-driven Old Yorker's operational & security crisis walkthroughs (*Guadalupe Nuevo Dinner Rush Saturation*, *Fake GCash Receipts & Bun/Beef Shrinkage*, *Multi-Branch Shrinkage & RA 10173 Risk*) with live decision forks that mutate parameters in `src/engines/` and recalculate before-vs-after telemetry graphs.
2. **LAB** — Multi-variable stochastic workbench featuring a **5-branch switcher** (Guadalupe Nuevo, Bangkal, Taguig, Cainta, Davao), strictly clamped domain sliders (`λ, μ, c, K, τ_crit`), four theme-reactive 60 FPS HTML5 Canvases, Web Worker 10,000-trial FAIR Monte Carlo simulation, and Web Crypto CSPRNG token generator.
3. **CODEX** — Formal mathematical derivations in clean Unicode typography (zero raw LaTeX) and Philippine statutory compliance crosswalk (**RA 10173**, **RA 8792**, **RA 10175**, **BIR/DTI**).
4. **In-App Verification & Validation Drawer** — Live mathematical invariant suite accessible from the top navigation bar confirming Poisson arrival convergence, Little's Law conservation, Markov row-stochasticity, FAIR Monte Carlo convergence, BOM Z-score spike recall, and failover reliability dominance.

---

## Proposal-to-Module Mapping

| QMODSIM Curriculum Module | Old Yorker's Domain Stressor / Threat | Pure Engine Module |
| :--- | :--- | :--- |
| **Modules 1 & 3:** Stochastic Processes & Arrival Rates | 12:00 PM Lunch, 3:30 PM Merienda & 7:00 PM Dinner order surges across 5 branches | `src/engines/arrivals.ts` |
| **Modules 2 & 10:** Security Modeling & Information Entropy | 4-digit branch PIN vs. RBAC session & GCash webhook HMAC tokens | `src/engines/entropy.ts` |
| **Module 4:** Monte Carlo & FAIR Risk Framework | Fake GCash receipts, raw ingredient shrinkage, stockouts & RA 10173 fines | `src/engines/fairMonteCarlo.ts` + `src/workers/fairWorker.ts` |
| **Module 5:** Markov Chains & State Dynamics | Order ticket lifecycle (`Cart → GCash Verify → Kitchen Prep → Fulfilled / Drop`) | `src/engines/markov.ts` |
| **Module 6:** Queueing Theory (`M/M/c/K`) | Kitchen grill/prep stations (`c`) & active order ticket rail (`K`) | `src/engines/queueing.ts` |
| **Module 7:** Game Theory in Retail Defense | Owner/Branch Manager inventory audits vs. shrinkage & receipt fraud | `src/engines/gameTheory.ts` |
| **Module 11:** ML Anomaly Detection in Logs | Zero-allocation streaming Z-score detector on BOM hotdog bun/beef deductions | `src/engines/anomaly.ts` |
| **Module 12:** System Reliability & Availability | Multi-branch POS, MySQL DB & GCash API failover during ISP brownouts | `src/engines/reliability.ts` |

---

## Local Development & Verification

```bash
npm install
npm run dev        # Start local Vite dev server
npm test           # Run Vitest mathematical engine unit suite (12/12 tests)
npm run typecheck  # Strict TypeScript verification (tsc --noEmit)
npm run build      # Production bundle for Vercel (dist/)
```

---

## Deploying Manually to Vercel

This repository is pre-configured with [`vercel.json`](./vercel.json) (Vite framework preset, SPA rewrites, and HTTP security headers):

1. Push the `main` branch to `https://github.com/ZeroObjectivo/QMODSIM`.
2. Open [vercel.com/new](https://vercel.com/new) and import `ZeroObjectivo/QMODSIM`.
3. Confirm settings (auto-detected from `vercel.json`):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**, then copy the resulting live URL into the top of this `README.md`.

---

## QMODSIM Final Release Checklist

- [x] **Architectural Separation:** All QMODSIM equations reside in pure TypeScript modules under `src/engines/`, decoupled from React hooks (`src/hooks/`) and UI views (`src/views/`).
- [x] **Three-Archetype Completeness:** `SCENARIOS`, `LAB`, and `CODEX` are functional, interactive, and grounded in Old Yorker's Chapters 1–2 proposal.
- [x] **Dual-Theme & Unicode Polish:** Persistent Light/Dark toggle works across all 4 HTML5 Canvases, with zero raw LaTeX syntax in DOM or Canvas.
- [x] **In-App Mathematical Verification:** All 6 live invariant checks (Poisson, Little's Law, Markov row-stochasticity, FAIR convergence, BOM Z-score recall, reliability dominance) pass inside the Verification Drawer.
- [x] **Security & Skill Audit:** Zero `dangerouslySetInnerHTML`, `eval`, or `Math.random` token generation; unbiased Web Crypto CSPRNG (`crypto.getRandomValues()`) and OWASP Agentic Top 10 vetting documented in [AI_USAGE.md](./AI_USAGE.md).
- [x] **GitHub & Vercel Readiness:** Conventional commits on `main`, `vercel.json` configured, and verified `npm test` + `npm run build`.
