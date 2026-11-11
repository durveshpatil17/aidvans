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
import { ROLES, PERMISSIONS } from '../shared/permissions.js';
import { LenderAAdapter } from './adapters/lenderA.js';
import { LenderBAdapter } from './adapters/lenderB.js';
import { LENDER_PRODUCTS } from './adapters/registry.js';
import { generateSecureToken, generateNumericOTP } from './crypto.js';
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
      if (bodyStr) {
        try {
          req.body = JSON.parse(bodyStr);
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
          return this.serveStaticFile(req, res, '/index.html');
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
      const benefId = pathname.split('/')[4];
      return this.handleBeneficiaryApprove(req, res, benefId);
    }

    // Audit Logs
    if (pathname === '/api/v1/audit/logs' && method === 'GET') {
      if (!hasPermission(user.role, PERMISSIONS.VIEW_IMMUTABLE_AUDIT)) {
        throw new AccessDeniedError('Audit log inspection requires Admin or Compliance role');
      }
      const logs = this.db.find('audit_logs');
      return this.sendJson(res, 200, { logs });
    }

    // Demo Data & Controls
    if (pathname === '/api/v1/demo/state' && method === 'GET') {
      if (!DEMO_MODE) throw new AccessDeniedError('Demo mode disabled');
      return this.sendJson(res, 200, {
        users: this.db.find('users'),
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

    this.db.insert('cases', newCase);

    // Initial Demand
    if (initialDemand) {
      const demandId = generateDemandId();
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
          reversal_ref: normalized.payload.reversal_ref
        });
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
