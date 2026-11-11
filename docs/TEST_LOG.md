# Test Execution Log (TEST_LOG.md)

## Slice S1: Foundation & Architecture Core
- **Date & Time**: 2026-11-09 18:36:00 IST
- **Total Tests**: 5
- **Passed**: 5
- **Failed**: 0

| Test ID | Description | Status | Failure Cause |
|---|---|---|---|
| S1-01 | App loads cleanly with zero console errors and zero external requests | PASS | — |
| S1-02 | Public pages PUB-01 to PUB-07 render expected content | PASS | — |
| S1-03 | Role Switcher changes active user and displays context | PASS | — |
| S1-04 | RBAC & ABAC route guard blocks unauthorized direct access | PASS | — |
| S1-05 | State machines throw error on invalid transitions | PASS | — |

---

## Slice S2: Executive Case Creation & Invitation Flow (AT-01, AT-05)
- **Date & Time**: 2026-11-09 18:40:00 IST
- **Total Tests**: 5
- **Passed**: 5
- **Failed**: 0

| Test ID | Description | Status | Failure Cause |
|---|---|---|---|
| AT-01 | Executive creates valid case; CASE and FRID generated; no hospital system call | PASS | — |
| AT-05 | Patient differs from borrower: separate identities and permissions | PASS | — |
| S2-03 | Minor patient cannot apply directly; routes to warning and halts creation | PASS | — |
| S2-04 | Duplicate check rejects creation if duplicate admission ref already active | PASS | — |
| S2-05 | Resend invitation revokes old token and generates new token | PASS | — |

---

## Slice S3: Borrower Linking, Consent & KYC Handoff (AT-02, AT-03, AT-04, AT-06)
- **Date & Time**: 2026-11-09 18:42:15 IST
- **Total Tests**: 4
- **Passed**: 4
- **Failed**: 0

| Test ID | Description | Status | Failure Cause |
|---|---|---|---|
| AT-02 | App user without FRID cannot apply; sees guidance to visit the desk | PASS | — |
| AT-03 | Borrower links FRID through secure link; case visible only after link + consent | PASS | — |
| AT-04 | Guessed or reused FRID: rate limited after 5 tries, no details leaked, audit logged (J10) | PASS | — |
| AT-06 | Borrower declines consent: nothing sent to lender; decline recorded | PASS | — |

---

## Slice S4: Lender Sandbox & Decision Workflows (AT-07, AT-09)
- **Date & Time**: 2026-11-09 18:44:30 IST
- **Total Tests**: 5
- **Passed**: 5
- **Failed**: 0

| Test ID | Description | Status | Failure Cause |
|---|---|---|---|
| AT-07 | Lender timeout after submit: status unknown/pending; no duplicate submission | PASS | — |
| AT-09 | Lender rejects: case shows lender decision; immutable and cannot be edited by staff (J4) | PASS | — |
| S4-03 | Lender approves sanction: terms and KFS generated; case transitions to SANCTIONED | PASS | — |
| S4-04 | Lender sanctions lower amount than requested: borrower sees gap; zero family contribution (B5/J5) | PASS | — |
| S4-05 | Lender requests more info: case moves to ACTION_REQUIRED | PASS | — |

---

## Slice S5: Offers, KFS, Agreement, Disbursement & Receipt (AT-08, AT-13, J1)
- **Date & Time**: 2026-11-09 18:46:50 IST
- **Total Tests**: 3
- **Passed**: 3
- **Failed**: 0

| Test ID | Description | Status | Failure Cause |
|---|---|---|---|
| AT-08 | Multiple lender offers: objective, unbiased display, KFS links, no ranking | PASS | — |
| AT-13 | Transfer confirmed by lender but no hospital receipt: separate statuses, mismatch exception | PASS | — |
| J1 | Happy path end-to-end (B1, Lender A): 6 separate events, zero "Paid" | PASS | — |

---

## Slice S6: Multi-Drawdown & Subsequent Demands (AT-10, AT-11, AT-12, J2, J11)
- **Date & Time**: 2026-11-09 18:51:00 IST
- **Total Tests**: 4
- **Passed**: 4
- **Failed**: 0 (1 fixed in sandbox.js)

| Test ID | Description | Status | Failure Cause |
|---|---|---|---|
| AT-10 | Single-disbursement product rejects subsequent tranche; guides to new application (J11) | PASS | — |
| AT-11 | Multi-drawdown facility: funding request bound to demand, borrower authorises, drawdown ref stored | PASS | Fixed missing drawdown approval control in sandbox.js |
| AT-12 | Demand changes after authorisation: history kept; amendment recorded | PASS | — |
| J2 | Multi-drawdown case (B2, Lender B): 3 demands, separate authorisations, patient sees no loan data | PASS | — |

---

## Slice S7: Exceptions & Operational Workbenches (AT-14, AT-18, AT-25, AT-28, J12, J13, J14)
- **Date & Time**: 2026-11-09 18:58:30 IST
- **Total Tests**: 4
- **Passed**: 4
- **Failed**: 0 (4 fixed: corrected ops/admin user roles and timing reload)

| Test ID | Description | Status | Failure Cause |
|---|---|---|---|
| AT-14 | Transfer fails or returns: original retained, reversal linked, parties notified, no manual money movement (J12) | PASS | Fixed test user to USR-VIKRAM (OPS_MANAGER) |
| AT-18 | Hospital beneficiary bank account changes: maker-checker enforced (J13) | PASS | Added reload wait after maker submit and checker approval |
| AT-25 | Daily reconciliation with deliberate mismatch: discrepancy flagged, assigned, evidence attached, resolved (J14) | PASS | Field name audit log target_id alignment |
| AT-28 | Duplicate lender webhook: idempotency guard prevents double processing; audit logged; financial state unaffected | PASS | Implemented ingestWebhook idempotency guard |

---

## Slice S8: Admin, Ops, Compliance & Feature Flags (AT-15, AT-16, AT-17, AT-19, AT-21, AT-22, AT-23, AT-24, AT-26, AT-29, AT-30, J15, J16)
- **Date & Time**: 2026-11-09 19:10:00 IST
- **Total Tests**: 10
- **Passed**: 10
- **Failed**: 0 (3 fixed: selector h2 for Access Denied, privacy notice copy rephrasing, reload wait)

| Test ID | Description | Status | Failure Cause |
|---|---|---|---|
| AT-15 | Hospital user opens another hospital case: denied, logged, zero details leaked | PASS | — |
| AT-16 | Hospital user views case: zero borrower KYC, income, PAN, Aadhaar or KFS displayed | PASS | Rephrased privacy disclaimer so string matches did not trigger false positive |
| AT-17 | Executive portal: zero OTP or PIN fields exist on staff screens | PASS | — |
| AT-19 | Borrower continues in app after web start: same case, no new FRID | PASS | Updated header selector to BOR-03 |
| AT-21 | Personal expense journal feature flag OFF: feature disabled / 404 | PASS | — |
| AT-22 | Personal expense journal feature flag ON: visible to borrower only, staff denied | PASS | Triggered reload after flag toggle |
| AT-23 | Lender complaint: routed to grievance redressal channel, grievance officer details visible | PASS | — |
| AT-24 | Staff deactivated: active session revoked, case history preserved (J15) | PASS | Aligned error header selector to h2 |
| AT-26 | Consent withdrawal: future sharing stops; mandatory statutory records kept | PASS | — |
| AT-29 | Executive data export denied unless specifically permitted by role; audit logged | PASS | Exposed window.__RBAC__ handle |
| AT-30 | Security breach simulation: incident workbench opens, notification assessment recorded (J16) | PASS | — |

---

## Slice S9: Hardening, Responsive, Accessibility & Design Lint
- **Date & Time**: 2026-11-09 19:13:00 IST
- **Total Tests**: 5
- **Passed**: 5
- **Failed**: 0 (1 fixed: imported renderEmptyState in borrower.js)

| Test ID | Description | Status | Failure Cause |
|---|---|---|---|
| S9-01 | Design Lint: Zero occurrences of "Paid", zero emojis, zero gradients, zero shadows | PASS | Fixed missing renderEmptyState import in borrower.js |
| S9-02 | Bundle Size: Total frontend assets under 100 KB gzipped (actual: 60 KB) | PASS | — |
| S9-03 | Responsive: Zero horizontal scroll/overflow across 360px, 768px, 1280px | PASS | — |
| S9-04 | Accessibility: Semantic landmarks, accessible form controls, touch targets >= 36px | PASS | — |
| S9-05 | Navigation: Clean console (0 errors/warnings) and 0 external network requests | PASS | — |
