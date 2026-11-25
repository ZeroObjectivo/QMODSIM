# Capstone Proposal: AEGIS-ER — Clinical Triage & Hospital ER Telemetry Hub

**Course:** Quantitative Modeling and Simulation (QMODSIM)  
**Project Acronym:** AEGIS-ER  
**Target Domain:** Philippine Level-3 Hospital Emergency Department & Clinical Telemetry Infrastructure  
**Team Roster:**
- Calm Kaisha Boregas
- Peter Paul Marfil
- Pepe Bayotlang
- Christian Salazar
- Mayel Pagal

---

## Chapter 1: Operational Context & Problem Statement

Emergency Rooms (ER) in urban Philippine hospitals face severe operational volatility during multi-casualty ambulance arrivals, morning shift handovers (08:00 AM), and evening peak surges (07:00 PM). Simultaneously, modern ERs rely on interconnected clinical telemetry—electronic health record (EHR) terminals, smart IV infusion pumps, and VLAN-segmented triage kiosks—creating a dual operational and cybersecurity risk surface.

### 1.1 Operational Stressors
1. **Non-Homogeneous Patient Arrival Surges:** ER arrivals do not follow a static rate; they exhibit Gaussian surge spikes layered on top of baseline Poisson arrivals during rush hours and Code Blue events.
2. **Triage Bay & Waiting Buffer Saturation:** With finite triage physicians (c servers) and bounded holding capacity (K beds/chairs), sudden arrival spikes drive traffic utilization ρ ≥ 1, causing ambulance diversion and patient drop/rejection (P_K).
3. **Gateway & ISP Failover Vulnerability:** Single-path hospital WAN links and centralized EHR servers risk complete triage downtime during ISP brownouts unless backed by parallel redundant gateways and offline SQLite sync queues.

### 1.2 Cybersecurity & CINS Threat Vectors
1. **Weak Clinical Credentials (Entropy Deficit):** Legacy 4-digit nurse PINs on bedside EHR carts and infusion terminals have only 10⁴ combinations (≈ 13.29 bits), allowing rapid brute-force compromise within minutes.
2. **Lateral VLAN Intrusion & Ransomware Spread:** A compromised triage kiosk can pivot across hospital network states (Triage Kiosk → EHR Staging → ICU Telemetry VLAN → Quarantined or Compromised Absorbing States).
3. **Unauthorized Infusion Dosage Tampering:** Compromised telemetry packets can subtly alter IV infusion rates, requiring real-time streaming Z-score anomaly detection (Z_t ≥ τ_crit) to trigger automated clinical lockouts.
4. **Insider EHR Snooping & RA 10173 Exposure:** Unauthorized access to sensitive patient records exposes the hospital to statutory penalties under the **Philippine Data Privacy Act of 2012 (Republic Act No. 10173)** and National Privacy Commission (NPC) breach notification mandates.

---

## Chapter 2: Quantitative Modeling & Simulation Objectives

AEGIS-ER translates these operational and security challenges into a verified, interactive browser-based QMODSIM web artifact featuring three core archetypes (**SCENARIOS**, **LAB**, **CODEX**) and covering all core QMODSIM curriculum modules:

| QMODSIM Module | AEGIS-ER Operational / Threat Mapping | Primary Quantitative Output |
| :--- | :--- | :--- |
| **Modules 1 & 3:** Stochastic Processes & Arrival Rates | Baseline ER arrivals + 08:00 AM / Code Blue Gaussian surges | λ(t), exponential inter-arrival f(t), Poisson P(N(t)=k) |
| **Modules 2 & 10:** Security Modeling & Information Entropy | 4-digit nurse PIN vs. 12-char alphanumeric vs. 256-bit Web Crypto token | Shannon entropy H(X), keyspace S, time-to-crack T_crack |
| **Module 4:** Monte Carlo & FAIR Risk Framework | RA 10173 breach fines, ransomware downtime, control ROI | 10,000-trial ALE distribution, P95 VaR, ROSI |
| **Module 5:** Markov Chains & Network State Dynamics | Lateral VLAN intrusion & ER patient triage lifecycle | Fundamental matrix N = (I - Q)⁻¹, absorption B = N·R, steps t = N·1 |
| **Module 6:** Queueing Theory (M/M/c/K) | Finite-capacity ER triage bays & ambulance diversion buffer | Utilization ρ, drop rate P_K, L, W, Little's Law |
| **Module 7:** Game Theory in Network Defense | Security audit frequency vs. insider EHR snooping | Payoff matrix, Mixed-Strategy Nash Equilibrium (p*, q*) |
| **Module 11:** ML Anomaly Detection in Network Logs | Real-time IV infusion dosage & EHR query spike detection | Streaming O(1) circular-buffer Z-score Z_t ≥ τ_crit |
| **Module 12:** System Reliability & Availability | Hospital WAN + parallel gateway + offline SQLite failover | Series R_sys(t), parallel R_parallel(t), availability A |

---

## Chapter 3: Statutory & Regulatory Alignment

- **Republic Act No. 10173 (Data Privacy Act of 2012):** Enforces organizational, physical, and technical security measures for Sensitive Personal Information (SPI), including medical records (Section 20), and establishes penalties for unauthorized processing and negligent breach (Sections 25–33).
- **NPC Circular 16-03 (Personal Data Breach Management):** Mandates 72-hour breach notification and quantitative impact assessment, modeled directly through AEGIS-ER's FAIR Monte Carlo module.
- **DOH Administrative Order 2016-0042 (Hospital ER Triage Standards):** Establishes maximum triage wait thresholds and surge capacity readiness, validated via the M/M/c/K queueing engine.
