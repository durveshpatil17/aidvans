# Understanding: Healthcare Financing LSP Functional Prototype

## 1. Executive Summary & Boundaries
The Healthcare Financing Lending Service Platform (LSP) facilitates hospital-based medical financing in India without acting as a lender, without making credit decisions, and without ever touching or holding borrower or lender funds. It bridges the hospital payment requirement, an assisted executive desk, a borrower mobile web journey, a central orchestration platform, and regulated NBFC partners.

## 2. Six Swimlanes (from Mermaid Architecture Diagram)
1. **Hospital**:
   - Identifies patient payment requirement; explains financing option; refers to LSP desk.
   - Submits and verifies treatment payment demands (advance, pre-procedure, interim, final).
   - Maintains verified beneficiary bank account details (maker-checker controlled).
   - Receives funds transferred directly from the regulated NBFC.
   - Independently confirms receipt or reports mismatch; completes final hospital billing reconciliation.
2. **LSP Executive Desk**:
   - Authenticates and operates within assigned hospital and branch scope.
   - Captures patient and borrower identities separately; creates financing case.
   - Generates unique immutable Financing Reference ID (FRID) and one-time invitation token (QR code / secure link).
   - Assists borrower with application and documentation; monitors status and operational queues.
   - Captures subsequent hospital demands against existing FRID.
3. **Borrower (Mobile Web - 360px First)**:
   - Links to case using valid FRID and secure invitation token (no standalone origination).
   - Reviews purpose-specific consent notices and affirmative declarations.
   - Completes loan application; hands off to regulated lender mock for KYC.
   - Reviews objective, unranked lender offers; accepts sanction terms and KFS at lender endpoint.
   - Explicitly authorises each subsequent drawdown funding request (under multi-drawdown facilities).
   - Tracks lender-confirmed loan details (with "as of" timestamp) and disbursement timeline.
   - Optional: Personal expense journal (if feature flag enabled; isolated from loan ledger).
   - Submits grievances and queries directly routed to LSP or lender channels.
4. **Central LSP Platform**:
   - Generates immutable FRID (`HF-XXXX-XXXX`) and one-time tokens.
   - Enforces RBAC and ABAC (tenant, branch, assignment, sensitivity scopes).
   - Validates completeness and routes payloads via lender adapter contracts.
   - Maintains strict separation of distinct financial entities: Case, Demand, Funding Request, Application, Sanction, Facility, Drawdown, Disbursement, Receipt.
   - Enforces duplicate checks, idempotency, append-only audit logging, and maker-checker gates.
   - Discloses restricted statuses to authorized portals; closes LSP operational case without closing the lender loan.
5. **Regulated NBFC / Lender**:
   - Receives loan application; performs KYC, credit assessment, and underwriting.
   - Emits authoritative decisions: Sanction (with terms/KFS), Rejection, or Info Request.
   - Manages loan agreement execution and facility/sanction lifecycle.
   - Evaluates drawdown requests (multi-drawdown facility) or rejects unsupported tranches (single-disbursement).
   - Transfers disbursement funds directly to verified hospital beneficiary account.
   - Authoritative source of loan ledger, balance, interest, and EMI schedules.
6. **LSP Admin / Operations**:
   - Provisions organizations, branches, lenders, products, and user roles.
   - Enforces maker-checker workflows on hospital beneficiary bank details.
   - Operations workbench manages exception queues, SLA tracking, and daily reconciliation.
   - Compliance monitors consent audit, access audit, and incident registers.

## 3. Roles and Scopes
- **SUPER_ADMIN**: Emergency tenant and config governance with privileged audit.
- **PLATFORM_ADMIN**: Platform entities, lenders, products, configurations.
- **OPS_MANAGER**: Case allocations, exception workbench, daily reconciliation.
- **EXECUTIVE**: Assigned hospital/branch case creation, demand capture, borrower coordination.
- **HOSPITAL_ADMIN**: Own hospital staff, branch management, dual-control requests.
- **HOSPITAL_FINANCE**: Own hospital/branch demand entry and receipt confirmation.
- **HOSPITAL_REFERRAL**: Least privilege referral entry and basic status view.
- **SUPPORT_AGENT**: Assigned tickets with masked data; temporary case view.
- **COMPLIANCE_AUDITOR**: Read-only access to consent, disclosures, access logs, incidents.
- **BORROWER**: Verified linked case only; application, consent, KFS, drawdown authorization.
- **PATIENT_VIEWER**: Patient summary when patient ≠ borrower; NO loan, KFS, income, or EMI data.

## 4. The Separation of Events (Non-Negotiable)
The lifecycle strictly separates six distinct events; they must NEVER be merged into a single status, and the word **"Paid" is strictly forbidden**:
1. **Demand Submitted**: Hospital/Executive submits payment demand with evidence.
2. **Borrower Authorised**: Borrower affirmatively authorizes exact request and beneficiary.
3. **Sent to Lender**: Funding request dispatched to regulated lender.
4. **Lender Approved**: Lender issues sanction / drawdown approval.
5. **Lender Confirmed Transfer**: Lender confirms fund transfer to hospital beneficiary.
6. **Hospital Confirmed Receipt**: Hospital finance confirms bank credit or flags mismatch.

## 5. Critical Hard Rules
- **No Standalone Origination**: App without valid FRID displays guidance to visit hospital desk.
- **Anti-Enumeration & Rate Limiting**: FRID linking allows max 5 attempts, then 15-minute lock.
- **Patient ≠ Borrower Privacy**: Separate identities. Patient cannot view financial/loan data.
- **Hospital Isolation**: Cross-hospital access denied at data layer and audited. Hospital never views KYC, income, PAN, Aadhaar, bureau, or full KFS archive.
- **No Staff OTP/PIN Entry**: No OTP input field exists on any staff screen.
- **No Family Contribution**: No field, calculation, or split for family contributions.
- **Lender Source of Truth**: Balance and EMI displayed with "as of" timestamp; no live calculation.
- **Single vs Multi-Drawdown**: Single-disbursement (Lender A) rejects additional demands, directing to a new application. Multi-drawdown (Lender B) requires explicit borrower authorization per tranche.
- **Maker-Checker**: Hospital beneficiary bank account changes require dual approval before activation.
- **LSP Case Closure**: Closing LSP case explicitly leaves the active lender loan open.

