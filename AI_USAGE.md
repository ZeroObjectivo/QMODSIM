# AI_USAGE.md — Agentic AI Workflow, Skill Vetting & Refinement Log

**Project:** AEGIS-ER (Clinical Triage & Hospital ER Telemetry Hub)  
**Team Roster:** Calm Kaisha Boregas, Peter Paul Marfil, Pepe Bayotlang, Christian Salazar, Mayel Pagal

---

## 1. Agentic Environment & Model Rationale

- **Primary Coding Agent & IDE:** Google Antigravity
- **Primary LLM:** Gemini (Antigravity Agentic Runtime)
- **Rationale:** Antigravity's native file orchestration, parallel tool execution, terminal verification, and structured SE phase workflow enabled strict unidirectional separation between pure mathematical engines (`src/engines/`), Web Worker Monte Carlo execution (`src/workers/`), and theme-reactive HTML5 Canvas views (`src/components/`, `src/views/`).

---

## 2. Skills Activated & OWASP Agentic Top 10 Vetting Log

All engineering playbooks and workflow disciplines applied during Phases 1–5 were vetted against the **OWASP Agentic Skills Top 10** (checking for prompt injection, unauthorized shell execution, exfiltration vectors, and secret leakage):

| Engineering Category | Skill / Discipline Applied | SE Phases | OWASP Agentic Top 10 Vetting Status |
| :--- | :--- | :--- | :--- |
| SDLC & Behavioral Discipline | Superpowers (Gate-Driven TDD), Karpathy Guidelines (Think Before Coding, Simplicity First, Surgical Changes) | Phases 1, 3, 5 | **PASSED** — Pure methodology guidelines; zero external scripts or network calls. |
| Context Memory & Token Hygiene | Elephant-Goldfish Model (`SPEC.md` persistent anchor) | Phases 1–5 | **PASSED** — Local markdown anchor only; zero external data exfiltration. |
| Type Safety & Domain Modeling | Matt Pocock Strict TypeScript (branded units, discriminated unions, zero `any`, Vitest) | Phases 2, 3 | **PASSED** — Static type rules enforced via `tsconfig.json` (`strict: true`, `noUncheckedIndexedAccess: true`). |
| UI/UX & Anti-Slop Aesthetics | Taste Skill, UI/UX Pro Max, Hallmark (`DESIGN_SYSTEM.md`) | Phases 2, 3, 5 | **PASSED** — Flat clinical slate/cyan palette, 1px borders, Light/Dark canvas tokens, clean Unicode math. |
| Application & Agentic Security | Cloudflare Security Audit principles, UnitOneAI SecuritySkills, OWASP Agentic Top 10 | Phase 4 | **PASSED** — Enforced `crypto.getRandomValues()`, strict numeric clamping, zero `dangerouslySetInnerHTML`, zero hardcoded secrets, hardened `vercel.json` headers. |

---

## 3. Phase-by-Phase Prompt & Refinement Log

### Refinement Iteration 01: Numerically Stable M/M/c/K Queue Solver at Critical Saturation (ρ = 1)
- **SE Phase:** Phase 3 (Test-Driven Implementation)
- **Agentic Tool & Model:** Gemini in Antigravity
- **Active Skills:** `obra/superpowers` (TDD), `mattpocock/skills` (Strict TypeScript)
- **Flaw Detected:** Naive closed-form `M/M/c/K` formulas using `1 / (1 - ρ)` divide by zero when `λ = c · μ` (`ρ = 1.0`) and overflow `c!` when `c` increases.
- **Surgical Refinement Prompt:**
  > "Refactor `src/engines/queueing.ts` to compute unnormalized state weights iteratively via `w_n = w_{n-1} · λ / (min(n, c) · μ)` and normalize `P_0 = 1 / Σ w_n`. Verify Little's Law `|L - λ_eff · W| < 10⁻⁵` at `ρ = 1.0` in Vitest."
- **Verification Outcome:** Exact probabilities computed across all `ρ > 0` (including `ρ = 1.0`), `Σ P_n = 1.00000000`, and `littlesLawDiff < 10⁻¹⁰`.

### Refinement Iteration 02: Zero-Allocation Streaming Z-Score Detector with Baseline Poisoning Protection
- **SE Phase:** Phase 3 (Test-Driven Implementation)
- **Agentic Tool & Model:** Gemini in Antigravity
- **Active Skills:** `mattpocock/skills` (Strict TypeScript), `andrej-karpathy-skills` (Surgical Changes)
- **Flaw Detected:** Updating the rolling mean `μ_t` with anomalous IV infusion dosage spikes inflates `σ_t` and masks subsequent tampering packets.
- **Surgical Refinement Prompt:**
  > "Implement `StreamingZScoreDetector` in `src/engines/anomaly.ts` using a fixed-capacity circular `Float64Array(30)` maintaining running `sum` and `sumSq` in O(1) time with zero per-tick allocations. Gate baseline insertion so readings with `Z_t ≥ τ_crit` do not poison `μ_t`."
- **Verification Outcome:** Zero heap allocations per tick; Vitest confirms 3/3 injected dosage spikes flagged (`steps 48, 76, 102`) with stable rolling baseline.

### Refinement Iteration 03: Unbiased Web Crypto Token Generation & Security Header Hardening
- **SE Phase:** Phase 4 (Security Hardening & Toolchain Audit)
- **Agentic Tool & Model:** Gemini in Antigravity
- **Active Skills:** `UnitOneAI/SecuritySkills`, `cloudflare/security-audit-skill`
- **Flaw Detected:** Direct `byte % alphabet.length` indexing introduces slight modulo bias for non-power-of-two alphabets (`|Σ| ∈ {10, 36, 62, 94}`), and static hosting needed explicit clickjacking/MIME-sniffing headers.
- **Surgical Refinement Prompt:**
  > "Update `generateSecureClinicalToken` in `src/engines/entropy.ts` to use `crypto.getRandomValues()` with rejection sampling (`byte < Math.floor(256 / n) * n`) and add `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers in `vercel.json`."
- **Verification Outcome:** Uniform CSPRNG token generation verified in Vitest; zero `dangerouslySetInnerHTML`, zero `eval`, zero raw secrets across `src/`.

---

## 4. Code Attribution Matrix

| File / Directory | Generation & Oversight Attribution | Verification Method |
| :--- | :--- | :--- |
| `PROPOSAL.md`, `SPEC.md`, `DESIGN_SYSTEM.md` | Co-authored via Phase 1–2 agentic specification & team domain review | Phase Gate Review |
| `src/types/simulation.ts` | Agentic generation with strict branded unit contracts | `tsc --noEmit` |
| `src/engines/*.ts` (8 core math modules) | Agentic TDD implementation, reviewed against QMODSIM curriculum equations | Vitest (`src/engines/__tests__/engines.test.ts`) |
| `src/engines/validation.ts` | Adapted directly from Section 6 Student Guide invariant specification | Vitest + Live V&V Drawer |
| `src/workers/fairWorker.ts` | Agentic implementation offloading 10,000 FAIR trials off main thread | Worker convergence test (`±1.5%`) |
| `src/components/*Canvas.tsx` | Agentic implementation with theme-reactive `getCanvasTheme(theme)` loops | Light/Dark visual & build check |
| `src/views/ScenariosView.tsx`, `LabView.tsx`, `CodexView.tsx` | Agentic implementation grounded in AEGIS-ER clinical domain & RA 10173 | Typecheck + Production Build |
| `vercel.json`, `README.md`, `AI_USAGE.md` | Release & security hardening deliverables | Build + Git pre-release audit |
