# Conflicts & Document Precedence Log

In accordance with Section 1 of the Loop Engineering Prompt, where this prompt and the source documents (SSOT v0.1, Blueprint v0.2, TDS v0.1) conflict, the source documents win. All identified conflicts, alignments, and interpretations are logged here.

## 1. Routing Model: Hash Routing vs Path Routing
- **Prompt**: Section 4 specifies "One app, role-based, hash-routed".
- **TDS / Blueprint**: Mention web paths (e.g. `/executive/cases`, `/borrower/cases/:id`).
- **Resolution**: Since this is a standalone frontend prototype running on a static server with zero backend, client-side hash routing (`#/executive/dashboard`, `#/borrower/link`, `#/sandbox/lender`, etc.) is adopted. This satisfies both the static serving requirement and the screen inventory URLs.

## 2. Public Screen Inventory Mapping
- **Prompt**: Lists "PUB-01 home, PUB-02 how it works, PUB-03 privacy and grievance contacts".
- **TDS Section 4.1**: Lists PUB-01 (Home), PUB-02 (How it works), PUB-03 (Partner hospitals), PUB-04 (Lenders & disclosures), PUB-05 (Fees explanation), PUB-06 (Privacy notice), PUB-07 (Complaint / support contact).
- **Resolution**: We implement all public pages PUB-01 through PUB-07. The prompt's reference to PUB-03 as privacy & grievance contacts is aligned by making PUB-06 (Privacy) and PUB-07 (Complaints) prominent and directly linked from the public navigation and footer, ensuring complete fidelity to TDS 4.1.

## 3. Executive Case Wizard Steps vs Separate Screen IDs
- **Prompt**: Specifies "EXE-02/03/04/05 new case wizard (hospital, patient, borrower, first demand, review, FRID generation)".
- **TDS Section 4.4 & 5.1**: Specifies EXE-02 as the New Financing Case wizard encompassing patient/borrower details (EXE-03), hospital funding need (EXE-04), and review/FRID generation (EXE-05).
- **Resolution**: Implemented as a clear multi-step wizard under route `#/executive/new-case` with sub-step navigation, matching both the prompt's granular step IDs and the TDS wireframe contract.

## 4. Multi-Tranche Facility Mechanics
- **SSOT Section 8 & Blueprint Section 8**: Notes that multi-tranche lending mechanics are dependent on NBFC product specifications.
- **Prompt Section 4.2 & TDS Section 7.2**: Resolves this for the prototype by explicitly seeding two lender archetypes:
  - Lender A (e.g., CareFinance NBFC): Single upfront disbursement only. Subsequent demands are rejected with guidance to start a new application.
  - Lender B (e.g., HealthCredit Capital): Multi-drawdown facility requiring explicit borrower authorization per funding request.
- **Resolution**: Implemented in `lender-mock.js` and configuration exactly as specified.

