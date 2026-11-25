# SPEC.md — Old Yorker's Multi-Branch QMODSIM Specification

> Persistent architectural anchor (Elephant-Goldfish Model) mapping Old Yorker's Chapters 1 & 2 IPO model (Input → Process → Output) to pure TypeScript simulation engines.

## 1. Domain & Branch Scope
- **Enterprise:** Old Yorker's (Hotdogs & Snacks Multi-Branch Retail)
- **Branches:** Guadalupe Nuevo (Flagship), Bangkal, Taguig, Cainta, Davao
- **Core Storefront:** `https://old-yorkers.vercel.app/`
- **Raw Ingredients (BOM):** Hotdog Buns, Beef Franks, Packaging Sleeves, Specialty Condiments
- **RBAC Roles:** Admin (Owner), Branch Manager, Branch Staff

## 2. Explicit Parameter & Unit Contracts

| Symbol | Old Yorker's Domain Label | Unit | Clamped Range |
| :--- | :--- | :--- | :--- |
| λ | Branch Peak Order Arrival Rate | orders / hour | `[2, 80]` |
| μ | Grill & Prep Station Fulfillment Rate | orders / hour / station | `[2, 25]` |
| c | Active Kitchen Prep Stations | integer stations | `[1, 10]` |
| K | Active Order Queue Buffer Capacity | integer tickets | `[c, 45]` |
| τ_crit | Ingredient Shrinkage Z-Score Threshold | standard deviations (σ) | `[1.5, 5.0]` |
| L | RBAC / GCash Webhook Token Length | characters | `[4, 32]` |
| |Σ| | Credential Alphabet Size | symbols | `{10, 36, 62, 94}` |
| Currency | Financial Loss Exposure (FAIR) | Philippine Pesos (PHP) | `[10_000, 20_000_000]` |

## 3. Absorbing Markov Order Lifecycle (`src/engines/markov.ts`)
- Transient states (`Q`, 3×3):
  - `S₀`: Branch Select & Cart Checkout
  - `S₁`: GCash API / Receipt Verification
  - `S₂`: Kitchen Prep & BOM Stock Deduction
- Absorbing states (`R`, 3×2):
  - `S₃`: Order Fulfilled & Stock Deducted (Success)
  - `S₄`: Abandoned / Fraud-Rejected / Stockout Cancel (Loss)

## 4. Verification & Validation Invariants (`src/engines/validation.ts`)
1. Poisson Arrival Invariant (`Error < 2.0%` against `1/λ`)
2. Little's Law Conservation (`|L - (λ_eff · W)| < 10⁻⁵`)
3. Markov Row-Stochasticity (`Σ P_ij = 1.0` within `10⁻⁵`)
4. FAIR Monte Carlo Convergence (`Variance < 1.5%` across 10,000 trials)
5. BOM Ingredient Deduction Z-Score Recall (`3/3` injected shrinkage spikes flagged)
6. Redundant Failover Reliability Dominance (`0 ≤ R_series ≤ R_redundant ≤ 1`)
