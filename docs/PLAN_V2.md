# V2 Engineering & Testing Plan (PLAN_V2.md)

This plan governs the systematic transformation of the Aidvans Healthcare Financing LSP from prototype to production architecture. Slices are executed strictly in order, with automated tests passing 100% at each step before moving forward.

---

## Slice Breakdown

### Slice 1: V1 Foundation & Architecture Core
- **Objectives**:
  - Restructure project folders: `/server`, `/server/adapters`, `/shared`, `/public`, `/lender-sandbox`, `/data`, `/tests`.
  - Pure Node.js HTTP server (`server.js`) with resilient port auto-discovery (`PORT` and `LENDER_PORT`).
  - Atomic JSON database persistence in `data/db.json` with seed fallback to `data/seed.json` and `npm run reset`.
  - Canonical shared domain logic in `/shared`:
    - `states.js`: Strict state machine definitions and transition validator.
    - `money.js`: Indian currency formatter, number-to-words generator, and safe decimal arithmetic.
    - `validators.js`: Schema validation rules for applications, demands, and beneficiary accounts.
    - `ids.js`: Check-digit protected reference ID generators (CASE, DEM, FREQ, APP, SAN, DRAW, DISB, LOAN, RCPT, EXC, TKT).
    - `permissions.js`: Unified RBAC/ABAC capability matrix.
  - BFF HTTP router with standard error envelopes, correlation IDs, idempotency store, and optimistic concurrency (`If-Match` / `version`).
  - Server-Sent Events (SSE) event hub at `/api/v1/events`.
  - Complete OpenAPI 3.0 specification (`/docs/API_CONTRACT.openapi.yaml`).
  - Design system tokens and reusable component library (`DataTable`, `MultiStepForm`, `Timeline`, `ModalDialog`, `Toast`, `PrintDocument`).
  - Static file server with SPA history fallback, gzip compression, and security headers (CSP, nosniff, framing protection).
- **Verification Gates**:
  - `tests/api/foundation.spec.js`: Auto-port binding, API envelope format, correlation ID reflection, idempotency replay, version conflict (409), OpenAPI route compliance, security headers.

---

### Slice 2: V2 Authentication, RBAC & Demo Console
- **Objectives**:
  - Dedicated login pages per workspace:
    - `/executive/login`, `/hospital/login`, `/ops/login`, `/admin/login`, `/compliance/login`, `/support/login`, `/borrower/login`.
  - Workforce authentication:
    - User ID + password (hashed with `scrypt` and per-user salt).
    - Native TOTP MFA (RFC 6238 via Node `crypto`).
    - Password change on first login, account lockout after 5 failed attempts (15 min lock), forgot password workflow with email outbox token.
    - Account profile page: active session inspection, session revocation, sign out everywhere.
  - Borrower authentication:
    - Mobile number + SMS OTP with anti-enumeration defense.
    - Step-up OTP verification for financial authorization and agreement execution.
  - Session management:
    - HttpOnly, SameSite=Lax session cookies isolated per workspace.
    - Idle session timeout (15 min staff, 10 min borrower) with 60-second warning modal.
    - Server-side RBAC/ABAC enforcement: direct URL access to unauthorized workspace renders clean permission-denied page and logs audit event.
  - Demo Console (`/demo`):
    - Gated strictly by `DEMO_MODE=1` (returns 404 when `DEMO_MODE=0`).
    - Credentials table with refreshing TOTP codes, simulated SMS/Email outboxes, simulated clock advance, latency controls, and failure injection toggles.
- **Verification Gates**:
  - `tests/api/auth.spec.js` & `tests/e2e/auth.spec.js`: Dedicated login flows, MFA verification, account lockout, forgot password, borrower SMS OTP, idle warning, cross-workspace denial, demo console access gating.

---

### Slice 3: V3 Regulated Lender Integration Layer
- **Objectives**:
  - Canonical adapter contract in `/server/adapters`:
    - `capabilities()`, `validateApplication()`, `submitApplication()`, `getApplicationStatus()`, `getOffers()`, `fetchKfs()`, `createAuthorisationContext()`, `submitDrawdown()`, `getDisbursementStatus()`, `getLoanSnapshot()`, `verifyWebhook()`, `normalizeWebhook()`.
  - Implement `/server/adapters/_template.js` with full documentation and field mapping tables.
  - Capability registry (`registry.js`) enforcing product version features.
  - Standalone Lender Sandbox server (`lender-sandbox/server.js`) running on dedicated origin (port 3001).
  - Lender A adapter: Single upfront disbursement, `redirect` journey mode for KYC and e-sign.
  - Lender B adapter: Multi-drawdown facility, `iframe` journey mode with postMessage validation and automated redirect fallback on framing failure.
  - Webhook ingestion: `POST /webhooks/lender/:lenderCode` with HMAC-SHA256 signature verification, dual key rotation, timestamp tolerance, and inbox deduplication.
  - Admin Lender Management pages: product configuration, capability toggles, journey mode selection, masked key metadata.
  - Documentation: `/docs/LENDER_INTEGRATION_GUIDE.md`.
- **Verification Gates**:
  - `tests/api/lender-adapters.spec.js`: Capability validation, webhook HMAC verification, dual-key rotation, out-of-order webhook handling, duplicate rejection, iframe postMessage verification.

---

### Slice 4: V4 Executive Desk Workspace (`/executive`)
- **Objectives**:
  - Executive shell: left nav, top bar with hospital branch context, user menu, breadcrumbs.
  - Dashboard: operational work queues (cases needing action, expiring invitations, lender exceptions, SLA queues).
  - Cases List: tabs (Active, Awaiting borrower, With lender, Disbursing, Closed) with server-side filter, search, sort, pagination.
  - New Case Wizard: multi-step form with draft auto-save, patient vs borrower separation, duplicate admission check, FRID generation, and printable case slip.
  - Invitation Page: scannable inline QR code, one-time token, SMS delivery trigger, token revocation on resend.
  - Objective Offer Assistance View: unbiased offer cards with standardized KFS links (zero ranking/steering).
  - Case Detail: tabs (Summary, Timeline, Parties, Documents, Financials, Activity).
  - Case Closure: formal closure workflow displaying explicit "underlying lender loan unaffected" statutory notice.
- **Verification Gates**:
  - `tests/e2e/executive.spec.js`: Executive case creation, FRID generation, invitation delivery, draft persistence, case closure notice.

---

### Slice 5: V5 Borrower Mobile Web Journey (`/borrower`)
- **Objectives**:
  - 360px mobile-first responsive layout (centered single column on tablet, dual-column on desktop).
  - Entry: Welcome screen with FRID entry desk or QR code scanner; visit-desk guidance if no FRID.
  - Case Linking: FRID + token verification with 5-attempt rate limiter and generic error responses.
  - Unbundled Consent Centre: separate non-bundled checkboxes for credit evaluation, billing verification, and statutory retention.
  - Application Form: profile, employment, income, documents with draft saving (`api` mode).
  - KYC Step: support `redirect` and `iframe` modes (with sandboxing, CSP, postMessage origin checks, and timeout fallback).
  - Offer Comparison: objective terms, lender-supplied APR/EMI with "as of" timestamp, KFS modal.
  - Agreement Execution: lender e-sign handoff with step-up OTP.
  - Patient Viewer: restricted view showing clinical reference but zero loan, KFS, income, or EMI data.
  - Privacy Centre: consent history and granular consent withdrawal.
- **Verification Gates**:
  - `tests/e2e/borrower.spec.js`: FRID linking, rate limiting, unbundled consent, KYC handoff (redirect & iframe), offer review, agreement execution, patient data isolation.

---

### Slice 6: V6 End-to-End Money Flows & Transactions
- **Objectives**:
  - Strict tracking of the 6 independent financial lifecycle events across all views.
  - Single-Disbursement Flow (Lender A): rejection of subsequent drawdowns with guidance to apply afresh.
  - Multi-Drawdown Facility (Lender B): additional hospital demands, funding requests, and mandatory per-drawdown borrower step-up authorization.
  - Demand Amendment: superseding demand records with immutable historical audit trail.
  - Real Transaction States: review screens, spinner processing states, idempotency safety, Indian currency formatting (`₹1,25,000`), amounts in words on receipts.
  - Live SSE Status Updates: automatic page refresh upon webhook delivery.
  - Exception & Failure Handling: transfer reversals (`REV-XXXX`), timeout/pending states ("awaiting lender response"), discrepancy workbench.
  - Printable Documents: Demand acknowledgement, Funding authorization receipt, Disbursement advice, Hospital receipt, Lender KFS.
- **Verification Gates**:
  - `tests/e2e/money-flows.spec.js`: End-to-end happy path, multi-drawdown flow, reversal handling, timeout handling, printable receipts.

---

### Slice 7: V7 Hospital Portal Workspace (`/hospital`)
- **Objectives**:
  - Hospital shell: organization context, branch switcher (within tenant), billing navigation.
  - Dashboard: open demands, awaiting receipt confirmation, discrepancies, today's admissions.
  - Case Lookup: lookup by FRID or hospital reference with strict data masking (zero bureau/KYC/KFS access).
  - Demand Submission: new demand creation with clinical invoice attachment.
  - Disbursement Receipts: receipt confirmation against lender transfer UTR or flagging mismatch.
  - Beneficiary Account Management: view verified accounts; submit change request (Maker step).
  - Strict ABAC Isolation: cross-hospital access attempts denied with 403 and audited.
- **Verification Gates**:
  - `tests/e2e/hospital.spec.js`: Demand submission, receipt confirmation, mismatch reporting, maker-checker bank change request, tenant isolation.

---

### Slice 8: V8 Operations & Admin Workspaces (`/ops`, `/admin`)
- **Objectives**:
  - Operations Workspace (`/ops`):
    - SLA dashboard with breach indicators.
    - Exception Workbench: discrepancy assignment, mandatory bank evidence attachment, resolution workflow.
    - Daily 3-Way Reconciliation: lender transfers vs hospital receipts vs LSP records.
    - Integration Health Monitor: webhook delivery stats, retry queue, adapter uptime.
  - Admin Workspace (`/admin`):
    - User Directory: invite staff, role assignment, lockout unlock, account deactivation.
    - Beneficiary Account Dual Approval (Checker step).
    - Lender & Product Configuration: capability registry, journey modes, webhook key rotation.
    - Feature Flags: expense journal flag (strictly OFF by default).
    - Immutable Audit Log: actor, role, action, target, timestamp, reason; search and export with approval.
    - Security Breach Simulator: incident register and notification assessment.
- **Verification Gates**:
  - `tests/e2e/ops-admin.spec.js`: Exception resolution with evidence, daily reconciliation, maker-checker dual approval, user lifecycle, audit trail immutability.

---

### Slice 9: V9 Compliance, Support, Public Pages & Notifications
- **Objectives**:
  - Compliance Workspace (`/compliance`): read-only consent ledger, access audits, statutory retention reports.
  - Support Workspace (`/support`): customer ticket queue, masked case lookup, grievance routing to lender.
  - Public Pages: `/`, `/how-it-works`, `/privacy`, `/grievance`, `/status`, and dedicated HTTP error pages (401, 403, 404, 409, 429, 500).
  - Notification Centre: in-app notifications and simulated outbox dispatches (SMS/Email).
- **Verification Gates**:
  - `tests/e2e/compliance-support-public.spec.js`: Compliance audits, support ticketing, public pages, error page rendering.

---

### Slice 10: V10 Hardening, Security, Performance & Product-Feel
- **Objectives**:
  - Security Header Audit: CSP (`default-src 'self'`), framing protection, `X-Content-Type-Options: nosniff`.
  - Performance & Bundle Budgets: gzipped login pages < 40 KB, workspaces < 100 KB; Lighthouse Performance >= 95.
  - Accessibility (a11y): axe-core zero violations; full keyboard navigation.
  - Design Lint: zero "Paid", zero emojis, zero gradients, zero shadows, zero inline styles, zero `console.log` in `/public`.
  - Adversarial Testing: double clicks, replayed idempotency keys, expired sessions, forged webhooks, injection attacks.
  - Persona Journeys J1 to J23 and Acceptance Tests AT-01 to AT-30.
  - Score `/docs/PRODUCT_FEEL_RUBRIC.md`.
  - Final documentation: `/docs/LENDER_INTEGRATION_GUIDE.md`, `/docs/API_CONTRACT.openapi.yaml`, `/docs/DESIGN_SYSTEM.md`, `/docs/DEMO_SCRIPT_V2.md`, `/docs/FINAL_REPORT_V2.md`.
- **Verification Gates**:
  - `tests/perf/lighthouse.spec.js`, `tests/a11y/axe.spec.js`, `tests/lint/design-lint.spec.js`, full regression runs.

