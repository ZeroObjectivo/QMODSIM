# SPEC.md — AEGIS-ER Technical & Mathematical Specification

> Persistent architectural memory anchor (Elephant-Goldfish Model). All engines, UI views, and tests MUST conform to the contracts, units, and invariants defined here.

## 1. System Architecture & Unidirectional Boundaries

```text
src/types/simulation.ts   (Pure branded types, discriminated unions, interfaces)
         │
         ▼
src/engines/*.ts          (Pure deterministic & stochastic math — ZERO React/DOM)
         │
         ▼
src/workers/fairWorker.ts (Off-main-thread 10,000-trial FAIR Monte Carlo runner)
         │
         ▼
src/hooks/*.ts            (State management, strict clamping, theme & worker hooks)
         │
         ▼
src/views/*.tsx           (SCENARIOS, LAB, CODEX + Verification & Validation Drawer)
```

## 2. Explicit Assumptions & Unit Contracts

| Symbol | Domain Label | Unit | Clamped Range |
| :--- | :--- | :--- | :--- |
| λ | Baseline ER Arrival Rate | patients / hour | `[1, 60]` |
| μ | Triage Physician Service Rate | patients / hour / bay | `[1, 20]` |
| c | Active Triage Bays | integer bays | `[1, 12]` |
| K | Total ER Buffer Capacity (c + waiting) | integer slots | `[c, 40]` |
| τ_crit | IV Infusion Z-Score Alert Threshold | standard deviations (σ) | `[1.5, 5.0]` |
| L | Credential / Token Length | characters | `[4, 32]` |
| |Σ| | Credential Alphabet Size | symbols | `{10, 36, 62, 94}` |
| Currency | Financial Risk Exposure (FAIR) | Philippine Pesos (PHP) | `[10_000, 100_000_000]` |

## 3. Mathematical Engine Contracts (Clean Unicode Notation)

### 3.1 Arrivals Engine (`src/engines/arrivals.ts`)
- Exponential inter-arrival PDF: `f(t) = λ · e^(-λt)`
- Poisson count PMF: `P(N(t) = k) = ((λ · t)^k · e^(-λt)) / k!`
- Non-Homogeneous surge rate: `λ(t) = λ_base + Σ [A_i · exp(-(t - t_peak,i)² / (2σ_i²))]`

### 3.2 Entropy & Cryptanalysis Engine (`src/engines/entropy.ts`)
- Shannon Entropy: `H(X) = -Σ [P(x_i) · log₂(P(x_i))] = log₂(|Σ|^L)`
- Keyspace complexity: `S = |Σ|^L`
- Time-to-compromise: `T_crack = S / (2 · R_rate)`
- Live cryptographic token generator strictly using `crypto.getRandomValues()`.

### 3.3 FAIR Monte Carlo Risk Engine (`src/engines/fairMonteCarlo.ts` & `src/workers/fairWorker.ts`)
- Threat Event Frequency: `TEF ~ Beta-PERT(a_min, m_likely, b_max)`
- Loss Magnitude: `LM ~ Lognormal(μ, σ)`
- Annual Loss Aggregation: `Loss_Total = Σ (Loss_Primary + Loss_Secondary)`
- Security ROI: `ROSI = [(ALE_base - ALE_mitigated) - C_control] / C_control`
- 10,000 trials executed in Web Worker with deterministic Mulberry32 PRNG seeds so Seed A vs. Seed B convergence is verifiable within `±1.5%`.

### 3.4 Absorbing Markov Chain Engine (`src/engines/markov.ts`)
- Canonical 5-state hospital VLAN threat model:
  - Transient states (`Q`, 3×3): `S0: Triage Kiosk`, `S1: EHR Staging`, `S2: ICU Telemetry VLAN`
  - Absorbing states (`R`, 3×2): `S3: Quarantined (Safe)`, `S4: Compromised (Breach)`
- Fundamental matrix: `N = (I - Q)⁻¹`
- Absorption probabilities: `B = N · R`
- Mean steps to absorption: `t = N · 1`

### 3.5 Queueing Theory Engine (`src/engines/queueing.ts`)
- Multi-server finite capacity `M/M/c/K`
- Traffic utilization: `ρ = λ / (c · μ)`
- Drop/rejection probability: `P_drop = P_K`
- Effective arrival rate: `λ_eff = λ · (1 - P_K)`
- Little's Law: `L = λ_eff · W`, verified to `|L - (λ_eff · W)| < 10⁻⁵`.

### 3.6 Game Theory Defense Engine (`src/engines/gameTheory.ts`)
- Normal-form payoff matrix: `U_defender` vs. `U_attacker`
- Mixed-Strategy Nash Equilibrium: `p* = C_audit / (G + F)`, `q* = G / (G + F)`

### 3.7 Zero-Allocation Streaming Z-Score Detector (`src/engines/anomaly.ts`)
- Fixed-capacity circular `Float64Array` of window size `W = 30`
- O(1) running sums without per-tick array allocation
- Sliding mean `μ_t`, variance `σ_t²`, anomaly criterion `Z_t = |x_t - μ_t| / σ_t ≥ τ_crit`

### 3.8 System Reliability & Availability Engine (`src/engines/reliability.ts`)
- Series reliability: `R_sys(t) = Π R_i(t)`
- Parallel redundancy: `R_parallel(t) = 1 - Π (1 - R_i(t))`
- Inherent availability: `A = MTBF / (MTBF + MTTR)`

### 3.9 Automated Verification & Validation (`src/engines/validation.ts`)
- Implements `runInvariantChecks()` exposed inside the live Verification & Validation Drawer.
