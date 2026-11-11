# Healthcare Financing LSP — V2 Interactive Product Demo Script (DEMO_SCRIPT_V2.md)

This walkthrough guides an evaluator, auditor, or engineer through experiencing the end-to-end functionality of the Aidvans Healthcare Financing Lending Service Platform (LSP) V2 in under 15 minutes.

Unlike V1, there are zero role switchers, zero shared shells, zero hash routes, and zero demo helpers in product views. Each actor operates in their own workspace with their own login page, and the regulated NBFC runs on a distinct origin.

---

## 1. Prerequisites & Starting the Applications

1. Ensure Node.js (v18+) is installed.
2. Reset the database to canonical seed data:
   ```bash
   npm run reset
   ```
3. Start the application server (this starts both the Product BFF on port 3000 and the Lender Sandbox on port 3001):
   ```bash
   npm start
   ```
4. Verify the two origins are reachable:
   - **Product BFF & Web App**: `http://localhost:3000/`
   - **Lender Sandbox (Simulated NBFCs)**: `http://localhost:3001/`
   - **Demo Console**: `http://localhost:3000/demo` (accessible only when `DEMO_MODE=1`, which is default in development)

---

## 2. Demo Credentials Quick Reference

All staff workforce accounts use password `Password@123` with live TOTP generated on the Demo Console (`http://localhost:3000/demo`).

| Actor | Workspace URL | User ID | Password | Role / Tenant |
|---|---|---|---|---|
| **LSP Executive** | `http://localhost:3000/executive/login` | `USR-PRIYA` | `Password@123` | LSP Executive Desk (Sahyadri Hospital) |
| **Hospital Billing** | `http://localhost:3000/hospital/login` | `USR-SUNITA` | `Password@123` | Hospital Finance & Billing Manager |
| **Borrower** | `http://localhost:3000/borrower/login` | Mobile: `9876543210` | OTP in Outbox | Primary Borrower (Patient: Rahul Kumar) |
| **Central Ops** | `http://localhost:3000/ops/login` | `USR-VIKRAM` | `Password@123` | Central LSP Operations Manager |
| **Admin** | `http://localhost:3000/admin/login` | `USR-ADITI` | `Password@123` | System Administrator & Checker |
| **Compliance** | `http://localhost:3000/compliance/login` | `USR-ROHAN` | `Password@123` | Legal & Regulatory Compliance Officer |
| **Support** | `http://localhost:3000/support/login` | `USR-NEHA` | `Password@123` | Customer Grievance & Support Agent |

> **Pro Tip**: Keep `http://localhost:3000/demo` open in a second browser tab. It displays live TOTP MFA codes and incoming SMS OTPs in real-time.

---

## 3. Step-by-Step 15-Minute Happy Path Walkthrough

### Part 1: LSP Executive Case Origination (3 minutes)
1. Navigate to `http://localhost:3000/executive/login`.
2. Enter User ID: `USR-PRIYA`, Password: `Password@123`.
3. Check `http://localhost:3000/demo` for the active 6-digit TOTP code for `USR-PRIYA` (or enter standard TOTP from your authenticator).
4. Click **Sign In to Executive Desk**.
5. You are redirected to `/executive`. Notice the hospital branch badge `Sahyadri Care Hospital — Deccan Gymkhana` and the operational work queues.
6. Click **+ New Financing Case**.
7. **Step 1: Patient Details**:
   - Patient Name: `Arun Verma`
   - Age: `42`, Gender: `Male`, Mobile: `9876543210`
   - Hospital Admission Ref: `ADM-2026-9921`
8. **Step 2: Borrower Relationship**:
   - Check `Patient is the primary borrower` (or specify separate family member).
   - Estimated Procedure Cost: `₹1,50,000` (Notice automatic Indian rupee formatting and amount in words: *Rupees One Lakh Fifty Thousand Only*).
9. **Step 3: Review & Generate FRID**:
   - Click **Generate Financing Case**.
   - The platform creates `CASE-XXXX-X` and a Luhn check-digit protected Financing Reference ID: `FRID-XXXX-X`.
   - View the generated scannable QR code and one-time invitation link.
   - Click **Print Case Slip** to preview the clean printable document.
   - Copy the generated `FRID` for the borrower step.
10. Click **Sign Out** from the user menu.

---

### Part 2: Borrower Mobile Web Journey (4 minutes)
1. Open a mobile browser window or toggle Chrome DevTools device mode (set viewport width to 360px).
2. Navigate to `http://localhost:3000/borrower/login`.
3. Enter mobile number: `9876543210`. Click **Send One-Time Password**.
4. Switch to the `http://localhost:3000/demo` tab. Look at the **SMS Outbox**; copy the 6-digit OTP (e.g. `123456`).
5. Enter OTP and click **Verify & Enter Portal**.
6. On the Welcome screen, enter the `FRID` generated in Part 1 (or default seed `FRID-9928-3`). Click **Link Case**.
7. **Unbundled Consent Gate (DPDP Act Compliance)**:
   - Notice the 3 granular, independent checkboxes (none pre-checked):
     - `[x]` Regulated Credit Underwriting (NBFC evaluation)
     - `[x]` Direct Hospital Billing Verification
     - `[x]` Statutory Audit & Regulatory Retention
   - Check all three and click **Confirm Purpose-Specific Consent**.
8. **Application & KYC**:
   - Enter PAN: `ABCDE1234F`, Monthly Income: `₹85,000`, Salaried.
   - Select Preferred Lender: `Lender A` (Direct API / Redirect mode).
   - Click **Submit Application to Regulated Lender**.
9. The application state updates to `UNDERWRITING_PENDING`.

---

### Part 3: Regulated NBFC Sanction & Offer Acceptance (3 minutes)
1. Switch to `http://localhost:3001/` (the standalone Lender Sandbox).
2. Locate the submitted application in the Underwriting Queue.
3. Click **Approve Sanction**.
   - Sanction terms: Loan Amount `₹1,50,000`, APR `12.5%`, Tenure `12 Months`.
   - The sandbox signs an HMAC-SHA256 webhook (`SANCTION_APPROVED`) and posts it to the Product BFF at `/webhooks/lender/lender_a`.
4. Switch back to the Borrower mobile screen (`http://localhost:3000/borrower`).
5. The view automatically reflects the sanction via SSE (or refresh).
6. Click **Review Standard Key Fact Statement (KFS)**.
   - Inspect the standardized RBI-mandated schedule: Net Disbursed Amount, Total Interest, Processing Fees, Monthly EMI.
7. Click **Accept Loan Agreement**.
8. **Step-Up Financial Authorization**:
   - Enter the step-up SMS OTP from the Demo Console outbox.
   - Click **Execute Agreement**. Status transitions to `DISBURSEMENT_PENDING`.

---

### Part 4: Direct Lender-to-Hospital Disbursement & Receipt (3 minutes)
1. Switch to `http://localhost:3001/` (Lender Sandbox).
2. In the **Disbursement Processing** section, view the verified hospital bank beneficiary account (`Sahyadri Hospitals Ltd`, Bank of Baroda).
   > *Note: Money is disbursed directly from NBFC to Hospital account. LSP never touches funds.*
3. Click **Confirm Bank Transfer (Disburse Direct to Hospital)**.
   - Enter UTR: `UTRN202611119901`.
   - The sandbox dispatches a signed webhook `DISBURSEMENT_CONFIRMED`.
4. Navigate to `http://localhost:3000/hospital/login`.
5. Enter User ID: `USR-SUNITA`, Password: `Password@123`, and TOTP from Demo Console.
6. Under **Disbursement Receipts & Reconciliation**, view the unconfirmed transfer `₹1,50,000` with UTR `UTRN202611119901`.
7. Click **Confirm Hospital Bank Receipt**.
   - Enter internal hospital MR/Receipt No: `MR-2026-8812`.
   - Click **Save Receipt Confirmation**.
   - Notice the receipt status changes to `HOSPITAL_CONFIRMED_RECEIPT`.
   - Click **Print Receipt** for documentary evidence.
   - Notice the word "Paid" is strictly absent; all 6 events are tracked independently.

---

### Part 5: Central Operations & Maker-Checker Bank Changes (2 minutes)
1. Navigate to `http://localhost:3000/ops/login`.
2. Sign in as `USR-VIKRAM` (Ops Manager) with TOTP from Demo Console.
3. Inspect the **3-Way Daily Reconciliation Table**:
   - LSP Demands vs Lender Disbursed UTRs vs Hospital Receipts balance to zero variance.
4. Navigate to `http://localhost:3000/hospital` as `USR-SUNITA`:
   - Go to **Beneficiary Bank Accounts**.
   - Click **+ Request New Beneficiary Account (Maker Step)**.
   - Enter Account: `98765432100099`, IFSC: `HDFC0000123`, Beneficiary: `Sahyadri Care Billing Account`.
   - Submit for approval. Status: `PENDING_APPROVAL`.
5. Sign in to `http://localhost:3000/admin/login` as `USR-ADITI` (Admin & Checker):
   - Navigate to **Beneficiary Approvals (Dual Control Checker)**.
   - View pending change request from `USR-SUNITA`.
   - Click **Approve Beneficiary Account**. The account is now activated.
   - Notice maker-checker collusion prevention: maker cannot self-approve.

---

## 4. Verification Checkpoint

In under 15 minutes, you have experienced:
- Dedicated, secure logins for Executive, Borrower, Hospital, Ops, and Admin.
- Real-time TOTP and SMS OTP delivery.
- Unbundled DPDP Act consent and patient-borrower identity separation.
- Real HMAC-SHA256 signed webhooks from a separate NBFC origin.
- Complete 6-event lifecycle with zero occurrences of "Paid".
- Direct lender-to-hospital disbursement (LSP zero money touch).
- Hospital maker-checker dual approval for bank accounts.
- Complete printable receipts and audit trail immutability.

