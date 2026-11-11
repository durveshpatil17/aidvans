# Engineering Decisions Log V2 (DECISIONS_V2.md)

In accordance with Section 0.1 of the Loop Engineering Prompt V2, all architectural, protocol, security, and design decisions made during the V2 rebuild are recorded here.

---

## ADR-V2-001: Folder Layout & Workspace Restructuring
- **Decision**: Restructure the project to the Section 4.1 specification:
  - `/server.js`: Universal entry point orchestrating both Product BFF and Lender Sandbox with automated port fallback.
  - `/server/`: Backend-for-Frontend (BFF) HTTP router, session management, RBAC/ABAC enforcement, state machines, audit ledger, SSE event bus, and atomic persistence.
  - `/server/adapters/`: Per-lender integration adapters (`lenderA.js`, `lenderB.js`, `_template.js`, `registry.js`).
  - `/shared/`: Canonical logic shared between server and browser (`states.js`, `money.js`, `validators.js`, `ids.js`, `permissions.js`).
  - `/public/`: Lightweight static frontend with code-split workspace modules (`public/index.html`, `public/css/app.css`, `public/js/core/`, `public/js/components/`, `public/js/workspaces/*`).
  - `/lender-sandbox/`: Standalone origin simulating the regulated NBFC partner (APIs, hosted journeys, signed webhooks).
  - `/data/seed.json`: Canonical seed data; runtime database stored in `/data/db.json` (git-ignored).
  - `/tests/`: Automated test suites categorized into `api/`, `e2e/`, `perf/`, `a11y/`, `lint/`.
- **Rationale**: Clean separation of concerns, strict boundary enforcement, and realistic banking integration architecture.

---

## ADR-V2-002: Zero-Dependency Pure Node.js Server Implementation
- **Decision**: Use only Node.js standard library built-ins (`http`, `fs`, `crypto`, `zlib`, `path`, `url`, `events`). Absolutely zero third-party web frameworks (Express, Fastify, Koa) or database servers.
- **Rationale**: Minimal attack surface, zero runtime vulnerabilities, instant startup time (<50ms), and full compliance with prompt constraints.

---

## ADR-V2-003: Dynamic Port Discovery with Resilient Fallback
- **Decision**: Server reads `PORT` (default 3000) and `LENDER_PORT` (default 3001) from environment. If a port is occupied (`EADDRINUSE`), the server automatically increments to the next available port, binds successfully, and outputs the allocated URLs.
- **Rationale**: Prevents hard crashes during concurrent test executions or background services.

---

## ADR-V2-004: Dual-Origin Network Architecture
- **Decision**: Product BFF operates on Origin A (`http://localhost:3000`), while Lender Sandbox operates on Origin B (`http://localhost:3001`).
- **Rationale**: Essential for genuine verification of cross-origin security: redirect handoffs, sandboxed iframe restrictions, `postMessage` origin validation, Content Security Policy (`frame-src`), and HMAC webhook signatures.

---

## ADR-V2-005: Authentication, Session Management & Security Policies
- **Decision**:
  - **Workforce Workspaces** (Executive, Hospital, Ops, Admin, Compliance, Support):
    - Credentials: User ID + Password (hashed using Node `crypto.scrypt` with per-user salt).
    - MFA: Time-based One-Time Password (TOTP, RFC 6238) computed natively using HMAC-SHA1.
    - Security: Account lockout after 5 consecutive failures with generic messaging; 15-minute lock.
    - Session: HttpOnly, SameSite=Lax session cookie with short idle timeout (15 mins) and 60-second warning dialog.
  - **Borrower Portal**:
    - Authentication via Mobile Number + SMS OTP delivered to simulated outbox.
    - Anti-enumeration defense (identical response for registered vs unregistered numbers).
    - Step-up OTP mandatory before accepting loan agreements or authorizing drawdowns.
  - **CSRF & Idempotency**:
    - Strict CSRF token verification on all mutating requests.
    - `Idempotency-Key` header mandatory for financial and mutating transactions; duplicate keys return identical cached responses.
    - Optimistic concurrency control via `version` field and `If-Match` headers (HTTP 409 on version conflict).

---

## ADR-V2-006: Canonical Lender Adapter Contract & Capability Registry
- **Decision**: Standardize NBFC integrations via canonical adapter interface:
  - Methods: `capabilities()`, `validateApplication()`, `submitApplication()`, `getApplicationStatus()`, `getOffers()`, `fetchKfs()`, `createAuthorisationContext()`, `submitDrawdown()`, `getDisbursementStatus()`, `getLoanSnapshot()`, `verifyWebhook()`, `normalizeWebhook()`.
  - Capability Registry: Each lender product version explicitly declares supported capabilities (`multi_drawdown`, `cancellation`, `reversal`, journey modes). Undeclared capabilities fail closed.
  - Webhook Security: HMAC-SHA256 signature verification over raw request body using per-lender secret and key ID. Supports dual active key IDs for zero-downtime key rotation. Replay protection and event deduplication via inbox ledger.

---

## ADR-V2-007: Pure Vanilla Frontend with Per-Workspace Dynamic Loading
- **Decision**: Pure vanilla JavaScript (ES modules) with History API routing (`pushState` / `popstate`). Shared component library (`DataTable`, `MultiStepForm`, `Timeline`, `ModalDialog`, `ToastManager`, `PrintDocument`). Workspaces loaded dynamically via dynamic `import()`.
- **Rationale**: Instant page loads, zero framework overhead, complete gzipped payload < 40 KB for login pages and < 100 KB for complete workspaces.

---

## ADR-V2-008: Strict Design System Compliance
- **Decision**: Single CSS stylesheet (`public/css/app.css`) with 4px spacing tokens, white background (`#ffffff`), dark-slate text (`#111111`), single primary accent (`#1e3a8a`), zero box-shadows, zero CSS gradients, zero emojis, zero external icon sets, and zero marketing buzzwords.

