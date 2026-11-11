# V2 Codebase Audit & Hackathon Smell Catalog (V2_AUDIT.md)

This audit documents every architectural, structural, security, and UI/UX deficiency in the V1 prototype with exact file and line references, establishing the mandatory remediation checklist for the production V2 architecture.

---

## 1. Hackathon Smells & Architectural Deficiencies in V1

### 1.1 In-Product Role Switcher & Persona Chooser
- **Smell**: An in-product role switcher dropdown (`#role-switcher-select`) and quick switcher cards inside application navigation allow arbitrary user switching without authentication, password verification, or MFA.
- **File & Line References**:
  - `index.html:13-30`: `#prototype-banner`, `<select id="role-switcher-select">`, `<button id="reset-demo-data">`.
  - `js/app.js:95-136`: Event listeners binding role switcher select to `store.setCurrentUser()`.
  - `js/portals/auth.js:18-57, 133-160`: One-click persona login cards with raw user IDs.
- **Fix in V2**:
  - Eliminate the prototype banner, `#role-switcher-select`, and demo switcher from product pages.
  - Implement real login pages per workspace (`/executive/login`, `/hospital/login`, `/ops/login`, `/admin/login`, `/compliance/login`, `/support/login`, `/borrower/login`).
  - Implement real passwords hashed with `scrypt` + salt, TOTP MFA (RFC 6238) for staff, and SMS OTP for borrowers.
  - Move all demo helper personas, credentials, and test shortcuts to the isolated `/demo` console (gated by `DEMO_MODE=1`).

### 1.2 Single Shared App Shell Across All Personas
- **Smell**: A single `index.html` file renders all portals into a shared `#app-root` with a generic header and mixed navigation.
- **File & Line References**:
  - `index.html:33-51`: Single header and nav element (`#main-nav`).
  - `js/router.js:121-165`: Single `updateNav()` method attempting to dynamically render nav elements for all roles in one element.
- **Fix in V2**:
  - Provide distinct layout shells per workspace (`/executive/*`, `/hospital/*`, `/borrower/*`, `/ops/*`, `/admin/*`, `/compliance/*`, `/support/*`).
  - Each workspace has its own top-bar context (organization, branch, user profile, account settings, sign out), dedicated left navigation bar, breadcrumbs, page header, and page `<title>`.

### 1.3 Hash-Based Routing (`#/...`)
- **Smell**: Client-side hash routing (`window.location.hash`) is used instead of real HTTP path routing, preventing clean server-side request interception, real 404/403 HTTP status codes, and browser history management.
- **File & Line References**:
  - `js/router.js:18-48`: Hashchange listener `window.addEventListener('hashchange', ...)`.
  - `js/app.js:154-226`: Route registrations with `#/login`, `#/executive/...`, `#/hospital/...`.
- **Fix in V2**:
  - Migrate to HTML5 History API (`pushState`, `popstate`) with real server path routing (`/executive/dashboard`, `/hospital/cases`, etc.).
  - Node BFF static handler serves workspace index and falls back to appropriate workspace SPA root for subpaths.

### 1.4 Prototype Banners, Sandbox Links & Demo Helpers in Product
- **Smell**: "Staging Sandbox" badges, "Reset Data" buttons, and direct links to "Lender Sandbox" appear in the product header and navigation.
- **File & Line References**:
  - `index.html:15, 23`: `class="prototype-badge"`, `id="reset-demo-data"`.
  - `js/router.js:133, 164`: Hardcoded `<a href="#/sandbox/lender">Lender Sandbox</a>`.
  - `css/app.css:170-205`: Styles for `.prototype-banner`, `.prototype-badge`.
- **Fix in V2**:
  - Strip all prototype badges, reset buttons, and sandbox navigation links from production pages.
  - Show only a subtle standard environment line in the footer (`Sandbox environment`).
  - Relocate all test harnesses, reset triggers, time controls, and mock controls to the `/demo` console and the external lender sandbox origin.

### 1.5 Client-Side Authority (State Machines, RBAC, Audit in Browser)
- **Smell**: Business logic, state transition guards, RBAC checks, rate limiters, and audit trails exist exclusively in browser memory and `localStorage`. A client can bypass checks by executing scripts in the console.
- **File & Line References**:
  - `js/store.js:1-591`: Entire domain state machine, rate limiter, and storage residing in client `localStorage`.
  - `js/rbac.js:1-120`: Client-side RBAC evaluation `checkAccess()`.
  - `js/audit.js:1-50`: Client-side audit logger writing to browser memory.
  - `js/states.js:1-160`: Client-side state transitions.
- **Fix in V2**:
  - Move authoritative state machines, RBAC enforcement, ABAC multi-tenant isolation, audit logging, rate limiting, and business validation to the Node BFF server (`/server/`).
  - Browser becomes a pure client interacting with the server via `/api/v1/*` endpoints. State persists atomically to `/data/db.json`.

### 1.6 In-Browser Lender Mock & Missing Integration Boundary
- **Smell**: `js/lender-mock.js` runs in the same browser JavaScript bundle as the LSP product. The browser directly decides sanctions, issues KFS, and dispatches callbacks.
- **File & Line References**:
  - `js/lender-mock.js:1-240`: Lender simulation executing in client runtime.
  - `js/portals/sandbox.js:1-260`: Lender sandbox UI served directly inside the main app route `#/sandbox/lender`.
- **Fix in V2**:
  - Separate into two distinct network origins: Product Server (e.g., port 3000) and Lender Sandbox Server (e.g., port 3001).
  - Implement `/server/adapters/` with canonical adapter interface (`capabilities`, `validateApplication`, `submitApplication`, `getOffers`, `fetchKfs`, `submitDrawdown`, `verifyWebhook`, `normalizeWebhook`).
  - Implement HMAC-SHA256 signed webhook processing (`POST /webhooks/lender/:lenderCode`) with replay protection, timestamp validation, and outbox/inbox deduplication.
  - Support 3 distinct borrower journey modes: `api`, `redirect` (with signed state), and `iframe` (with CSP, sandboxing, postMessage validation, and redirect fallback).

### 1.7 Thin Dashboards & Lack of Real Work Queues
- **Smell**: Dashboards consist of 3-4 simple summary counters above an unfiltered table, lacking task assignment, SLA status, filtering, and priority queues.
- **File & Line References**:
  - `js/portals/executive.js:23-50`: 3 stat boxes and a single table.
  - `js/portals/hospital.js:20-60`: 3 stat boxes and an unpaginated table.
  - `js/portals/ops.js:20-55`: Simple static list.
- **Fix in V2**:
  - Build dense, professional operational work queues:
    - Executive: Today's tasks, cases needing action, expiring invitations, lender exceptions, queue by SLA.
    - Hospital: Open demands, awaiting receipt confirmation, mismatches, today's admissions.
    - Ops: Multi-queue workbench with SLA timers, integration health monitoring, exception workbench with evidence attachments, 3-way daily reconciliation.

### 1.8 Forms Without Drafts, Review Steps, or Confirmations
- **Smell**: Forms collect all inputs in one shot without draft saving, server-side validation error displays, formal review steps, or structured confirmation receipts.
- **File & Line References**:
  - `js/portals/executive.js:105-240`: Multi-step form implemented as DOM toggles without server drafts or printable confirmation slips.
  - `js/portals/hospital.js:70-130`: Demand form directly mutates client state.
- **Fix in V2**:
  - Implement multi-step form component with server-side draft persistence (`save draft & resume`), per-step schema validation, immutable review step, and formal confirmation page with printable receipt.

### 1.9 Inline Styles, console.log, and Ad-Hoc Notifications
- **Smell**: Pervasive inline styles (`style="..."`), `console.log` statements, and lack of standardized accessible toast notifications and dialog components.
- **File & Line References**:
  - `js/portals/*.js`: Extensive inline styling for margins, font sizes, colors.
  - `js/app.js:233`: `console.error('Fatal initialization error:', err)`.
  - Native `alert()` / `confirm()` risks in UI workflows.
- **Fix in V2**:
  - Zero inline styles (`style=""`). All styling handled via tokenized CSS classes in `public/css/app.css` (4px spacing scale, strict typography scale).
  - Zero `console.log` in `/public`.
  - Accessible, keyboard-navigable Dialog component and Toast notification system.
  - Zero browser `alert()`, `confirm()`, or `prompt()`.

### 1.10 Missing Production Page Attributes
- **Smell**: Pages do not dynamically update `<title>`, lack breadcrumb trails, lack skeleton loading states, lack consistent correlation IDs on error pages, and display round/unrealistic financial figures.
- **File & Line References**:
  - `index.html:6`: Static title `<title>Healthcare Financing LSP — Enterprise Portal</title>` never updated on route change.
  - `js/ui.js`: Minimal loading and empty states without actionable next steps.
- **Fix in V2**:
  - Dynamic `<title>` update for every workspace and view (`Executive Desk - Active Cases | Aidvans LSP`).
  - Standardized breadcrumb component on every detail page.
  - Server-generated correlation IDs (`CORR-XXXX-XXXX`) on every API request and error page.
  - Realistic, varied Indian currency amounts with number-to-words representations on receipts.

---

## 2. Remediation Checklist & Verification Gates
- [ ] Refactor folder layout to Section 4.1 specification.
- [ ] Port auto-detection with fallback for both product and lender sandbox servers.
- [ ] Node built-in modules only on server; atomic JSON persistence in `data/db.json`.
- [ ] Two distinct origins (3000 and 3001) for strict cross-origin security testing.
- [ ] Full REST API under `/api/v1` with OpenAPI 3.0 specification (`/docs/API_CONTRACT.openapi.yaml`).
- [ ] Canonical lender adapter contract (`capabilities`, `validateApplication`, `submitApplication`, `getOffers`, `fetchKfs`, `createAuthorisationContext`, `submitDrawdown`, `getDisbursementStatus`, `getLoanSnapshot`, `verifyWebhook`, `normalizeWebhook`).
- [ ] Standalone Lender Sandbox server with HMAC-SHA256 signed webhooks and dual-key rotation.
- [ ] Dedicated workspace login pages with scrypt passwords, TOTP MFA, and borrower SMS OTP.
- [ ] Standalone `/demo` console (gated by `DEMO_MODE=1`).
- [ ] Complete implementation of all 7 workspaces with real work queues.
- [ ] All 30 Acceptance Tests (AT-01 to AT-30) and 23 Persona Journeys (J1 to J23) passing 100% green.
- [ ] Zero "Paid", zero emojis, zero gradients, zero shadows, zero inline styles, zero console.log in `/public`.

