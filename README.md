# AEGIS-ER · Clinical Triage & Hospital ER Telemetry QMODSIM

An interactive Quantitative Modeling and Simulation (QMODSIM) single-page web application proving the operational capacity and cybersecurity resilience of **AEGIS-ER**—a Philippine Level-3 Hospital Emergency Room Triage & Clinical Telemetry Hub—under stress.

- **Live Deployment URL:** `[Add your Vercel URL after deploying, e.g. https://aegis-er-qmodsim.vercel.app]`
- **Capstone Proposal:** [PROPOSAL.md](./PROPOSAL.md)
- **Technical Specification:** [SPEC.md](./SPEC.md)
- **Design System:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- **Agentic AI Workflow & OWASP Vetting Log:** [AI_USAGE.md](./AI_USAGE.md)

---

## Team Roster

| Member | Role |
| :--- | :--- |
| **Calm Kaisha Boregas** | Lead Systems Architect & QMODSIM Modeling |
| **Peter Paul Marfil** | Stochastic & Queueing Engine Verification |
| **Pepe Bayotlang** | Cybersecurity, Markov VLAN & Cryptanalysis Modeling |
| **Christian Salazar** | Frontend Telemetry Canvas & Dual-Theme Engineering |
| **Mayel Pagal** | Statutory Compliance (RA 10173 / DOH) & Documentation |

---

## Core Interface Architecture

1. **SCENARIOS** — Three narrative-driven hospital crisis walkthroughs (*Code Blue Ambulance Surge*, *Lateral VLAN & IV Infusion Attack*, *RA 10173 Breach & Insider Snooping*) with interactive decision forks that mutate parameters in `src/engines/` and recompute live before-vs-after telemetry.
2. **LAB** — Multi-variable stochastic workbench with strictly clamped domain sliders (`λ, μ, c, K, τ_crit`, containment, mitigation, MTBF/MTTR), four theme-reactive 60 FPS HTML5 Canvases, Web Worker 10,000-trial FAIR Monte Carlo simulation, and Web Crypto CSPRNG token generator.
3. **CODEX** — Formal mathematical derivations in clean Unicode typography (zero raw LaTeX) and a Philippine regulatory compliance crosswalk (**RA 10173**, **NPC Circular 16-03**, **DOH AO 2016-0042**).
4. **In-App Verification & Validation Drawer** — Live mathematical invariant suite accessible from the top navigation bar confirming Poisson arrival convergence, Little's Law conservation, Markov row-stochasticity, FAIR Monte Carlo convergence, Z-score spike recall, and reliability dominance.

---

## Proposal-to-Module Mapping

| QMODSIM Curriculum Module | AEGIS-ER Domain Stressor / Threat | Pure Engine Module |
| :--- | :--- | :--- |
| **Modules 1 & 3:** Stochastic Processes & Arrival Rates | 08:00 AM shift handover & Code Blue Gaussian ER surges | `src/engines/arrivals.ts` |
| **Modules 2 & 10:** Security Modeling & Information Entropy | 4-digit nurse PIN brute-force vs. Web Crypto session tokens | `src/engines/entropy.ts` |
| **Module 4:** Monte Carlo & FAIR Risk Framework | RA 10173 breach fines, ransomware downtime & ROSI | `src/engines/fairMonteCarlo.ts` + `src/workers/fairWorker.ts` |
| **Module 5:** Markov Chains & Network State Dynamics | Lateral VLAN intrusion (`S₀ → S₁ → S₂ → {S₃, S₄}`) | `src/engines/markov.ts` |
| **Module 6:** Queueing Theory (`M/M/c/K`) | Finite ER triage bays (`c`) & ambulance diversion buffer (`K`) | `src/engines/queueing.ts` |
| **Module 7:** Game Theory in Network Defense | Hospital DPO audit frequency vs. insider EHR snooping | `src/engines/gameTheory.ts` |
| **Module 11:** ML Anomaly Detection in Network Logs | Zero-allocation streaming Z-score IV infusion dosage lockout | `src/engines/anomaly.ts` |
| **Module 12:** System Reliability & Availability | Parallel redundant gateways & offline SQLite failover | `src/engines/reliability.ts` |

---

## Local Development & Verification

```bash
npm install
npm run dev        # Start local Vite dev server
npm test           # Run Vitest mathematical engine unit suite
npm run typecheck  # Strict TypeScript check (tsc --noEmit)
npm run build      # Production bundle for Vercel
```

---

## Deploying to Vercel

This repository is pre-configured for zero-config Vercel deployment via [`vercel.json`](./vercel.json) (Vite framework detection, SPA rewrites, and HTTP security headers).

1. Push this repository to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Click **Deploy** (Build Command: `npm run build`, Output Directory: `dist`).
4. Or deploy directly from CLI: `npx vercel --prod`.
