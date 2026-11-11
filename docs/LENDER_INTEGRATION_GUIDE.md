# Regulated NBFC Partner Integration Guide (LENDER_INTEGRATION_GUIDE.md)

This technical integration manual defines the end-to-end process for onboarding a regulated Non-Banking Financial Company (NBFC) onto the Aidvans Healthcare Financing Lending Service Platform (LSP).

---

## 1. Architectural Boundary & Security Principles

> [!IMPORTANT]
> **Client-Side Direct Integration is Strictly Prohibited**
> Under RBI Digital Lending Guidelines and Aidvans security architecture, **the client browser can NEVER call NBFC APIs directly**. All authentication credentials, mTLS certificates, API secrets, and webhook HMAC keys must remain strictly on the server BFF. The browser communicates exclusively with the Aidvans BFF over `/api/v1/*`.

All lender communications flow through server-side adapters located in `/server/adapters/`.

---

## 2. Onboarding Steps for a Regulated NBFC Partner

### Step 1: Capability Registry Declaration
Define a new entry in `/server/adapters/registry.js` declaring the product's underwriting and disbursement capabilities:
```javascript
export const LENDER_PRODUCTS = {
  'PROD-NEW-01': {
    productId: 'PROD-NEW-01',
    productVersionId: 'PROD-NEW-01-v1',
    lenderCode: 'PARTNER_NBFC',
    lenderName: 'Partner NBFC India Limited',
    productName: 'Medical Care Line',
    drawdownMode: 'MULTI_DRAWDOWN', // or 'SINGLE_DISBURSEMENT'
    multiDrawdown: true,
    minAmount: 25000,
    maxAmount: 1000000,
    aprDisplay: '12.5% - 15.0% p.a.',
    tenorMonths: [6, 12, 24],
    kfsTemplate: 'KFS-PARTNER-2026',
    journeyModes: {
      application: 'api',      // 'api', 'redirect', or 'iframe'
      kyc: 'redirect',
      offers: 'api',
      e_sign: 'redirect',
      authorisation: 'api'
    },
    capabilities: {
      application_submit: true,
      application_status: true,
      offers_and_kfs: true,
      kyc_handoff: true,
      e_sign_handoff: true,
      single_disbursement: false,
      multi_drawdown: true,
      cancellation: true,
      reversal: true,
      repayment_feed: true,
      callbacks: true
    }
  }
};
```

### Step 2: Canonical-to-Lender Field Mapping
Fill in the field mapping table within `/server/adapters/partnerName.js`:

| Canonical LSP Field | Data Type | Description | Partner NBFC Payload Field |
|---|---|---|---|
| `canonicalApp.appId` | String | LSP Application Reference | `partner_lead_id` |
| `canonicalApp.caseId` | String | Hospital Facilitation Case Ref | `hospital_case_num` |
| `canonicalApp.frid` | String | Unique 8-char Reference | `frid_code` |
| `canonicalApp.borrower.pan` | String | Validated Indian PAN | `customer_tax_id` |
| `canonicalApp.borrower.name` | String | Legal Name | `applicant_name` |
| `canonicalApp.demand.amount` | Number | Requested Loan in INR | `sanction_request_inr` |
| `canonicalApp.hospital.ifsc` | String | Verified Hospital IFSC | `disbursement_ifsc` |
| `canonicalApp.hospital.beneficiaryAccount` | String | Verified Hospital Bank Account | `beneficiary_account_no` |

### Step 3: Lifecycle Status Mapping
Map NBFC proprietary statuses to canonical LSP states:

| Partner NBFC Status | Canonical LSP Status | Next Action |
|---|---|---|
| `IN_REVIEW`, `SCRUTINY` | `UNDERWRITING_ACKNOWLEDGED` | Await webhook or status poll |
| `DOCS_REQUIRED` | `ACTION_REQUIRED` | Notify borrower to submit documents |
| `SANCTIONED`, `APPROVED` | `SANCTIONED` | Generate standard KFS for borrower |
| `REJECTED`, `DECLINED` | `REJECTED` | Notify borrower with statutory explanation |
| `TRANSFERRED`, `DISBURSED` | `DISBURSEMENT_PENDING` | Await independent hospital receipt confirmation |
| `FAILED_RETURNED` | `FAILED` | Alert Operations exception workbench |
| `REVERSED` | `REVERSED` | Auto-link reversal to original disbursement |

### Step 4: Webhook Security & Dual-Key Rotation
- **Endpoint**: `POST https://app.aidvans.in/webhooks/lender/:lenderCode`
- **Signature Scheme**: `HMAC-SHA256` computed over the raw UTF-8 request body.
- **Headers**:
  - `x-lender-signature`: Hex-encoded HMAC-SHA256 hash.
  - `x-lender-key-id`: Identifier of active signing key (supports 2 concurrent active keys for zero-downtime rotation).
  - `x-lender-timestamp`: Epoch milliseconds. Rejected if clock skew > 300 seconds.
- **Replay Protection**: Aidvans stores incoming `event_id` in `webhook_inbox`. Duplicate deliveries return `200 OK` with `{ status: "IGNORED_DUPLICATE" }` without re-processing.

### Step 5: CSP & Framing Configuration
If the NBFC provides hosted or embedded journeys:
- **Redirect Mode**: NBFC provides hosted URL; Aidvans passes signed `state` and allowlisted `return_url`.
- **Iframe Mode**:
  - NBFC must configure `frame-ancestors https://app.aidvans.in` and omit `X-Frame-Options: DENY`.
  - Aidvans configures `frame-src https://*.partner-nbfc.in` in its Content Security Policy.
  - The iframe emits `window.parent.postMessage({ type: 'LENDER_COMPLETED', token: '...' }, 'https://app.aidvans.in')`.
  - **Automated Fallback**: If framing is blocked or fails to load within 5 seconds, Aidvans automatically redirects the borrower to the hosted fallback page.

---

## 3. Go-Live Verification Checklist
- [ ] Capability registry configured and tested.
- [ ] Mutual TLS (mTLS) certificates installed on server BFF.
- [ ] Primary and secondary webhook signing secrets provisioned in server environment variables.
- [ ] IP allowlist configured on both firewall gateways.
- [ ] Direct hospital disbursement verified with ₹1 penny drop test to hospital beneficiary account.
- [ ] Standardized Key Fact Statement (KFS) format validated against RBI circular.
- [ ] Full regression suite passing 100% in staging environment.

