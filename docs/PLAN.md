# Functional Prototype Execution Plan (PLAN.md)

This execution plan outlines the nine engineering slices (S1 through S9) to build and verify the Healthcare Financing LSP Functional Prototype. Each slice includes implementation, automated Playwright tests, and test logging.

## Slice S1: Foundation & Architecture Core
- **Components**:
  - `data/seed.json`: Canonical organizations (2 hospitals with 2 branches each, 2 NBFCs), seeded users (10 staff personas, 10 borrower personas), sample cases at various lifecycle stages, verified beneficiary accounts.
  - `js/store.js`: Central state container with versioning, deep clone, subscription, persistence to `localStorage`, and reset facility.
  - `js/states.js`: Formal state machines for FinancingCase, HospitalDemand, FundingRequest, Drawdown, Disbursement, HospitalReceipt with transition tables and typed `StateTransitionError`.
  - `js/rbac.js`: Central role catalog, permission matrix, ABAC scope check, field masking utilities.
  - `js/audit.js`: Append-only audit log recorder (actor, role, action, target, timestamp, reason).
  - `js/router.js`: Hash-based SPA router with permission guard, route history, and layout wrapper.
  - `css/app.css`: Design system adhering strictly to boring, accessible bank styling (< 15 KB, system font, zero gradients, zero shadows).
  - `index.html`: Shell with role switcher banner, header, main view container, and accessibility landmarks.
  - Public pages: PUB-01 to PUB-07.
- **Verification**: S1 test suite testing seed integrity, store reactivity, state machine guards, RBAC denials, and router navigation.

## Slice S2: Executive Case Creation & Borrower Invitation (EXE-02 to EXE-06)
- **Components**:
  - `js/portals/executive.js`:
    - EXE-01: Executive dashboard showing assigned hospital cases and queues.
    - EXE-02/03/04/05: New Case Wizard (Hospital/Branch selector, Patient & Borrower details with separate identities, Hospital Funding Need with demand validation, Duplicate detection check, Case Review and FRID generation).
    - EXE-06: Invitation screen with locally generated QR code, deep link, resend/revoke, and expiry display.
- **Verification**: AT-01, AT-05, and wizard boundary tests.

## Slice S3: Borrower Case Linking, Consent & KYC Handoff (BOR-01 to BOR-07)
- **Components**:
  - `js/portals/borrower.js`:
    - BOR-01: Welcome / Sign-in.
    - BOR-02: Link Case gate (FRID + one-time token verification, 5-attempt rate limiter, anti-enumeration, guidance for unlinked users).
    - BOR-03: Linked Case Overview.
    - BOR-04: My Applications view.
    - BOR-05: Complete Application (lender fields, income, employment).
    - BOR-06: Granular purpose-specific consent gate (declining stops submission).
    - BOR-07: KYC handoff mock screen (labeled as regulated lender sandbox).
- **Verification**: AT-02, AT-03, AT-04, AT-06, and borrower linking tests.

## Slice S4: Lender Sandbox & Decision Workflows
- **Components**:
  - `js/lender-mock.js`: Adapter communicating with store; events and webhook simulator.
  - `js/portals/sandbox.js`: Route `#/sandbox/lender` labeled "LENDER SANDBOX (not part of the LSP product)".
  - Controls: Acknowledge application, request information, approve sanction, reject sanction, lower sanction amount, simulate timeout.
- **Verification**: AT-07, AT-09, AT-08, lender decision state machine tests.

## Slice S5: Offers, KFS, Agreement, Disbursement & Hospital Receipt
- **Components**:
  - `BOR-08`: Objective, unranked lender offer comparison with KFS link.
  - `BOR-09`: KFS and loan agreement review and acceptance.
  - `EXE-10`: Disbursement tracker (sourced from lender).
  - `BOR-11`: Disbursement timeline.
  - `HOS-07`: Hospital receipt confirmation screen with credit details and mismatch flag.
  - `BOR-12`: Loan information view with authoritative "as of" timestamp.
- **Verification**: AT-08, AT-13, J1 happy path end-to-end.

## Slice S6: Additional Demands & Single vs Multi-Drawdown Facility
- **Components**:
  - `EXE-09`: Subsequent payment demand entry.
  - `HOS-05`: Hospital demand submission and verification.
  - `BOR-10`: Explicit borrower drawdown authorization screen.
  - Facility check: Lender A rejects additional drawdown and guides to new application; Lender B processes multi-drawdown.
- **Verification**: AT-10, AT-11, AT-12, J2 multi-demand journey, J11 single-disbursement rejection.

## Slice S7: Exception Handling & Operational Workbenches
- **Components**:
  - `OPS-04`: Exception workbench for disbursement failure, reversal, receipt mismatch.
  - `OPS-07`: Daily reconciliation workbench with planted mismatches.
  - `ADM-05`: Hospital beneficiary account management with maker-checker dual approval.
  - `ADM-10`: Exception audit and resolution tracking with mandatory evidence attachment.
  - Webhook deduplication and idempotency verification.
- **Verification**: AT-13, AT-14, AT-18, AT-25, AT-28, J12, J13, J14.

## Slice S8: Admin, Compliance, Support & Feature Flags
- **Components**:
  - `ADM-01`, `ADM-02`, `ADM-06`, `ADM-07`, `ADM-09`, `ADM-13`: Admin portals.
  - `CMP-01`, `CMP-03`, `CMP-05`: Compliance consent audit, access audit, breach incident register.
  - `SUP-01`, `SUP-02`: Support ticket queue and detail with masked data.
  - `BOR-15`: Help & grievance tracking.
  - `BOR-16`: Privacy centre (consent history, consent withdrawal).
  - Feature flag: Personal Expense Journal (`BOR-13`) default OFF; completely inaccessible when OFF, strictly borrower-only when ON.
  - `EXE-13`: Case closure with clear disclosure that lender loan remains open.
- **Verification**: AT-15, AT-16, AT-17, AT-21, AT-22, AT-23, AT-24, AT-26, AT-27, AT-29, AT-30.

## Slice S9: Hardening, Performance, Accessibility & Regression
- **Components**:
  - Design lint test (zero "Paid", zero emojis, zero gradients, zero shadows, system fonts).
  - Accessibility audit with axe-core on all portals (0 violations).
  - Bundle size check (< 100 KB total).
  - Responsive sweep at 360px, 768px, 1280px.
  - Triple full regression run from clean state.
  - Documentation generation: `DEMO_SCRIPT.md`, `FINAL_REPORT.md`, screenshots.

