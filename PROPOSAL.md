# Capstone Proposal: Optimizing Multi-Branch Retail — An Integrated Ordering and Inventory System for Old Yorker's

**Institution:** University of Makati — College of Computing and Information Sciences (J.P. Rizal Ext., West Rembo, Makati City)  
**Course:** Quantitative Modeling and Simulation (QMODSIM)  
**Production Storefront:** [https://old-yorkers.vercel.app/](https://old-yorkers.vercel.app/)  
**Team Roster:**
- **Calm Kaisha Boregas** (Project Lead)
- **Peter Paul Marfil**
- **Pepe Bayotlang**
- **Christian Salazar**
- **Princess Mariel Pagal**

---

## Chapter 1: The Problem and Its Background

**Old Yorker's**, a rapidly growing Philippine food enterprise recognized for its signature hotdogs and snacks, has expanded from its original **Guadalupe Nuevo** branch to multiple locations across Metro Manila and nearby provinces, including **Bangkal, Taguig, Cainta, and Davao**.

### 1.1 Operational Stressors (Legacy Manual Workflow)
1. **Peak-Hour Chat & Order Bottlenecks:** Relying on Facebook Messenger inquiries and third-party apps during lunch (12:00 PM), merienda (03:30 PM), and dinner (07:00 PM) rushes causes delayed responses, overlooked orders, and kitchen queue saturation.
2. **Manual GCash Receipt Screenshot Verification:** Staff must manually receive, cross-check, and validate customer GCash screenshots during peak rushes—slowing order service rates (`μ`) and creating a fraud vector for doctored receipts.
3. **End-of-Day Physical Inventory Discrepancies:** Branch personnel manually count remaining raw ingredients (**hotdog buns, beef franks, specialty sauces/condiments, and packaging**) at closing time, leading to stock consolidation errors, unrecorded shrinkage, and unexpected branch stockouts.

### 1.2 Cybersecurity & CINS Threat Vectors
1. **Weak Staff Credentials & Order Reference Enumeration:** Legacy numeric staff PINs and predictable order IDs risk unauthorized Admin/Branch Manager dashboard access across dispersed branches.
2. **GCash Receipt Fraud & Unrecorded Shrinkage:** Without automated GCash API webhook verification and recipe-level Bill-of-Materials (BOM) deduction, branches suffer financial loss from fraudulent payment proofs and unmonitored ingredient shrinkage.
3. **Multi-Branch Data Privacy Exposure (RA 10173):** Centralizing customer order histories, delivery details, and branch financial ledgers requires strict **Role-Based Access Control (RBAC)** (`Admin`, `Branch Manager`, `Staff`) under the Philippine Data Privacy Act of 2012.

---

## Chapter 2: Quantitative Modeling & Simulation Mapping (QMODSIM)

This interactive web artifact translates Old Yorker's Chapters 1–2 IPO conceptual framework into a verified quantitative simulation across all core QMODSIM curriculum modules:

| QMODSIM Module | Old Yorker's Operational / Threat Mapping | Pure Engine Module |
| :--- | :--- | :--- |
| **Modules 1 & 3:** Stochastic Processes & Arrival Rates | Lunch, merienda & dinner Gaussian order rushes across 5 branches | `src/engines/arrivals.ts` |
| **Modules 2 & 10:** Security Modeling & Information Entropy | Weak 4-digit staff PIN vs. RBAC session & GCash webhook HMAC tokens | `src/engines/entropy.ts` |
| **Module 4:** Monte Carlo & FAIR Risk Framework | Fake GCash receipts, raw ingredient shrinkage, stockouts & RA 10173 fines | `src/engines/fairMonteCarlo.ts` |
| **Module 5:** Markov Chains & State Dynamics | Order ticket lifecycle (`Cart → GCash Verify → Kitchen Prep → Fulfilled / Abandoned`) | `src/engines/markov.ts` |
| **Module 6:** Queueing Theory (`M/M/c/K`) | Kitchen grill/prep stations (`c`) & active order queue capacity (`K`) | `src/engines/queueing.ts` |
| **Module 7:** Game Theory in Retail Defense | Branch Manager void/stock audits vs. unrecorded shrinkage & receipt fraud | `src/engines/gameTheory.ts` |
| **Module 11:** ML Anomaly Detection in Logs | Zero-allocation streaming Z-score detection on BOM hotdog bun/beef deductions | `src/engines/anomaly.ts` |
| **Module 12:** System Reliability & Availability | Multi-branch POS, MySQL DB & GCash API failover during ISP brownouts | `src/engines/reliability.ts` |
