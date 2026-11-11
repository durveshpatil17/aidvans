# Engineering Decisions Log (DECISIONS.md)

In accordance with Section 0.1 of the Loop Engineering Prompt, all design, technical, and trade-off decisions made during prototype construction are recorded here.

## ADR-001: Technology Stack & Build Architecture
- **Decision**: Zero-framework, vanilla ES modules (HTML5, modern CSS, ES6+ modules) served via Node's native HTTP static file server or standard static server.
- **Rationale**: Meets prompt constraint of < 100 KB gzipped first-load size, zero external CDN requests, zero build-step overhead, and instant reload without transpilation.
- **Verification**: Gzip compression check and Lighthouse mobile profile.

## ADR-002: Client-side Storage & State Persistence (`store.js`)
- **Decision**: Single in-memory store synchronized with `localStorage` under key `HF_LSP_PROTOTYPE_v1.0`. A "Reset demo data" action restores the canonical seed dataset.
- **Rationale**: Enables multi-role switching, state persistence across page refreshes, and isolated test runs while maintaining transaction integrity in the client.

## ADR-003: State Machine Formalization (`states.js`)
- **Decision**: Declare state machines as pure lookup tables with explicit transition guards (e.g. `CASE_TRANSITIONS`, `DEMAND_TRANSITIONS`, `FUNDING_REQUEST_TRANSITIONS`, `DISBURSEMENT_TRANSITIONS`, `RECEIPT_TRANSITIONS`).
- **Rationale**: Fulfills the requirement that state machine transitions are data-driven rather than scattered `if` statements, throwing typed `StateTransitionError` on illegal moves.

## ADR-004: FRID & Token Generation
- **Decision**: FRID generated as `HF-` followed by 8 characters from unambiguous uppercase alphanumeric set `[23456789ABCDEFGHJKMNPQRSTUVWXYZ]` split as 4-4 (e.g., `HF-7K3M-9QX2`). One-time invitation token generated as a 32-character high-entropy hex string.
- **Security**: The raw invitation token is displayed once upon creation and consumed upon linking. Rate limiter enforces maximum 5 failed link attempts per 15-minute window per IP/browser.

## ADR-005: Local Inline QR Code Generator
- **Decision**: Self-contained inline pure JS QR matrix generator (under 3 KB, zero external dependencies) producing an inline SVG or canvas element.
- **Rationale**: Completely local, zero network calls, satisfies strict < 100 KB budget.

## ADR-006: RBAC & ABAC Security Enforcement (`rbac.js`)
- **Decision**: Implement centralized access evaluation function `checkAccess(user, permission, context)` that evaluates:
  1. Role permissions.
  2. ABAC tenant isolation (`org_id` match for hospital staff).
  3. Executive assignment (`assigned_user_id` match).
  4. Borrower link verification (`case_party` match).
  5. Field-level data masking for sensitive attributes.
- **Direct Route Protection**: If an unauthorized role enters a restricted hash URL, router intercepts and renders a standard `Permission Denied` screen, logging an audit event.

## ADR-007: Lender Sandbox Panel (`#/sandbox/lender`)
- **Decision**: A distinct sandbox view labeled `LENDER SANDBOX (not part of the LSP product)` that acts as the NBFC.
- **Capabilities**: Acknowledge application, request information, approve sanction with KFS, reject, execute loan agreement, evaluate/approve/reject drawdown, initiate and confirm transfer, simulate transfer failure or reversal, duplicate webhook dispatch, and simulate webhook timeout.

## ADR-008: Test Runner & Environment
- **Decision**: Playwright configured with local Google Chrome channel (`channel: 'chrome'`), hard per-test timeout of 15 seconds, and local axe-core injection for zero-violation accessibility checks.


## ADR-009: Enterprise Web Application UI/UX, Auth Portal & RBAC Workspaces
- **Decision**: Elevate the prototype into a production-grade enterprise web application.
  1. Dedicated Authentication Portal (`#/login`): Dual-mode access supporting Staff Enterprise Single Sign-On (with one-click verified persona cards and corporate email/MFA login) and Borrower Mobile / FRID Access.
  2. Contextual Role-Based Workspaces: The global application header dynamically morphs to display the specific workspace navigation according to the active user's RBAC scope (Executive Desk, Hospital Finance, Central Operations, Platform Admin, Compliance, Support, or Borrower Journey).
  3. Session Lifecycle & Identity Management: Prominent user profile badge displaying user avatar initials, full name, role pill, and a functional "Sign Out" action that revokes active sessions and routes cleanly to `#/login`.
  4. Enterprise Design System: Zinc/Slate modern aesthetic, 8px/12px border radii, subtle borders, high-contrast typography, interactive state transitions, zero gradients, zero box-shadows, zero emojis, and strictly zero occurrences of forbidden terminology ("Paid").
