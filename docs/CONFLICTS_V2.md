# Conflict Resolution & Source of Truth Matrix (CONFLICTS_V2.md)

In accordance with Section 1 of the Loop Engineering Prompt V2, this document reconciles any differences between the prompt instructions and the foundational specifications:
- **Master Product Operating Blueprint v0.2**
- **Single Source of Truth (SSOT) v0.1**
- **Technical Design Specification (TDS) v0.1**
- **Mermaid 6-Swimlane Workflow Diagram**

---

## 1. Conflict Reconciliations

### 1.1 Lender Journey Modes (Iframe vs Redirect vs API)
- **Prompt Note**: Requires testing iframe embedding, postMessage validation, CSP frame-src, and redirect fallback.
- **Specification (TDS Section 5.1 & Blueprint Section 4.3)**: States that the LSP core product has *no hard dependency* on lender iframes, noting that NBFCs may mandate hosted redirects, native SDK handoffs, or direct APIs.
- **Resolution**:
  - `api` and `redirect` modes are first-class citizens and the default for regulated NBFC integration.
  - `iframe` mode is supported as an optional, configurable per-step capability within the capability registry. It is enabled only when specifically turned ON for a lender product version in Admin configuration.
  - When `iframe` mode is enabled, the browser applies strict sandboxing (`allow-scripts allow-forms allow-same-origin`), enforces strict CSP `frame-src`, and validates `postMessage` origin and schema. If the iframe fails to load or framing is refused by `X-Frame-Options` / `frame-ancestors`, the UI automatically falls back to `redirect` mode with clear explanatory guidance.

### 1.2 Port Allocation & Multi-Origin Topology
- **Prompt Note**: Product server on default port 3000, Lender Sandbox on default port 3001.
- **Specification**: In production, LSP runs on its domain (e.g. `app.aidvans.in`) and NBFC endpoints run on partner banking domains.
- **Resolution**:
  - The local development and test environment simulates this multi-tenant banking topology via two distinct local origins (`http://localhost:3000` and `http://localhost:3001`).
  - Both servers support dynamic port auto-discovery via `PORT` and `LENDER_PORT` environment variables, automatically incrementing to the next free port if occupied.

### 1.3 Money Lifecycle Event Representation
- **Prompt & SSOT Hard Rule**: The six distinct financial lifecycle events must never be collapsed into ambiguous single terms (specifically, the word "Paid" is strictly forbidden).
  1. Demand submitted
  2. Borrower authorised
  3. Sent to lender
  4. Lender approved
  5. Lender confirmed transfer
  6. Hospital confirmed receipt
- **Resolution**: Absolute adherence. Zero occurrences of "Paid" in UI, schemas, or server logs. All 6 events are distinctly tracked and displayed across all actor timelines.

### 1.4 Authority & State Persistence
- **Prompt Note**: Move all authority, state machines, RBAC, ABAC, and audit logging to the server BFF.
- **Specification (TDS Section 6.2 & SSOT Section 5)**: The LSP platform server is the authoritative system of record for cases, demands, funding requests, and audit logs; the NBFC is the authoritative system of record for credit decisions, loan accounts, and disbursement UTRs.
- **Resolution**:
  - The client is a zero-authority presentation layer communicating via `/api/v1/*`.
  - Server BFF enforces state machines, optimistic concurrency (`If-Match` / `version`), idempotency keys, and RBAC before updating atomic JSON state (`data/db.json`).

