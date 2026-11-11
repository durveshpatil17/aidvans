# Healthcare Financing LSP — Interactive Prototype Demo Script (DEMO_SCRIPT.md)

Follow this clickable, step-by-step walkthrough to experience the end-to-end functionality of the Healthcare Financing Lending Service Platform (LSP) in under 10 minutes.

---

## Prerequisites & Setup
1. Ensure the static prototype server is running at `http://localhost:3000/`.
2. Open Google Chrome or any modern browser and navigate to `http://localhost:3000/#/`.
3. To experience the full web application login flow, navigate to `http://localhost:3000/#/login` or click **Sign In Portal** / **Access Workspace** from any page.
4. You can also use the top Staging Sandbox utility bar to switch personas or click **Reset Data** at any time.

---

## Part 0: Enterprise Auth Portal & Workspace Switching (Under 1 Minute)
1. Navigate to `http://localhost:3000/#/login` (Auth Portal: `AUTH-01`).
2. Notice the two authentication tabs: **Hospital & Staff Workspace (SSO)** and **Borrower & Patient Access**.
3. Under Staff Workspace, view the verified persona cards tailored to each RBAC role:
   - **Priya Sharma** (Executive Desk at Sahyadri Care Hospital)
   - **Sunita Patil** (Hospital Finance & Billing at Sahyadri Care Hospital)
   - **Vikram Malhotra** (Central Operations Manager)
   - **Aditi Joshi** (Platform Administrator)
   - **Rohan Sen** (Compliance & Internal Auditor)
   - **Neha Kulkarni** (Customer Support Agent)
4. Click **Access Workspace** on **Priya Sharma**.
5. Observe the web application header instantly morphing to display Executive Desk navigation (`Cases & Pipeline`, `+ New Case`, `Disbursements`) and the authenticated profile chip with Priya's initials, name, and role.
6. Click **Sign Out** on the top right. You are immediately logged out, the active session is revoked, and you are redirected to `#/login`.

---

## Part 1: Full Happy Path End-to-End Walkthrough (Under 6 Minutes)

### Step 1: LSP Executive Case Origination (EXE-01, EXE-02, EXE-06)
1. On `#/login`, click **Access Workspace** on **Priya Sharma (LSP Executive)**.
2. The browser automatically navigates to `#/executive/dashboard`. View active cases and operational summary metrics.
3. Click **+ Create New Financing Case**.
4. **Step 1 (Patient Demographics)**: Select hospital `Sahyadri Super Speciality Hospital` and branch `Deccan Gymkhana`. Enter Patient Name: `Rahul Kumar`, Hospital Admission Ref: `ADM-DEMO-991`, Phone: `+91 98000 00055`, Age: `34`.
5. **Step 2 (Borrower Verification)**: Check `Patient is primary borrower`. The borrower fields auto-populate.
6. **Step 3 (First Payment Demand)**: Select procedure `Orthopedic Knee Reconstruction`, enter estimated demand: `₹1,25,000`. Select invoice document.
7. **Step 4 (Review & Generate FRID)**: Review details. Verify duplicate admission check passes. Click **Generate Case & FRID**.
8. **Step 5 (Case Created & Invitation)**: View generated Financing Reference ID (FRID: `HF-XXXX-XXXX`) and one-time invitation token. View generated scannable QR code and secure link.
9. Click **Send Invitation SMS**. Case status transitions to `INVITATION_SENT`. Copy the raw invitation token or click **Open Borrower Link**.

---

### Step 2: Borrower Mobile Web Journey & Consent Gate (BOR-01 to BOR-07)
1. Switch role to **B1: Rahul Kumar (Borrower)**. Set browser width to mobile (360px wide) or view in desktop responsive mode.
2. Navigate to `#/borrower/link`. Enter the FRID and the one-time token.
3. Click **Link Financing Case**. Rate limiting guard verifies attempt (5-try lockout). Case successfully links.
4. Navigate to `#/borrower/consent` (**Unbundled Consent Gate: BOR-06**).
5. Inspect the purpose-specific checkboxes:
   - Purpose 1: Regulated Credit Evaluation (NBFC sharing).
   - Purpose 2: Direct Hospital Billing Verification.
   - Purpose 3: Statutory & Audit Retention.
6. Check all consents and click **Confirm Purpose-Specific Consent**. Decisions are immutably logged in the consent audit trail.
7. Navigate to `#/borrower/application` (**BOR-05**). Enter Monthly Income: `₹85,000`, Salaried, obligations: `₹0`.
8. Click **Submit to Regulated Lenders**. The screen transitions to **Lender KYC Handoff (BOR-07)**, visibly indicating redirect to the regulated NBFC sandbox.

---

### Step 3: Lender NBFC Underwriting in Sandbox Panel (Sandbox Route)
1. Switch to any staff role or navigate to `#/sandbox/lender`.
2. Notice the persistent warning banner: `LENDER SANDBOX (not part of the LSP product)`.
3. Under **Section 1: Underwriting Decision Controls**, locate application `APP-1001` or newly submitted application.
4. Click **Approve Sanction**.
5. The regulated NBFC generates approved sanction terms: `₹1,25,000`, 13.5% APR, 12 months tenure, and generates standard Key Fact Statement (KFS). Case transitions to `SANCTIONED`.

---

### Step 4: Borrower Offer Comparison & Agreement Execution (BOR-08, BOR-09)
1. Switch back to **B1: Rahul Kumar (Borrower)** and navigate to `#/borrower/offers`.
2. Inspect the **Objective Lender Offers Table**: unbiased, non-ranked display with KFS links and total cost of credit.
3. Click **Review Terms & KFS** for the sanctioned offer.
4. Review the standardized KFS table: Net Disbursed Amount, Processing Fee, Interest Amount, Repayment Schedule, and "as of" timestamp.
5. Click **Accept Loan Agreement & Execute via Lender Endpoint**. Case transitions to `DISBURSEMENT_PENDING`.

---

### Step 5: Direct NBFC Disbursement to Verified Hospital Beneficiary (Sandbox)
1. Navigate to `#/sandbox/lender`.
2. Under **Section 2: Funds Transfer / Disbursement Simulator**, locate the case.
3. Click **Confirm Transfer for HF-XXXX-XXXX**.
4. The NBFC mock executes direct NEFT/RTGS transfer to the verified hospital beneficiary account (State Bank of India / HDFC Bank). A valid UTR is generated (`UTR-XXXXXX`). Case transitions to `DISBURSED`.
5. The platform automatically creates a Hospital Receipt record in status `AWAITING_HOSPITAL`.

---

### Step 6: Hospital Finance Desk Receipt Confirmation (HOS-02, HOS-07)
1. Switch role to **Sunita Patil (Hospital 1 Finance)**.
2. The dashboard (`#/hospital/dashboard`) displays the new disbursement.
3. Navigate to `#/hospital/receipts`.
4. Locate the pending receipt matching UTR and expected amount `₹1,25,000`.
5. Click **Confirm Receipt**. Enter matching received amount: `125000`. Click **Confirm Credit to Bank Account**.
6. The receipt status immediately transitions to `CONFIRMED`.
7. **Notice: The word "Paid" is strictly absent across all screens**. The six lifecycle events are maintained separately: Demand submitted -> Borrower authorised -> Sent to lender -> Lender approved -> Lender confirmed transfer -> Hospital confirmed receipt.

---

### Step 7: LSP Case Closure without Closing Lender Loan (EXE-13)
1. Switch role to **Priya Sharma (LSP Executive)**.
2. Navigate to `#/executive/cases/CASE-1001/close`.
3. Select closure reason: `TREATMENT_COMPLETE_DISCHARGED`. Enter discharge summary notes.
4. Click **Confirm LSP Facilitation Closure**.
5. Observe the statutory notice: `LSP Facilitation Closed. The underlying loan contract with the regulated lender remains active until full borrower repayment.`

---

## Part 2: Key Exceptions Walkthrough (Under 4 Minutes)

### Exception 1: Multi-Drawdown Tranche vs Single Disbursement Rejection (AT-10, AT-11, J2, J11)
1. **Single Disbursement Product**: With CASE-1001 funded under single-disbursement Product A, log in as Executive (`USR-PRIYA`) and navigate to `#/executive/cases/CASE-1001/demand`.
2. Notice the warning banner: `Single Disbursement Loan — Further Tranches Restricted. This case loan product does not support multiple drawdowns.` The button to create subsequent demands is disabled and guides the borrower to originate a separate application.
3. **Multi-Drawdown Product**: Open CASE-1002 (Product B multi-drawdown facility). Executive adds subsequent Demand 2 (`₹75,000`).
4. Switch to Borrower (`BOR-B2`), navigate to `#/borrower/overview`. Locate Pending Drawdown Request 2.
5. Click **Authorise Drawdown**. Borrower explicitly authorises tranche.
6. Open `#/sandbox/lender` under **3. Drawdown Requests**. Click **Approve Drawdown**. Drawdown status updates to `APPROVED` with individual UTR ref.

---

### Exception 2: Maker-Checker Dual Authorization for Hospital Bank Details (AT-18, J13)
1. Switch role to **Anand Verma (Hospital 2 Desk)** and navigate to `#/hospital/beneficiary`.
2. Under "Request Bank Account Change", enter New Bank: `Axis Bank`, IFSC: `UTIB0000123`, Account: `918020012345678`.
3. Click **Submit Change for Dual Approval**.
4. Observe the request is held in status `PENDING_MAKER_CHECKER_APPROVAL`. It cannot be used for disbursements.
5. Switch role to **Aditi Joshi (Platform Admin)** and navigate to `#/admin/hospitals`.
6. Inspect the pending dual-approval queue. Click **Dual Approve** (or **Reject**).
7. Notice the account becomes verified only after platform admin dual approval, and previous verified accounts remain safeguarded against unauthorized redirection.

---

### Exception 3: Daily Reconciliation Mismatch & Evidence Resolution (AT-25, J14)
1. Switch role to **Vikram Malhotra (Ops Manager)** and navigate to `#/ops/reconciliation`.
2. Click **Plant Test Discrepancy (J14)**.
3. Observe the daily 3-way matching table immediately flags an `UNRECONCILED / MISMATCH` item.
4. Navigate to `#/ops/exceptions` (Exception Workbench).
5. Locate the planted mismatch receipt.
6. Assign Ops Owner (`Vikram Malhotra`) and enter required Bank Statement UTR Evidence: `SBI Statement scroll #48921 confirmed UTR credited`.
7. Click **Resolve with Evidence**.
8. Notice the exception resolves to `CONFIRMED` and the resolution evidence is permanently committed to the append-only audit trail.

---

### Security & Compliance Highlights
- **Tenant Isolation (AT-15)**: Log in as Hospital 2 staff (`USR-ANAND`) and attempt to access Hospital 1's case URL `#/hospital/cases/CASE-1001`. Access is blocked with an `Access Denied (403)` screen and logged.
- **Privacy Barrier (AT-16)**: Hospital screens display only patient admission refs and disbursement UTRs; borrower personal KYC, PAN, Aadhaar, bureau score, and KFS archive are strictly hidden.
- **No Staff OTP Entry (AT-17)**: Executive screens have zero OTP fields. Borrower authorisation occurs exclusively in the borrower's own session.
- **Staff Deactivation (AT-24)**: Admin deactivates a staff member (`USR-PRIYA`). Session is immediately revoked, while historical cases originated by that executive remain immutable.
- **Security Breach Simulation (AT-30)**: Auditor (`USR-ROHAN`) opens `#/compliance/incidents` and triggers breach simulation. Containment actions and regulatory notification assessments are logged.

