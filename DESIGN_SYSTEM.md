# DESIGN_SYSTEM.md — AEGIS-ER Clinical Instrument Aesthetic

Grounded in **Taste Skill**, **UI/UX Pro Max**, and **Hallmark** principles to eliminate generic AI visual clichés (zero purple neon gradients, zero heavy drop shadows, zero blurry glassmorphism).

## 1. Visual Philosophy
AEGIS-ER is styled as a **Clinical Telemetry & Quantitative Engineering Instrument**:
- Flat, high-contrast editorial surfaces
- Crisp `1px` structural borders (`border-slate-800` in Dark mode, `border-slate-200` in Light mode)
- Tabular monospace numerals (`font-mono tabular-nums`) for every live metric, slider readout, probability, and currency figure
- Clean Unicode mathematical typography (`λ, μ, ρ, σ, τ, →, ·, ±, ≤, ≥, ², ³, ⁻¹, ₀`) — zero raw LaTeX strings anywhere in DOM or Canvas

## 2. Dual-Theme Token Palette

| Token | Light Mode (Clinical Paper) | Dark Mode (Night-Shift Telemetry) | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#F8FAFC` | `#090E1A` | Page background |
| `--bg-surface` | `#FFFFFF` | `#0F172A` | Cards, panels, drawers |
| `--bg-elevated` | `#F1F5F9` | `#1E293B` | Subtle inset strips, tables |
| `--border-hairline` | `#E2E8F0` | `#1E293B` | 1px card & divider borders |
| `--text-primary` | `#0F172A` | `#F1F5F9` | Headings, primary telemetry |
| `--text-muted` | `#475569` | `#94A3B8` | Labels, units, footnotes |
| `--accent-cyan` | `#0284C7` | `#22D3EE` | Primary telemetry, active tab, normal flow |
| `--accent-emerald` | `#059669` | `#34D399` | Passed invariants, safe/quarantined state |
| `--accent-amber` | `#D97706` | `#FBBF24` | Elevated utilization, warnings |
| `--accent-rose` | `#E11D48` | `#FB7185` | Code Blue saturation, anomalies, breach state |

## 3. Typography
- **UI & Editorial Headings:** `Inter`, system-ui, sans-serif
- **Telemetry, Equations & Code:** `JetBrains Mono`, ui-monospace, monospace with `font-variant-numeric: tabular-nums`
