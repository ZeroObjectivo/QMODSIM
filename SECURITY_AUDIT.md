# SECURITY_AUDIT.md — Phase 4 Security Hardening & Toolchain Audit Report

**Project:** Optimizing Multi-Branch Retail: An Integrated Ordering and Inventory System for Old Yorker's (QMODSIM Web Artifact)  
**Institution:** University of Makati — College of Computing and Information Sciences  
**Audit Frameworks:** Cloudflare Security Audit Checklist, UnitOneAI SecuritySkills, OWASP Agentic Skills Top 10, `npm audit`  
**Overall Result:** **PASS — 0 Critical, 0 High, 0 Moderate, 0 Low Findings**

---

## 1. Executive Summary

| Audit Domain | Scope | Critical | High | Moderate / Low | Status |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Application & DOM Security** | `src/**/*.ts`, `src/**/*.tsx`, `index.html` | 0 | 0 | 0 | **PASS** |
| **Cryptographic & Input Hygiene** | `src/engines/entropy.ts`, `src/hooks/useLabState.ts`, `src/engines/arrivals.ts` | 0 | 0 | 0 | **PASS** |
| **HTTP & Deployment Headers** | `vercel.json` | 0 | 0 | 0 | **PASS** |
| **Dependency Supply Chain** | `package.json`, `package-lock.json` (`npm audit`) | 0 | 0 | 0 | **PASS** (after Vitest 5.1.2 remediation) |
| **Agentic Skill Supply Chain** | OWASP Agentic Skills Top 10 Vetting | 0 | 0 | 0 | **PASS** |

---

## 2. Static Codebase & DOM Security Audit (Cloudflare Security Audit)

Automated static inspection across all TypeScript and React modules under `src/`:

| Check | Pattern / Control Verified | Finding | Status |
| :--- | :--- | :--- | :--- |
| **DOM-Based XSS / Unsafe HTML** | `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write` | `0` occurrences across `src/` | **PASS** |
| **Dynamic Code Execution** | `eval(`, `new Function(`, string-based `setTimeout` | `0` occurrences across `src/` | **PASS** |
| **Client-Side Storage Hygiene** | `localStorage` usage (`src/hooks/useTheme.ts`) | Strictly allowlisted to `'light' \| 'dark'` enum; stores zero PII or credentials | **PASS** |
| **External Navigation Safety** | External `target="_blank"` link (`https://old-yorkers.vercel.app/`) | Enforces `rel="noopener noreferrer"` against reverse tabnabbing | **PASS** |
| **Secrets & Credential Exposure** | API keys, tokens, `.env` files, hardcoded passwords | `0` hardcoded secrets; `.env` and `.env.*` excluded in `.gitignore` | **PASS** |
| **Strict Type & Bounds Safety** | `tsconfig.json` (`strict: true`, `noUncheckedIndexedAccess: true`), zero `: any` | `0` TypeScript errors and `0` `any` annotations | **PASS** |

---

## 3. Cryptographic & Input Hygiene (UnitOneAI SecuritySkills)

1. **CSPRNG Token Entropy (`src/engines/entropy.ts`):**
   - Uses Web Crypto API (`globalThis.crypto.getRandomValues(Uint8Array)`) exclusively — zero `Math.random()` usage anywhere in the codebase.
   - Implements rejection sampling (`byte < Math.floor(256 / n) * n`) to eliminate modulo bias across all supported alphabets (`|Σ| ∈ {10, 36, 62, 94}`).
2. **Deterministic Simulation PRNG Separation:**
   - Stochastic simulations (`arrivals.ts`, `fairMonteCarlo.ts`, `anomaly.ts`) use an explicit seeded Mulberry32 PRNG solely for reproducible scientific Monte Carlo convergence — never for security tokens.
3. **Strict Numeric Clamping (`src/hooks/useLabState.ts`, `src/engines/*.ts`):**
   - Every slider input and engine parameter is clamped via `clamp(value, min, max)` with `Number.isFinite()` guards and structural invariant enforcement (`K ≥ c`), preventing `NaN`, `Infinity`, or division-by-zero states.

---

## 4. HTTP Security Headers (`vercel.json`)

The production Vercel deployment enforces defense-in-depth HTTP response headers across all routes (`/(.*)`):
- `X-Content-Type-Options: nosniff` — Prevents MIME-type sniffing.
- `X-Frame-Options: DENY` — Prevents clickjacking / UI redressing.
- `Referrer-Policy: strict-origin-when-cross-origin` — Limits referrer leakage on outbound links.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — Disables unused browser hardware APIs.

---

## 5. Dependency Supply-Chain Remediation (`npm audit`)

- **Initial Scan Finding:** `vitest@3.x` (devDependency) pulled vulnerable transitive versions of `@vitest/mocker <= 4.1.11` (moderate) and `tinypool <= 2.1.1` (critical prototype pollution in worker options).
- **Remediation Applied:** Upgraded `vitest` to `5.1.2` (`npm install -D vitest@5.1.2`), re-ran `npm audit`, and verified `12/12` unit tests + `tsc --noEmit` + `vite build`.
- **Post-Remediation Result:** **0 vulnerabilities** reported by `npm audit`.

---

## 6. OWASP Agentic Skills Top 10 Vetting Log

Every skill and workflow discipline activated during Phases 1–5 was inspected against the **OWASP Agentic Skills Top 10** (prompt injection, tool poisoning, unsafe shell execution, supply-chain tampering, secret exfiltration):

| Skill / Discipline | Category | Inspection Summary | Vetting Result |
| :--- | :--- | :--- | :--- |
| `obra/superpowers` & `andrej-karpathy-skills` | SDLC & Behavioral Discipline | Methodology rules only; no third-party executable scripts or remote fetches. | **APPROVED** |
| `elephant-goldfish-model` | Context Memory (`SPEC.md`) | Local workspace specification anchor only; zero external transmission. | **APPROVED** |
| `mattpocock/skills` | Strict TypeScript & TDD | Static compiler & Vitest patterns; enforced locally via `tsc --noEmit`. | **APPROVED** |
| `tasteskill`, `ui-ux-pro-max`, `hallmark` | Design System (`DESIGN_SYSTEM.md`) | Pure CSS/Canvas visual tokens; zero external CDN scripts beyond Google Fonts CSS. | **APPROVED** |
| `cloudflare/security-audit-skill` & `UnitOneAI/SecuritySkills` | Application & Crypto Security | Enforced Web Crypto CSPRNG, numeric clamping, and static XSS/secret checks. | **APPROVED** |
| `vercel-cli` (installed local skill) | Deployment Guidance | Read-only SKILL.md documentation; inspected before use; zero untrusted shell hooks. | **APPROVED** |

*(Cross-referenced with [AI_USAGE.md](./AI_USAGE.md) Section 2 and [README.md](./README.md).)*
