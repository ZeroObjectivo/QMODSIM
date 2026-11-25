# AI_USAGE.md — Agentic AI Workflow, Skill Vetting & Refinement Log

**Project:** Optimizing Multi-Branch Retail: An Integrated Ordering and Inventory System for Old Yorker's  
**Institution:** University of Makati — College of Computing and Information Sciences  
**GitHub Repository:** [https://github.com/ZeroObjectivo/QMODSIM](https://github.com/ZeroObjectivo/QMODSIM)  
**Production Storefront:** [https://old-yorkers.vercel.app/](https://old-yorkers.vercel.app/)  
**Team Roster:** Calm Kaisha Boregas (Project Lead), Peter Paul Marfil, Pepe Bayotlang, Christian Salazar, Princess Mariel Pagal

---

## 1. Agentic Environment & Model Rationale

- **Primary Coding Agent & IDE:** Google Antigravity
- **Primary LLM:** Gemini (Antigravity Agentic Runtime)
- **Rationale:** Antigravity's structured 5-phase SE workflow, parallel file orchestration, and terminal test verification enabled strict unidirectional separation between pure QMODSIM math engines (`src/engines/`), off-main-thread Web Worker Monte Carlo execution (`src/workers/`), and Old Yorker's warm diner/retail HTML5 Canvas visualizers (`src/components/`, `src/views/`).

---

## 2. Skills Activated & OWASP Agentic Top 10 Vetting Log

All engineering playbooks and workflow skills applied during Phases 1–5 were vetted against the **OWASP Agentic Skills Top 10** (inspecting for prompt injection, unauthorized shell commands, secret leakage, and exfiltration vectors):

| Engineering Category | Skill / Discipline Applied | SE Phases | OWASP Agentic Top 10 Vetting Status |
| :--- | :--- | :--- | :--- |
| SDLC & Behavioral Discipline | Superpowers (Gate-Driven TDD), Karpathy Guidelines (Think Before Coding, Simplicity First, Surgical Changes) | Phases 1, 3, 5 | **PASSED** — Pure methodology guidelines; zero external scripts or network calls. |
| Context Memory & Token Hygiene | Elephant-Goldfish Model (`SPEC.md` persistent anchor) | Phases 1–5 | **PASSED** — Local markdown specification anchor only. |
| Type Safety & Domain Modeling | Matt Pocock Strict TypeScript (branded units, discriminated unions, zero `any`, Vitest) | Phases 2, 3 | **PASSED** — Enforced via `tsconfig.json` (`strict: true`, `noUncheckedIndexedAccess: true`). |
| UI/UX & Anti-Slop Aesthetics | Taste Skill, UI/UX Pro Max, Hallmark (`DESIGN_SYSTEM.md`) | Phases 2, 3, 5 | **PASSED** — Warm Old Yorker's amber/stone palette derived from Chapter 2 Figure 1 IPO diagram, 1px borders, clean Unicode math. |
| Application & Agentic Security | Cloudflare Security Audit principles, UnitOneAI SecuritySkills, OWASP Agentic Top 10 | Phase 4 | **PASSED** — Enforced `crypto.getRandomValues()`, strict numeric clamping, zero `dangerouslySetInnerHTML`, zero raw secrets, hardened `vercel.json`. |
| Deployment | `vercel-cli` Skill & `vercel.json` release config | Phase 5 | **PASSED** — Vetted local skill; clean SPA rewrites and security headers configured for manual Vercel dashboard deployment. |

---

## 3. Phase-by-Phase Prompt & Refinement Log

### Refinement Iteration 01: Numerically Stable M/M/c/K Kitchen Queue Solver at Critical Saturation (ρ = 1)
- **SE Phase:** Phase 3 (Test-Driven Implementation)
- **Agentic Tool & Model:** Gemini in Antigravity
- **Active Skills:** `obra/superpowers` (TDD), `mattpocock/skills` (Strict TypeScript)
- **Flaw Detected:** Naive closed-form `M/M/c/K` formulas divide by zero at `ρ = 1.0` when Guadalupe Nuevo branch arrivals match total grill station throughput (`λ = c · μ`).
- **Surgical Refinement Prompt:**
  > "Refactor `src/engines/queueing.ts` to compute unnormalized state weights iteratively via `w_n = w_{n-1} · λ / (min(n, c) · μ)` and normalize `P_0 = 1 / Σ w_n`. Verify Little's Law `|L - λ_eff · W| < 10⁻⁵` at `ρ = 1.0` in Vitest."
- **Verification Outcome:** Exact probabilities computed across all `ρ > 0`, `Σ P_n = 1.00000000`, and `littlesLawDiff < 10⁻¹⁰`.

### Refinement Iteration 02: Zero-Allocation Streaming Z-Score Detector for BOM Ingredient Deductions
- **SE Phase:** Phase 3 (Test-Driven Implementation)
- **Agentic Tool & Model:** Gemini in Antigravity
- **Active Skills:** `mattpocock/skills` (Strict TypeScript), `andrej-karpathy-skills` (Surgical Changes)
- **Flaw Detected:** Inserting abnormal hotdog bun / beef frank shrinkage spikes into the rolling window inflates `σ_t` and masks subsequent shrinkage anomalies.
- **Surgical Refinement Prompt:**
  > "Implement `StreamingZScoreDetector` in `src/engines/anomaly.ts` using a fixed-capacity circular `Float64Array(30)` maintaining running sums in O(1) time with zero per-tick heap allocations. Exclude readings with `Z_t ≥ τ_crit` from baseline updates."
- **Verification Outcome:** Zero heap allocations per tick; Vitest confirms 3/3 injected shrinkage spikes flagged (`steps 48, 76, 102`).

### Refinement Iteration 03: Strict Readonly State Update & Full Old Yorker's Domain Alignment
- **SE Phase:** Phases 2–4 (Type Safety, Domain Alignment & Security Hardening)
- **Agentic Tool & Model:** Gemini in Antigravity
- **Active Skills:** `mattpocock/skills`, `UnitOneAI/SecuritySkills`, `tasteskill`
- **Flaw Detected:** `tsc --noEmit` flagged `TS2540: Cannot assign to 'lambda' because it is a read-only property` inside `src/hooks/useLabState.ts` when switching Old Yorker's branch presets (`guadalupe`, `bangkal`, `taguig`, `cainta`, `davao`).
- **Surgical Refinement Prompt:**
  > "Replace in-place property assignment in `useLabState.ts` with an immutable object spread (`branchOverride`) so all `LabParameters` fields remain strictly `readonly`, then re-verify `npm test` and `npm run build`."
- **Verification Outcome:** `tsc --noEmit` passed with 0 errors, Vitest passed `12/12` tests, Vite production bundle built cleanly, and static security scan confirmed 0 vulnerabilities or raw LaTeX leaks.

---

## 4. Code Attribution Matrix

| File / Directory | Generation & Oversight Attribution | Verification Method |
| :--- | :--- | :--- |
| `PROPOSAL.md`, `SPEC.md`, `DESIGN_SYSTEM.md` | Grounded directly in Old Yorker's Chapters 1–2 PBL PDF (`OLD YORKERS_ PBL CHAP 1 _ 2_2.pdf`) | Phase Gate Review |
| `src/types/simulation.ts` | Agentic generation with strict branded unit contracts (`OrdersPerHour`, `PHP`, `Bits`, `ZScore`) | `tsc --noEmit` |
| `src/engines/*.ts` (8 core math modules) | Agentic TDD implementation mapped to Old Yorker's IPO framework | Vitest (`engines.test.ts`) |
| `src/engines/validation.ts` | Adapted from Section 6 Student Guide invariant specification | Vitest + Live V&V Drawer |
| `src/workers/fairWorker.ts` | Off-main-thread 10,000-trial FAIR Monte Carlo worker | Convergence test (`±1.5%`) |
| `src/components/*Canvas.tsx` | Custom Old Yorker's Kitchen Floor, Markov Order Lifecycle, FAIR & BOM Canvases | Light/Dark visual & build check |
| `src/views/ScenariosView.tsx`, `LabView.tsx`, `CodexView.tsx` | Grounded in Old Yorker's 5 branches, GCash API, BOM deduction & RA 10173 | Typecheck + Production Build |
| `vercel.json`, `README.md`, `AI_USAGE.md` | Release & security hardening deliverables | Build + Git release audit |
