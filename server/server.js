/**
 * Aidvans Healthcare Financing LSP - Backend-For-Frontend (BFF) Server
 * Pure Node.js Standard Library (http, fs, zlib, path, crypto, url)
 * Zero frameworks, zero external dependencies.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

import { Database } from './db.js';
import { AuthService } from './auth.js';
import { SSEHub } from './sse.js';
import { IdempotencyManager } from './idempotency.js';
import { hasPermission, enforceTenantIsolation, enforceBorrowerIsolation, maskEntityFields, AccessDeniedError } from './rbac.js';
import { ROLES, PERMISSIONS, WORKSPACE_ROUTES } from '../shared/permissions.js';
import { LenderAAdapter } from './adapters/lenderA.js';
import { LenderBAdapter } from './adapters/lenderB.js';
import { LENDER_PRODUCTS } from './adapters/registry.js';
import { generateSecureToken, generateNumericOTP, generateTOTP } from './crypto.js';
import {
  generateFRID,
  generateCaseId,
  generateDemandId,
  generateFundingRequestId,
  generateApplicationId,
  generateSanctionId,
  generateDrawdownId,
  generateDisbursementId,
  generateReceiptId,
  generateExceptionId,
  generateTicketId
} from '../shared/ids.js';
import {
  validateTransition,
  CASE_TRANSITIONS,
  DEMAND_TRANSITIONS,
  FUNDING_REQUEST_TRANSITIONS,
  DRAWDOWN_TRANSITIONS,
  DISBURSEMENT_TRANSITIONS,
  RECEIPT_TRANSITIONS,
  BENEFICIARY_ACCOUNT_TRANSITIONS
} from '../shared/states.js';
import { isValidPAN, isValidPhone, isValidIFSC, maskName, maskPhone, maskAccount } from '../shared/validators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SHARED_DIR = path.join(ROOT_DIR, 'shared');

const DEFAULT_PORT = Number(process.env.PORT) || 3000;
const DEMO_MODE = process.env.DEMO_MODE !== '0';

export class ProductServer {
  constructor(port = DEFAULT_PORT, lenderSandboxUrl = 'http://localhost:3001') {
    this.initialPort = port;
    this.port = port;
    this.lenderSandboxUrl = lenderSandboxUrl;
    this.server = null;

    this.db = new Database();
    this.sseHub = new SSEHub();
    this.authService = new AuthService(this.db, this.sseHub);
    this.idempotency = new IdempotencyManager(this.db);

    this.lenderAdapters = {
      'lender_a': new LenderAAdapter({ apiBaseUrl: `${lenderSandboxUrl}/lender-a/api` }),
      'lender_b': new LenderBAdapter({ apiBaseUrl: `${lenderSandboxUrl}/lender-b/api` })
    };

    this.rateLimitMap = new Map(); // key -> { attempts, lockUntil }
  }

  start() {
    return new Promise((resolve, reject) => {
      const tryListen = (currentPort) => {
        const srv = http.createServer((req, res) => this.handleRequest(req, res));

        srv.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.warn(`Product Server Port ${currentPort} busy, trying ${currentPort + 1}...`);
            tryListen(currentPort + 1);
          } else {
            reject(err);
          }
        });

        srv.listen(currentPort, () => {
          this.port = currentPort;
          this.server = srv;
          console.log(`Product BFF Server running at http://localhost:${this.port}/`);
          resolve(this.port);
        });
      };

      tryListen(this.initialPort);
    });
  }

  stop() {
    return new Promise((resolve) => {
      this.sseHub.destroy();
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  async handleRequest(req, res) {
    res.req = req;
    const correlationId = `CORR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    req.correlationId = correlationId;

    // Apply strict security headers on every response
    this.applySecurityHeaders(res);
    res.setHeader('X-Correlation-ID', correlationId);

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Server-Sent Events Route
    if (pathname === '/api/v1/events') {
      const sessionContext = this.authService.getSession(req);
      if (!sessionContext) {
        return this.sendError(res, 401, 'UNAUTHENTICATED', 'Active session required for real-time events', correlationId);
      }
      return this.sseHub.addClient(req, res, sessionContext.user);
    }

    // Read body for non-GET requests
    let bodyStr = '';
    req.on('data', chunk => bodyStr += chunk);
    req.on('end', async () => {
      req.body = {};
      if (bodyStr && bodyStr.trim()) {
        try {
          req.body = JSON.parse(bodyStr);
          if (typeof req.body !== 'object' || req.body === null) {
            throw new Error('Payload must be a JSON object');
          }
        } catch {
          return this.sendError(res, 400, 'INVALID_JSON', 'Malformed JSON in request payload', correlationId);
        }
      }

      try {
        // --- API Routes (/api/v1/*) ---
        if (pathname.startsWith('/api/v1/')) {
          return await this.handleApiRoute(req, res, pathname, parsedUrl);
        }

        // --- Webhook Routes (/webhooks/lender/*) ---
        if (pathname.startsWith('/webhooks/lender/')) {
          return await this.handleWebhookRoute(req, res, pathname, bodyStr);
        }

        // --- Demo Console Route (/demo) ---
        if (pathname === '/demo' || pathname.startsWith('/demo/')) {
          if (!DEMO_MODE) {
            return this.sendError(res, 404, 'NOT_FOUND', 'Demo mode is disabled on this environment', correlationId);
          }
          return this.handleStaticRoute(req, res, '/index.html');
        }

        // --- Static Asset & SPA History Route ---
        return this.handleStaticRoute(req, res, pathname);
      } catch (err) {
        const statusCode = err.statusCode || 500;
        const code = err.code || 'INTERNAL_SERVER_ERROR';
        return this.sendError(res, statusCode, code, err.message, correlationId, err.details);
      }
    });
  }

  applySecurityHeaders(res) {
    res.setHeader('Content-Security-Policy', "default-src 'self' http://localhost:* ws://localhost:*; frame-src 'self' http://localhost:*; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' http://localhost:*; img-src 'self' data:;");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }

  sendJson(res, statusCode, data, headers = {}) {
    if (res.req && res.req._idempotencyKey && statusCode < 500) {
      this.idempotency.saveRecord(res.req._idempotencyKey, statusCode, headers, data);
    }
    const jsonStr = JSON.stringify(data);
    const acceptEncoding = res.req?.headers['accept-encoding'] || '';

    if (acceptEncoding.includes('gzip')) {
      const gzipped = zlib.gzipSync(Buffer.from(jsonStr));
      res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'gzip',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        ...headers
      });
      res.end(gzipped);
    } else {
      res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        ...headers
      });
      res.end(jsonStr);
    }
  }

  sendError(res, statusCode, code, message, correlationId, details = null) {
    this.sendJson(res, statusCode, {
      error: {
        code,
        message,
        correlationId,
        ...(details ? { details } : {})
      }
    });
  }

  // --- API Route Dispatcher ---
  async handleApiRoute(req, res, pathname, parsedUrl) {
    const method = req.method;
    const correlationId = req.correlationId;

    // Mutating Idempotency Guard
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const sessionCtx = this.authService.getSession(req);
      const userId = sessionCtx ? sessionCtx.user.user_id : 'ANON';
      const idemKey = this.idempotency.getKey(req, userId);

      if (idemKey) {
        req._idempotencyKey = idemKey;
        const cached = this.idempotency.getRecord(idemKey);
        if (cached) {
          return this.sendJson(res, cached.status_code, JSON.parse(cached.body), {
            'X-Idempotent-Replayed': 'true'
          });
        }
      }
    }

    // Auth Routes
    if (pathname === '/api/v1/auth/login' && method === 'POST') {
      return this.handleWorkforceLogin(req, res);
    }
    if (pathname === '/api/v1/auth/quick-login' && method === 'POST') {
      return this.handleQuickLogin(req, res);
    }
    if ((pathname === '/api/v1/auth/borrower/login' || pathname === '/api/v1/auth/borrower/direct-login') && method === 'POST') {
      return this.handleBorrowerDirectLogin(req, res);
    }
    if (pathname === '/api/v1/auth/borrower/request-otp' && method === 'POST') {
      return this.handleBorrowerRequestOTP(req, res);
    }
    if (pathname === '/api/v1/auth/borrower/verify-otp' && method === 'POST') {
      return this.handleBorrowerVerifyOTP(req, res);
    }
    if (pathname === '/api/v1/auth/logout' && method === 'POST') {
      return this.handleLogout(req, res);
    }
    if (pathname === '/api/v1/auth/me' && method === 'GET') {
      return this.handleGetSession(req, res);
    }

    // Public Routes
    if (pathname === '/api/v1/public/overview' && method === 'GET') {
      return this.handleGetPublicOverview(req, res);
    }
    if (pathname === '/api/v1/public/hospitals' && method === 'GET') {
      return this.sendJson(res, 200, { hospitals: this.db.find('organizations', o => o.org_type === 'HOSPITAL') });
    }
    if (pathname === '/api/v1/public/lenders' && method === 'GET') {
      return this.sendJson(res, 200, { lenders: this.db.find('organizations', o => o.org_type === 'NBFC'), products: Object.values(LENDER_PRODUCTS) });
    }

    // Public Case Linking & FRID lookup
    if (pathname === '/api/v1/cases/link' && method === 'POST') {
      return this.handleLinkCase(req, res);
    }
    if (pathname.startsWith('/api/v1/cases/by-frid/') && method === 'GET') {
      const frid = pathname.split('/')[5];
      return this.handleGetCaseByFrid(req, res, frid);
    }

    // Demo Data & Controls (Gated by DEMO_MODE)
    if (pathname === '/api/v1/demo/state' && method === 'GET') {
      if (!DEMO_MODE) throw new AccessDeniedError('Demo mode disabled');
      const now = this.db.now();
      const enrichedUsers = this.db.find('users').map(u => ({
        ...u,
        live_totp: u.totp_secret ? generateTOTP(u.totp_secret, now) : 'N/A'
      }));
      return this.sendJson(res, 200, {
        users: enrichedUsers,
        outboxes: this.db.data.simulated_outbox,
        timeOffsetMs: this.db.data.time_offset_ms
      });
    }
    if (pathname === '/api/v1/demo/advance-clock' && method === 'POST') {
      if (!DEMO_MODE) throw new AccessDeniedError('Demo mode disabled');
      const hours = Number(req.body.hours || 1);
      const newTime = this.db.advanceTime(hours * 3600 * 1000);
      return this.sendJson(res, 200, { newTimestamp: newTime, advancedHours: hours });
    }
    if (pathname === '/api/v1/demo/reset' && method === 'POST') {
      if (!DEMO_MODE) throw new AccessDeniedError('Demo mode disabled');
      this.db.reset();
      return this.sendJson(res, 200, { success: true, message: 'Database reset to canonical seed' });
    }

    // Authenticated API Guard
    const sessionCtx = this.authService.getSession(req);
    if (!sessionCtx) {
      return this.sendError(res, 401, 'UNAUTHENTICATED', 'Valid authenticated session required', correlationId);
    }
    const { user } = sessionCtx;
    req.user = user;

    // --- Domain Entity Routes ---

    // Cases
    if (pathname === '/api/v1/cases' && method === 'GET') {
      return this.handleListCases(req, res);
    }
    if (pathname === '/api/v1/cases' && method === 'POST') {
      return this.handleCreateCase(req, res);
    }
    if (pathname === '/api/v1/cases/lookup' && method === 'GET') {
      return this.handleLookupCase(req, res, parsedUrl);
    }
    if (pathname === '/api/v1/cases/export' && method === 'GET') {
      return this.handleExportCases(req, res);
    }
    if (pathname.startsWith('/api/v1/cases/') && method === 'GET') {
      const caseId = pathname.split('/')[4];
      return this.handleGetCase(req, res, caseId);
    }
    if (pathname.startsWith('/api/v1/cases/') && pathname.endsWith('/close') && method === 'POST') {
      const caseId = pathname.split('/')[4];
      return this.handleCloseCase(req, res, caseId);
    }

    // Demands
    if (pathname === '/api/v1/demands' && method === 'POST') {
      return this.handleCreateDemand(req, res);
    }
    if (pathname.startsWith('/api/v1/demands/') && method === 'GET') {
      const demandId = pathname.split('/')[4];
      return this.handleGetDemand(req, res, demandId);
    }

    // Funding Requests & Drawdowns
    if (pathname === '/api/v1/funding-requests' && method === 'POST') {
      return this.handleCreateFundingRequest(req, res);
    }
    if (pathname.startsWith('/api/v1/funding-requests/') && pathname.endsWith('/authorise') && method === 'POST') {
      const reqId = pathname.split('/')[4];
      return this.handleAuthoriseFundingRequest(req, res, reqId);
    }
    if (pathname === '/api/v1/funding-requests/step-up-otp' && method === 'POST') {
      return this.handleRequestStepUpOTP(req, res);
    }

    // Consent
    if (pathname === '/api/v1/consent' && method === 'POST') {
      return this.handleRecordConsent(req, res);
    }
    if (pathname === '/api/v1/consent/withdraw' && method === 'POST') {
      return this.handleWithdrawConsent(req, res);
    }
    if (pathname === '/api/v1/compliance/consents' && method === 'GET') {
      return this.handleGetComplianceConsents(req, res);
    }

    // Personal Journal
    if (pathname === '/api/v1/user/journal' && method === 'GET') {
      return this.handleGetUserJournal(req, res);
    }

    // Receipts
    if (pathname === '/api/v1/receipts/confirm' && method === 'POST') {
      return this.handleConfirmReceipt(req, res);
    }
    if (pathname === '/api/v1/receipts/mismatch' && method === 'POST') {
      return this.handleReportMismatch(req, res);
    }

    // Admin / Maker-Checker Beneficiary Accounts
    if (pathname === '/api/v1/admin/beneficiaries/request-change' && method === 'POST') {
      return this.handleBeneficiaryChangeRequest(req, res);
    }
    if (pathname.startsWith('/api/v1/admin/beneficiaries/') && pathname.endsWith('/approve') && method === 'POST') {
      const benefId = pathname.split('/')[5];
      return this.handleBeneficiaryApprove(req, res, benefId);
    }

    // Admin User Lifecycle & Incident
    if (pathname.startsWith('/api/v1/admin/users/') && pathname.endsWith('/deactivate') && method === 'POST') {
      const uid = pathname.split('/')[5];
      return this.handleDeactivateUser(req, res, uid);
    }
    if (pathname.startsWith('/api/v1/admin/users/') && pathname.endsWith('/unlock') && method === 'POST') {
      const uid = pathname.split('/')[5];
      return this.handleUnlockUser(req, res, uid);
    }
    if (pathname === '/api/v1/admin/incident/simulate' && method === 'POST') {
      return this.handleSimulateIncident(req, res);
    }

    // Ops Reconciliation
    if (pathname === '/api/v1/ops/reconciliation' && method === 'GET') {
      return this.handleGetReconciliation(req, res);
    }
    if (pathname === '/api/v1/ops/reconciliation/resolve' && method === 'POST') {
      return this.handleResolveReconciliationDiscrepancy(req, res);
    }

    // Support Tickets
    if (pathname === '/api/v1/support/tickets' && method === 'GET') {
      return this.handleListTickets(req, res);
    }
    if (pathname === '/api/v1/support/tickets' && method === 'POST') {
      return this.handleCreateTicket(req, res);
    }

    // Product KFS
    if (pathname.startsWith('/api/v1/products/') && pathname.endsWith('/kfs') && method === 'GET') {
      const pid = pathname.split('/')[4];
      return this.handleGetProductKFS(req, res, pid);
    }

    // Audit Logs
    if (pathname === '/api/v1/audit/logs' && method === 'GET') {
      if (!hasPermission(user.role, PERMISSIONS.VIEW_IMMUTABLE_AUDIT)) {
        throw new AccessDeniedError('Audit log inspection requires Admin or Compliance role');
      }
      const logs = this.db.find('audit_logs');
      return this.sendJson(res, 200, { logs });
    }

    return this.sendError(res, 404, 'NOT_FOUND', `API endpoint '${method} ${pathname}' not found`, correlationId);
  }

  // --- Auth Handlers ---
  async handleWorkforceLogin(req, res) {
    const { userIdOrEmail, password, totpCode, workspace } = req.body;
    try {
      const result = this.authService.loginWorkforce({
        userIdOrEmail,
        password,
        totpCode,
        workspace: workspace || 'executive',
        req
      });

      if (result.mfa_required) {
        return this.sendJson(res, 200, result);
      }

      const cookie = this.authService.formatSessionCookie(result.session.session_id);
      return this.sendJson(res, 200, {
        success: true,
        user: result.user,
        csrfToken: result.session.csrf_token,
        workspaceRoute: WORKSPACE_ROUTES[result.user.role] || '/'
      }, { 'Set-Cookie': cookie });
    } catch (err) {
      return this.sendError(res, 401, 'INVALID_CREDENTIALS', err.message, req.correlationId);
    }
  }

  async handleQuickLogin(req, res) {
    const { userId, workspace } = req.body || {};
    try {
      const result = this.authService.quickLogin({
        userId,
        workspace: workspace || 'executive',
        req
      });

      const cookie = this.authService.formatSessionCookie(result.session.session_id);
      return this.sendJson(res, 200, {
        success: true,
        user: result.user,
        csrfToken: result.session.csrf_token,
        workspaceRoute: result.workspaceRoute
      }, { 'Set-Cookie': cookie });
    } catch (err) {
      return this.sendError(res, 400, 'QUICK_LOGIN_FAILED', err.message, req.correlationId);
    }
  }

  async handleBorrowerDirectLogin(req, res) {
    const { phone } = req.body || {};
    try {
      const result = this.authService.loginBorrowerDirect({ phone, req });
      const cookie = this.authService.formatSessionCookie(result.session.session_id);
      return this.sendJson(res, 200, {
        success: true,
        user: result.user,
        csrfToken: result.session.csrf_token,
        workspaceRoute: '/borrower/home'
      }, { 'Set-Cookie': cookie });
    } catch (err) {
      return this.sendError(res, 400, 'BORROWER_LOGIN_FAILED', err.message, req.correlationId);
    }
  }

  async handleBorrowerRequestOTP(req, res) {
    const { phone } = req.body;
    try {
      const outcome = this.authService.requestBorrowerOTP(phone);
      return this.sendJson(res, 200, outcome);
    } catch (err) {
      return this.sendError(res, 400, 'OTP_REQUEST_FAILED', err.message, req.correlationId);
    }
  }

  async handleBorrowerVerifyOTP(req, res) {
    const { phone, otp } = req.body;
    try {
      const result = this.authService.verifyBorrowerOTP(phone, otp, req);
      const cookie = this.authService.formatSessionCookie(result.session.session_id);
      return this.sendJson(res, 200, {
        success: true,
        user: result.user,
        csrfToken: result.session.csrf_token,
        workspaceRoute: '/borrower/home'
      }, { 'Set-Cookie': cookie });
    } catch (err) {
      return this.sendError(res, 401, 'INVALID_OTP', err.message, req.correlationId);
    }
  }

  async handleLogout(req, res) {
    const cookies = this.authService.parseCookies(req);
    const sessionId = cookies['aidvans_session'];
    if (sessionId) {
      this.db.update('sessions', 'session_id', sessionId, { revoked_at: new Date(this.db.now()).toISOString() });
    }
    const clearCookie = this.authService.formatClearSessionCookie();
    return this.sendJson(res, 200, { success: true }, { 'Set-Cookie': clearCookie });
  }

  async handleGetSession(req, res) {
    const sessionContext = this.authService.getSession(req);
    if (!sessionContext) {
      return this.sendError(res, 401, 'UNAUTHENTICATED', 'No active session', req.correlationId);
    }
    return this.sendJson(res, 200, {
      user: sessionContext.user,
      workspace: sessionContext.session.workspace,
      csrfToken: sessionContext.session.csrf_token
    });
  }

  // --- Domain Handlers ---
  async handleListCases(req, res) {
    const user = req.user;
    let cases = this.db.find('cases');

    // Scoping enforcement
    if (user.role === ROLES.EXECUTIVE) {
      cases = cases.filter(c =>
        c.assigned_executive_id === user.user_id ||
        (user.assigned_hospital_ids && user.assigned_hospital_ids.includes(c.hospital_id))
      );
    } else if (user.role.startsWith('HOSPITAL_')) {
      cases = cases.filter(c => c.hospital_id === user.org_id);
    } else if (user.role === ROLES.BORROWER) {
      cases = cases.filter(c => c.primary_borrower_id === user.user_id);
    }

    const masked = cases.map(c => maskEntityFields(c, user.role));
    return this.sendJson(res, 200, { cases: masked });
  }

  async handleCreateCase(req, res) {
    const user = req.user;
    if (!hasPermission(user.role, PERMISSIONS.CREATE_FINANCING_CASE)) {
      throw new AccessDeniedError('User role cannot originate financing cases');
    }

    const { hospitalId, branchId, patient, borrower, initialDemand } = req.body;
    enforceTenantIsolation(user, hospitalId, 'Hospital');

    // Duplicate admission check
    if (patient.admissionRef) {
      const existingActive = this.db.findOne('cases', c =>
        c.hospital_id === hospitalId &&
        c.admission_ref === patient.admissionRef &&
        !['CLOSED', 'CANCELLED', 'FACILITATION_CLOSED'].includes(c.case_status)
      );
      if (existingActive) {
        return this.sendError(res, 409, 'DUPLICATE_ADMISSION', `Active case already exists for admission ref '${patient.admissionRef}' (FRID: ${existingActive.frid})`, req.correlationId);
      }
    }

    const caseId = generateCaseId();
    const frid = generateFRID();
    const token = generateSecureToken(16);

    const newCase = {
      case_id: caseId,
      frid,
      invitation_token: token,
      invitation_expiry: new Date(this.db.now() + 7 * 24 * 3600 * 1000).toISOString(),
      hospital_id: hospitalId,
      branch_id: branchId,
      assigned_executive_id: user.user_id,
      admission_ref: patient.admissionRef || '',
      patient_id: `PAT-${Date.now().toString(36).toUpperCase()}`,
      primary_borrower_id: borrower.userId || `BOR-${Date.now().toString(36).toUpperCase()}`,
      case_status: 'READY_FOR_INVITATION',
      created_at: new Date(this.db.now()).toISOString()
    };

    // Initial Demand
    if (initialDemand) {
      const demandId = generateDemandId();
      newCase.initial_demand_id = demandId;
      this.db.insert('demands', {
        demand_id: demandId,
        case_id: caseId,
        sequence: 1,
        amount: Number(initialDemand.amount),
        status: 'SUBMITTED',
        invoice_number: initialDemand.invoiceNumber || `INV-${Date.now().toString(36).toUpperCase()}`,
        procedure_name: initialDemand.procedureName || 'Medical Treatment'
      });
    }

    this.db.insert('cases', newCase);

    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'CASE_CREATED',
      targetType: 'CASE',
      targetId: caseId,
      reason: `Case created with FRID ${frid}`,
      hospitalId
    });

    this.sseHub.notifyCaseUpdate(newCase, 'CASE_CREATED');
    return this.sendJson(res, 201, { case: newCase, frid, token });
  }

  async handleGetCase(req, res, caseId) {
    const user = req.user;
    const caseRecord = this.db.findById('cases', 'case_id', caseId);
    if (!caseRecord) {
      return this.sendError(res, 404, 'CASE_NOT_FOUND', `Case ${caseId} does not exist`, req.correlationId);
    }

    enforceTenantIsolation(user, caseRecord.hospital_id, 'Case');
    enforceBorrowerIsolation(user, caseRecord);

    const demands = this.db.find('demands', d => d.case_id === caseId);
    const fundingRequests = this.db.find('funding_requests', f => f.case_id === caseId);
    const disbursements = this.db.find('disbursements', d => d.case_id === caseId);
    const auditLogs = this.db.find('audit_logs', a => a.target_id === caseId);

    const maskedCase = maskEntityFields(caseRecord, user.role);

    return this.sendJson(res, 200, {
      case: maskedCase,
      demands,
      fundingRequests,
      disbursements,
      auditLogs
    });
  }

  async handleCloseCase(req, res, caseId) {
    const user = req.user;
    const caseRecord = this.db.findById('cases', 'case_id', caseId);
    if (!caseRecord) return this.sendError(res, 404, 'CASE_NOT_FOUND', `Case not found`, req.correlationId);

    validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseId, caseRecord.case_status, 'FACILITATION_CLOSED');
    this.db.update('cases', 'case_id', caseId, { case_status: 'FACILITATION_CLOSED' });

    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'FACILITATION_CLOSED',
      targetType: 'CASE',
      targetId: caseId,
      reason: 'LSP facilitation case closed. Underlying regulated lender loan remains active.'
    });

    return this.sendJson(res, 200, {
      success: true,
      case_id: caseId,
      status: 'FACILITATION_CLOSED',
      statutoryNotice: 'Case closed at LSP desk. Notice: Closing this LSP facilitation case does not close or terminate the borrower\'s underlying loan agreement with the regulated lender.'
    });
  }

  async handleCreateDemand(req, res) {
    const user = req.user;
    const { caseId, amount, procedureName, invoiceNumber } = req.body;

    const caseRecord = this.db.findById('cases', 'case_id', caseId);
    if (!caseRecord) return this.sendError(res, 404, 'CASE_NOT_FOUND', 'Case not found', req.correlationId);

    enforceTenantIsolation(user, caseRecord.hospital_id, 'Demand');

    const existingDemands = this.db.find('demands', d => d.case_id === caseId);
    const demandId = generateDemandId();
    const newDemand = {
      demand_id: demandId,
      case_id: caseId,
      sequence: existingDemands.length + 1,
      amount: Number(amount),
      procedure_name: procedureName,
      invoice_number: invoiceNumber || `INV-${Date.now()}`,
      status: 'SUBMITTED',
      created_at: new Date(this.db.now()).toISOString()
    };

    this.db.insert('demands', newDemand);
    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'DEMAND_SUBMITTED',
      targetType: 'DEMAND',
      targetId: demandId,
      reason: `Demand submitted for ₹${amount}`
    });

    return this.sendJson(res, 201, { demand: newDemand });
  }

  async handleCreateFundingRequest(req, res) {
    const user = req.user;
    const { caseId, demandId, amount, productId } = req.body;

    const caseRecord = this.db.findById('cases', 'case_id', caseId);
    if (!caseRecord) return this.sendError(res, 404, 'CASE_NOT_FOUND', 'Case not found', req.correlationId);

    // Single-disbursement product check (AT-10, J11)
    const product = LENDER_PRODUCTS[productId || 'PROD-01'];
    if (product && (product.drawdownMode === 'SINGLE_DISBURSEMENT' || product.multiDrawdown === false)) {
      const existingReqs = this.db.find('funding_requests', f => f.case_id === caseId);
      if (existingReqs.length > 0) {
        return this.sendError(res, 400, 'SUBSEQUENT_TRANCHE_NOT_SUPPORTED',
          'Single-disbursement product does not support subsequent drawdown tranches. A new application is required.',
          req.correlationId);
      }
    }

    const freqId = generateFundingRequestId();
    const freq = {
      funding_request_id: freqId,
      case_id: caseId,
      demand_id: demandId,
      product_id: productId || 'PROD-01',
      amount: Number(amount),
      status: 'PENDING_BORROWER_AUTH',
      created_at: new Date(this.db.now()).toISOString()
    };

    this.db.insert('funding_requests', freq);
    return this.sendJson(res, 201, { fundingRequest: freq });
  }

  async handleAuthoriseFundingRequest(req, res, reqId) {
    const user = req.user;
    const { stepUpOtp } = req.body;

    // Verify step-up OTP
    this.authService.verifyStepUpOTP(user, stepUpOtp);

    const freq = this.db.findById('funding_requests', 'funding_request_id', reqId);
    if (!freq) return this.sendError(res, 404, 'NOT_FOUND', 'Funding request not found', req.correlationId);

    validateTransition(FUNDING_REQUEST_TRANSITIONS, 'FundingRequest', reqId, freq.status, 'AUTHORISED');
    this.db.update('funding_requests', 'funding_request_id', reqId, { status: 'AUTHORISED' });

    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'BORROWER_AUTHORISED_DRAWDOWN',
      targetType: 'FUNDING_REQUEST',
      targetId: reqId,
      reason: `Borrower authorised drawdown tranche of ₹${freq.amount}`
    });

    return this.sendJson(res, 200, { success: true, status: 'AUTHORISED' });
  }

  async handleConfirmReceipt(req, res) {
    const user = req.user;
    const { disbursementId, transferUtr, confirmedAmount } = req.body;

    const disb = this.db.findById('disbursements', 'disbursement_id', disbursementId);
    if (!disb) return this.sendError(res, 404, 'DISBURSEMENT_NOT_FOUND', 'Disbursement record not found', req.correlationId);

    enforceTenantIsolation(user, disb.hospital_id, 'Receipt');

    const rcptId = generateReceiptId();
    const receipt = {
      receipt_id: rcptId,
      disbursement_id: disbursementId,
      case_id: disb.case_id,
      hospital_id: disb.hospital_id,
      transfer_utr: transferUtr,
      confirmed_amount: Number(confirmedAmount),
      status: 'CONFIRMED',
      created_at: new Date(this.db.now()).toISOString()
    };

    this.db.insert('receipts', receipt);
    this.db.update('disbursements', 'disbursement_id', disbursementId, { status: 'RECEIPT_CONFIRMED' });

    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'HOSPITAL_CONFIRMED_RECEIPT',
      targetType: 'RECEIPT',
      targetId: rcptId,
      reason: `Hospital confirmed credit matching UTR ${transferUtr}`
    });

    return this.sendJson(res, 201, { receipt });
  }

  async handleReportMismatch(req, res) {
    const user = req.user;
    const { disbursementId, reportedUtr, creditedAmount, expectedAmount } = req.body;

    const disb = this.db.findById('disbursements', 'disbursement_id', disbursementId);
    if (!disb) return this.sendError(res, 404, 'NOT_FOUND', 'Disbursement not found', req.correlationId);

    enforceTenantIsolation(user, disb.hospital_id, 'Discrepancy');

    const excId = generateExceptionId();
    const exceptionRecord = {
      exception_id: excId,
      disbursement_id: disbursementId,
      case_id: disb.case_id,
      hospital_id: disb.hospital_id,
      reported_utr: reportedUtr,
      credited_amount: Number(creditedAmount),
      expected_amount: Number(expectedAmount),
      status: 'OPEN_OPS_INVESTIGATION',
      created_at: new Date(this.db.now()).toISOString()
    };

    this.db.insert('exceptions', exceptionRecord);
    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'DISBURSEMENT_MISMATCH_FLAGGED',
      targetType: 'EXCEPTION',
      targetId: excId,
      reason: `Discrepancy reported: Credited ₹${creditedAmount} vs Expected ₹${expectedAmount}`
    });

    return this.sendJson(res, 201, { exception: exceptionRecord });
  }

  async handleBeneficiaryChangeRequest(req, res) {
    const user = req.user;
    const { branchId, hospitalId, bankName, ifsc, accountNumber, accountHolder } = req.body;

    enforceTenantIsolation(user, hospitalId, 'Beneficiary');

    const benefId = `BENEF-${Date.now().toString(36).toUpperCase()}`;
    const newRecord = {
      beneficiary_id: benefId,
      branch_id: branchId,
      hospital_id: hospitalId,
      account_holder: accountHolder,
      bank_name: bankName,
      ifsc,
      account_number_raw: accountNumber,
      account_number_masked: maskAccount(accountNumber),
      verification_status: 'PENDING_MAKER_CHECKER_APPROVAL',
      maker_id: user.user_id,
      requested_at: new Date(this.db.now()).toISOString()
    };

    this.db.insert('beneficiary_accounts', newRecord);
    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'BENEFICIARY_CHANGE_REQUESTED',
      targetType: 'BENEFICIARY',
      targetId: benefId,
      reason: `Maker submitted bank account change request for branch ${branchId}`
    });

    return this.sendJson(res, 201, { beneficiary: newRecord });
  }

  async handleBeneficiaryApprove(req, res, benefId) {
    const user = req.user;
    if (!hasPermission(user.role, PERMISSIONS.APPROVE_BENEFICIARY_CHANGE)) {
      throw new AccessDeniedError('Checker role (Platform Admin) required to approve hospital bank account changes');
    }

    const benef = this.db.findById('beneficiary_accounts', 'beneficiary_id', benefId);
    if (!benef) return this.sendError(res, 404, 'NOT_FOUND', 'Beneficiary record not found', req.correlationId);

    // Maker-checker rule: Checker cannot be the same person as Maker
    if (benef.maker_id === user.user_id) {
      throw new AccessDeniedError('Dual-authorization violation: Maker cannot approve their own change request', 'MAKER_CHECKER_COLLUSION');
    }

    this.db.update('beneficiary_accounts', 'beneficiary_id', benefId, {
      verification_status: 'VERIFIED',
      checker_id: user.user_id,
      approved_at: new Date(this.db.now()).toISOString()
    });

    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'BENEFICIARY_CHANGE_APPROVED',
      targetType: 'BENEFICIARY',
      targetId: benefId,
      reason: `Checker approved bank account change for branch ${benef.branch_id}`
    });

    return this.sendJson(res, 200, { success: true, status: 'VERIFIED' });
  }

  handleGetPublicOverview(req, res) {
    const activeCases = this.db.find('cases', c => !['CLOSED', 'CANCELLED', 'FACILITATION_CLOSED'].includes(c.case_status)).length;
    const partnerHospitals = this.db.find('organizations', o => o.org_type === 'HOSPITAL').length;
    const partnerLenders = this.db.find('organizations', o => o.org_type === 'NBFC').length;

    return this.sendJson(res, 200, {
      activeCases,
      partnerHospitals,
      partnerLenders,
      platformFeeToBorrower: '₹0',
      directDisbursementRate: '100%'
    });
  }

  async handleLinkCase(req, res) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const { frid } = req.body || {};

    const rateKey = `rate:frid:${ip}`;
    const rateData = this.rateLimitMap.get(rateKey) || { attempts: 0, lockUntil: 0 };

    if (rateData.lockUntil > this.db.now()) {
      const waitMins = Math.ceil((rateData.lockUntil - this.db.now()) / 60000);
      this.db.logAudit({
        actorId: 'ANONYMOUS',
        actorRole: 'BORROWER',
        action: 'FRID_RATE_LIMIT_BLOCKED',
        targetType: 'CASE',
        targetId: frid || 'UNKNOWN',
        reason: `Rate limit enforced on ${ip}: locked for ${waitMins} more minutes.`
      });
      return this.sendError(res, 429, 'RATE_LIMIT_EXCEEDED', `Too many invalid FRID attempts. Please wait ${waitMins} minutes before trying again.`, req.correlationId);
    }

    if (!frid) {
      return this.sendError(res, 400, 'MISSING_FRID', 'FRID reference is required', req.correlationId);
    }

    const cleanFrid = String(frid).toUpperCase().trim();
    const caseRecord = this.db.findOne('cases', c => c.frid === cleanFrid);

    if (!caseRecord) {
      rateData.attempts += 1;
      if (rateData.attempts >= 5) {
        rateData.lockUntil = this.db.now() + 15 * 60 * 1000;
      }
      this.rateLimitMap.set(rateKey, rateData);

      this.db.logAudit({
        actorId: 'ANONYMOUS',
        actorRole: 'BORROWER',
        action: 'FRID_LOOKUP_FAILED',
        targetType: 'CASE',
        targetId: cleanFrid,
        reason: `Invalid FRID lookup attempt (${rateData.attempts}/5)`
      });

      return this.sendError(res, 404, 'CASE_NOT_FOUND', 'Financing case not found for supplied reference', req.correlationId);
    }

    // Success - reset attempts
    this.rateLimitMap.delete(rateKey);

    const sessionCtx = this.authService.getSession(req);
    if (sessionCtx && sessionCtx.user.role === ROLES.BORROWER) {
      this.db.update('cases', 'case_id', caseRecord.case_id, {
        primary_borrower_id: sessionCtx.user.user_id,
        case_status: caseRecord.case_status === 'READY_FOR_INVITATION' ? 'BORROWER_LINKED' : caseRecord.case_status
      });
      caseRecord.primary_borrower_id = sessionCtx.user.user_id;
    }

    const userRole = sessionCtx ? sessionCtx.user.role : 'BORROWER';
    const maskedCase = maskEntityFields(caseRecord, userRole);

    return this.sendJson(res, 200, {
      success: true,
      case: maskedCase
    });
  }

  async handleGetCaseByFrid(req, res, frid) {
    const cleanFrid = String(frid || '').toUpperCase().trim();
    const caseRecord = this.db.findOne('cases', c => c.frid === cleanFrid);
    if (!caseRecord) {
      return this.sendError(res, 404, 'CASE_NOT_FOUND', 'Case not found', req.correlationId);
    }
    return this.sendJson(res, 200, { case: maskEntityFields(caseRecord, 'BORROWER') });
  }

  async handleLookupCase(req, res, parsedUrl) {
    const user = req.user;
    const frid = parsedUrl.searchParams.get('frid');
    if (!frid) return this.sendError(res, 400, 'FRID_REQUIRED', 'FRID query parameter required', req.correlationId);

    const cleanFrid = frid.toUpperCase().trim();
    const caseRecord = this.db.findOne('cases', c => c.frid === cleanFrid);
    if (!caseRecord) return this.sendError(res, 404, 'CASE_NOT_FOUND', 'Case not found', req.correlationId);

    enforceTenantIsolation(user, caseRecord.hospital_id, 'Case');
    const maskedCase = maskEntityFields(caseRecord, user.role);

    return this.sendJson(res, 200, { case: maskedCase });
  }

  async handleExportCases(req, res) {
    const user = req.user;
    if (!hasPermission(user.role, PERMISSIONS.EXPORT_REPORTS)) {
      this.db.logAudit({
        actorId: user.user_id,
        actorRole: user.role,
        action: 'DATA_EXPORT_DENIED',
        targetType: 'REPORT',
        targetId: 'CASES_EXPORT',
        reason: 'User attempted data export without EXPORT_REPORTS permission'
      });
      throw new AccessDeniedError('User role is not authorized to export data records');
    }

    const cases = this.db.find('cases');
    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'DATA_EXPORTED',
      targetType: 'REPORT',
      targetId: 'CASES_EXPORT',
      reason: `User exported ${cases.length} case records`
    });

    return this.sendJson(res, 200, { exportedAt: new Date(this.db.now()).toISOString(), count: cases.length, cases });
  }

  async handleRecordConsent(req, res) {
    const user = req.user;
    const { caseId, purposes, declined } = req.body;

    if (declined) {
      this.db.logAudit({
        actorId: user.user_id,
        actorRole: user.role,
        action: 'BORROWER_DECLINED_CONSENT',
        targetType: 'CASE',
        targetId: caseId,
        reason: 'Borrower declined statutory digital lending consent. Application aborted.'
      });
      return this.sendJson(res, 200, { success: true, status: 'DECLINED' });
    }

    const consentId = `CNS-${Date.now().toString(36).toUpperCase()}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const consentRecord = {
      consent_id: consentId,
      case_id: caseId,
      user_id: user.user_id,
      purposes: purposes || {},
      ip_address: ip,
      granted_at: new Date(this.db.now()).toISOString(),
      status: 'GRANTED',
      future_sharing_stopped: false
    };

    this.db.insert('consents', consentRecord);

    const caseRecord = this.db.findById('cases', 'case_id', caseId);
    if (caseRecord && caseRecord.case_status === 'BORROWER_LINKED') {
      this.db.update('cases', 'case_id', caseId, { case_status: 'CONSENT_GRANTED' });
    }

    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'CONSENT_GRANTED',
      targetType: 'CONSENT',
      targetId: consentId,
      reason: 'Granular unbundled consent granted for Credit Evaluation, Billing Verification, and Retention',
      details: { purposes, ip }
    });

    return this.sendJson(res, 201, { success: true, consent: consentRecord });
  }

  async handleWithdrawConsent(req, res) {
    const user = req.user;
    const { caseId, purpose } = req.body;

    const existingConsent = this.db.findOne('consents', c => c.case_id === caseId && c.user_id === user.user_id);
    if (existingConsent) {
      this.db.update('consents', 'consent_id', existingConsent.consent_id, {
        status: 'WITHDRAWN',
        future_sharing_stopped: true,
        withdrawn_at: new Date(this.db.now()).toISOString()
      });
    }

    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'CONSENT_WITHDRAWN',
      targetType: 'CASE',
      targetId: caseId,
      reason: `Borrower exercised statutory right to withdraw consent for: ${purpose || 'All optional purposes'}. Future data sharing stopped. Mandatory audit retention preserved.`
    });

    return this.sendJson(res, 200, {
      success: true,
      status: 'WITHDRAWN',
      future_sharing_stopped: true,
      statutoryRetentionNotice: 'Future data sharing discontinued. In compliance with RBI digital lending regulations, historical records are retained in immutable audit storage.'
    });
  }

  async handleGetComplianceConsents(req, res) {
    const user = req.user;
    if (!hasPermission(user.role, PERMISSIONS.VIEW_IMMUTABLE_AUDIT)) {
      throw new AccessDeniedError('Compliance role required');
    }
    const consents = this.db.find('consents');
    return this.sendJson(res, 200, { consents });
  }

  async handleRequestStepUpOTP(req, res) {
    const user = req.user;
    const outcome = this.authService.requestStepUpOTP(user);
    return this.sendJson(res, 200, outcome);
  }

  async handleGetUserJournal(req, res) {
    const user = req.user;
    const isFlagOn = this.db.data.config?.featureFlags?.expenseJournal === true;
    if (!isFlagOn) {
      return this.sendError(res, 404, 'FEATURE_DISABLED', 'Personal expense journal feature is disabled', req.correlationId);
    }
    if (user.role !== ROLES.BORROWER) {
      throw new AccessDeniedError('Personal expense journal is strictly restricted to borrower role');
    }
    return this.sendJson(res, 200, { journalEntries: [] });
  }

  async handleDeactivateUser(req, res, targetUserId) {
    const user = req.user;
    if (!hasPermission(user.role, PERMISSIONS.MANAGE_USER_DIRECTORY)) {
      throw new AccessDeniedError('Admin permission required to manage staff accounts');
    }

    const target = this.db.findById('users', 'user_id', targetUserId);
    if (!target) return this.sendError(res, 404, 'USER_NOT_FOUND', 'User does not exist', req.correlationId);

    this.db.update('users', 'user_id', targetUserId, { status: 'DEACTIVATED' });

    const sessions = this.db.find('sessions', s => s.user_id === targetUserId && !s.revoked_at);
    sessions.forEach(s => {
      this.db.update('sessions', 'session_id', s.session_id, { revoked_at: new Date(this.db.now()).toISOString() });
    });

    this.sseHub.notifySessionRevoked(targetUserId);

    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'USER_DEACTIVATED',
      targetType: 'USER',
      targetId: targetUserId,
      reason: `Staff account ${targetUserId} deactivated. All ${sessions.length} active sessions revoked.`
    });

    return this.sendJson(res, 200, {
      success: true,
      user_id: targetUserId,
      status: 'DEACTIVATED',
      revokedSessionsCount: sessions.length
    });
  }

  async handleUnlockUser(req, res, targetUserId) {
    const user = req.user;
    if (!hasPermission(user.role, PERMISSIONS.MANAGE_USER_DIRECTORY)) {
      throw new AccessDeniedError('Admin permission required to manage staff accounts');
    }

    this.db.update('users', 'user_id', targetUserId, {
      locked_until: null,
      failed_attempts: 0
    });

    return this.sendJson(res, 200, { success: true, message: `User ${targetUserId} unlocked` });
  }

  async handleSimulateIncident(req, res) {
    const user = req.user;
    if (!hasPermission(user.role, PERMISSIONS.VIEW_IMMUTABLE_AUDIT)) {
      throw new AccessDeniedError('Platform Admin or Compliance role required');
    }

    const { incidentType, incident_type, affectedRecords, severity, detected_ip } = req.body;
    const incId = `INC-${Date.now().toString(36).toUpperCase()}`;

    const incident = {
      incident_id: incId,
      incident_type: incident_type || incidentType || 'UNAUTHORIZED_ACCESS_ATTEMPT',
      affected_records: affectedRecords || 0,
      reported_by: user.user_id,
      severity: severity || 'HIGH',
      status: 'INVESTIGATING',
      containment_status: 'CONTAINED',
      detected_ip: detected_ip || '127.0.0.1',
      created_at: new Date(this.db.now()).toISOString()
    };

    this.db.insert('incidents', incident);

    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'SECURITY_INCIDENT_REPORTED',
      targetType: 'INCIDENT',
      targetId: incId,
      reason: `Security incident workbench opened for assessment: ${incidentType}`
    });

    return this.sendJson(res, 201, { incident });
  }

  async handleGetReconciliation(req, res) {
    const user = req.user;
    if (!['OPS_MANAGER', 'PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new AccessDeniedError('Operations role required for 3-way reconciliation');
    }

    const disbursements = this.db.find('disbursements');
    const receipts = this.db.find('receipts');

    const lenderTotal = disbursements.filter(d => d.status !== 'REVERSED').reduce((acc, d) => acc + (d.amount || 0), 0);
    const hospitalTotal = receipts.filter(r => r.status === 'CONFIRMED').reduce((acc, r) => acc + (r.confirmed_amount || 0), 0);
    const variance = lenderTotal - hospitalTotal;

    return this.sendJson(res, 200, {
      records: disbursements.map(d => ({
        disbursement_id: d.disbursement_id,
        amount: d.amount,
        status: d.status
      })),
      lenderTransfers: lenderTotal,
      hospitalCredits: hospitalTotal,
      netVariance: variance,
      batchDate: new Date(this.db.now()).toISOString().split('T')[0]
    });
  }

  async handleResolveReconciliationDiscrepancy(req, res) {
    const user = req.user;
    if (!['OPS_MANAGER', 'PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new AccessDeniedError('Operations role required');
    }

    const { exceptionId, evidenceRef } = req.body;
    if (!evidenceRef || !evidenceRef.trim()) {
      return this.sendError(res, 400, 'EVIDENCE_REQUIRED', 'Mandatory verified bank statement evidence or UTR reference is required to resolve discrepancy', req.correlationId);
    }

    this.db.update('exceptions', 'exception_id', exceptionId, {
      status: 'RESOLVED',
      resolved_by: user.user_id,
      evidence_ref: evidenceRef.trim(),
      resolved_at: new Date(this.db.now()).toISOString()
    });

    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'DISCREPANCY_RESOLVED',
      targetType: 'EXCEPTION',
      targetId: exceptionId,
      reason: `Exception resolved with mandatory verified evidence: ${evidenceRef.trim()}`
    });

    return this.sendJson(res, 200, {
      success: true,
      exceptionId,
      status: 'RESOLVED',
      evidenceRef: evidenceRef.trim()
    });
  }

  async handleListTickets(req, res) {
    const tickets = this.db.find('tickets');
    return this.sendJson(res, 200, { tickets });
  }

  async handleCreateTicket(req, res) {
    const user = req.user;
    const { frid, subject, category, message, lenderCode, description, caseId } = req.body;
    const tktId = generateTicketId();

    const isLenderGrievance = category === 'LENDER_KFS_DISCREPANCY' || !!lenderCode;
    const routed_to = isLenderGrievance ? 'NBFC_GRIEVANCE_DESK' : 'LSP_SUPPORT_DESK';

    const newTicket = {
      ticket_id: tktId,
      case_id: caseId || '',
      frid: frid || '',
      user_id: user.user_id,
      subject: subject || description || 'Grievance ticket',
      category: category || 'GENERAL_QUERY',
      message: message || description || '',
      routed_to,
      status: 'OPEN',
      created_at: new Date(this.db.now()).toISOString()
    };

    this.db.insert('tickets', newTicket);

    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'SUPPORT_TICKET_CREATED',
      targetType: 'TICKET',
      targetId: tktId,
      reason: `Support ticket opened: ${newTicket.subject}`
    });

    return this.sendJson(res, 201, { ticket: newTicket });
  }

  async handleGetProductKFS(req, res, productId) {
    const prod = LENDER_PRODUCTS[productId] || LENDER_PRODUCTS['PROD-01'];
    return this.sendJson(res, 200, {
      productId: prod.productId,
      lenderName: prod.lenderName,
      kfsTemplate: prod.kfsTemplate,
      aprDisplay: prod.aprDisplay,
      coolingOffDays: prod.coolingOffDays,
      keyFactDetails: {
        totalInterest: '₹14,500',
        processingFee: '₹1,500',
        netDisbursedToHospital: '₹1,25,000',
        repaymentTenorMonths: 12
      }
    });
  }

  // --- Webhook Handling ---
  async handleWebhookRoute(req, res, pathname, rawBody) {
    const lenderCode = pathname.split('/')[3]?.toLowerCase();
    const adapter = this.lenderAdapters[lenderCode];

    if (!adapter) {
      return this.sendError(res, 404, 'UNKNOWN_LENDER', `No adapter registered for lender '${lenderCode}'`, req.correlationId);
    }

    // 1. Verify HMAC Signature
    const isSignatureValid = adapter.verifyWebhook(req.headers, rawBody);
    if (!isSignatureValid) {
      this.db.logAudit({
        actorId: 'LENDER_WEBHOOK',
        actorRole: 'EXTERNAL_NBFC',
        action: 'WEBHOOK_SIGNATURE_FAILED',
        targetType: 'WEBHOOK',
        targetId: lenderCode,
        reason: 'HMAC signature verification failed. Bad key ID or tampered payload.'
      });
      return this.sendError(res, 401, 'INVALID_SIGNATURE', 'HMAC-SHA256 signature verification failed', req.correlationId);
    }

    const event = JSON.parse(rawBody);
    const eventId = event.event_id;

    // 2. Inbox Deduplication (Idempotency)
    const existing = this.db.findOne('webhook_inbox', e => e.event_id === eventId);
    if (existing) {
      this.db.logAudit({
        actorId: 'LENDER_WEBHOOK',
        actorRole: 'EXTERNAL_NBFC',
        action: 'WEBHOOK_DUPLICATE_IGNORED',
        targetType: 'WEBHOOK',
        targetId: eventId,
        reason: 'Duplicate webhook event received and safely acknowledged without re-processing.'
      });
      return this.sendJson(res, 200, { status: 'IGNORED_DUPLICATE', event_id: eventId });
    }

    // Record in inbox
    this.db.insert('webhook_inbox', {
      event_id: eventId,
      lender_code: lenderCode,
      event_type: event.event_type,
      raw_payload: event,
      processed_at: new Date(this.db.now()).toISOString()
    });

    // 3. Process Canonical Event
    const normalized = adapter.normalizeWebhook(event);

    if (normalized.eventType === 'SANCTION_APPROVED') {
      const caseRecord = this.db.findById('cases', 'case_id', normalized.caseId);
      if (caseRecord) {
        this.db.update('cases', 'case_id', normalized.caseId, {
          case_status: 'SANCTIONED',
          sanction_terms: normalized.payload
        });
        this.sseHub.notifyCaseUpdate(caseRecord, 'SANCTION_APPROVED');
      }
    } else if (normalized.eventType === 'UNDERWRITING_REJECTED') {
      const caseRecord = this.db.findById('cases', 'case_id', normalized.caseId);
      if (caseRecord) {
        this.db.update('cases', 'case_id', normalized.caseId, {
          case_status: 'UNDERWRITING_REJECTED',
          rejection_reason: normalized.payload?.reason || 'Underwriting criteria not met'
        });
        this.sseHub.notifyCaseUpdate(caseRecord, 'UNDERWRITING_REJECTED');
      }
    } else if (normalized.eventType === 'DISBURSEMENT_CONFIRMED') {
      const disbId = generateDisbursementId();
      this.db.insert('disbursements', {
        disbursement_id: disbId,
        case_id: normalized.caseId,
        hospital_id: normalized.payload.hospital_id,
        amount: normalized.payload.amount,
        utr: normalized.payload.utr,
        status: 'CONFIRMED_BY_LENDER',
        confirmed_at: new Date(this.db.now()).toISOString()
      });
      const caseRecord = this.db.findById('cases', 'case_id', normalized.caseId);
      if (caseRecord) {
        this.db.update('cases', 'case_id', normalized.caseId, {
          case_status: 'DISBURSEMENT_PENDING'
        });
        this.sseHub.notifyCaseUpdate(caseRecord, 'DISBURSEMENT_CONFIRMED');
      }
    } else if (normalized.eventType === 'DISBURSEMENT_REVERSED') {
      const disb = this.db.findOne('disbursements', d => d.case_id === normalized.caseId);
      if (disb) {
        this.db.update('disbursements', 'disbursement_id', disb.disbursement_id, {
          status: 'REVERSED',
          reversal_ref: normalized.payload?.reversal_ref
        });
      }
      const caseRecord = this.db.findById('cases', 'case_id', normalized.caseId);
      if (caseRecord) {
        this.db.update('cases', 'case_id', normalized.caseId, {
          case_status: 'DISBURSEMENT_FAILED'
        });
        this.sseHub.notifyCaseUpdate(caseRecord, 'DISBURSEMENT_FAILED');
      }
    }

    this.db.logAudit({
      actorId: 'LENDER_WEBHOOK',
      actorRole: 'EXTERNAL_NBFC',
      action: `WEBHOOK_PROCESSED_${normalized.eventType}`,
      targetType: 'CASE',
      targetId: normalized.caseId,
      reason: `Processed webhook event ${eventId} from ${lenderCode}`
    });

    return this.sendJson(res, 200, { status: 'PROCESSED', event_id: eventId });
  }

  // --- Static Asset Serving & SPA History Fallback ---
  handleStaticRoute(req, res, pathname) {
    if (pathname.startsWith('/shared/')) {
      const rel = pathname.replace(/^\/shared\//, '');
      const sharedPath = path.join(SHARED_DIR, rel);
      if (sharedPath.startsWith(SHARED_DIR) && fs.existsSync(sharedPath)) {
        return this.streamFile(req, res, sharedPath, 'application/javascript; charset=utf-8');
      }
    }

    let filePath = path.join(PUBLIC_DIR, pathname);

    // If root or missing extension, serve index.html (SPA History Fallback)
    if (!path.extname(pathname)) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    // Path traversal check
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html for SPA
        const fallbackPath = path.join(PUBLIC_DIR, 'index.html');
        return this.streamFile(req, res, fallbackPath, 'text/html; charset=utf-8');
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      this.streamFile(req, res, filePath, contentType);
    });
  }

  streamFile(req, res, filePath, contentType) {
    const raw = fs.readFileSync(filePath);
    const acceptEncoding = req.headers['accept-encoding'] || '';

    // Cache policy: index.html has no-store; hashed assets have long cache
    const isHtml = contentType.includes('html');
    const cacheHeader = isHtml
      ? 'no-store, no-cache, must-revalidate'
      : 'public, max-age=31536000, immutable';

    if (acceptEncoding.includes('gzip')) {
      const gzipped = zlib.gzipSync(raw);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Encoding': 'gzip',
        'Cache-Control': cacheHeader
      });
      res.end(gzipped);
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': cacheHeader
      });
      res.end(raw);
    }
  }
}
