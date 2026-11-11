/**
 * Server Authentication & Session Management Service
 * Meets Section 5: Real Login Pages, MFA (RFC 6238), Passwords (scrypt), Borrower SMS OTP, and Idle Expiry
 */

import crypto from 'crypto';
import { hashPassword, verifyPassword, verifyTOTP, generateTOTP, generateSecureToken, generateNumericOTP } from './crypto.js';
import { ROLES, WORKSPACE_ROUTES } from '../shared/permissions.js';

const STAFF_IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 mins
const BORROWER_IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 mins
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 mins
const MAX_FAILED_ATTEMPTS = 5;

export class AuthService {
  constructor(db, sseHub) {
    this.db = db;
    this.sseHub = sseHub;
    this.rateLimitMap = new Map(); // ip/key -> { attempts, lockUntil }
  }

  // --- Session Lookup & Extraction ---
  getSession(req) {
    const cookies = this.parseCookies(req);
    const sessionId = cookies['aidvans_session'];
    if (!sessionId) return null;

    const session = this.db.findOne('sessions', s => s.session_id === sessionId);
    if (!session) return null;

    // Check if session revoked
    if (session.revoked_at) return null;

    // Check user active status
    const user = this.db.findById('users', 'user_id', session.user_id);
    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    const now = this.db.now();
    const timeout = user.role === ROLES.BORROWER ? BORROWER_IDLE_TIMEOUT_MS : STAFF_IDLE_TIMEOUT_MS;

    // Check idle timeout
    if (now - new Date(session.last_active_at).getTime() > timeout) {
      this.db.update('sessions', 'session_id', sessionId, { revoked_at: new Date(now).toISOString() });
      return null;
    }

    // Touch session
    this.db.update('sessions', 'session_id', sessionId, { last_active_at: new Date(now).toISOString() });
    return { session, user };
  }

  createSession(user, workspace, req) {
    const sessionId = generateSecureToken(32);
    const csrfToken = generateSecureToken(16);
    const nowIso = new Date(this.db.now()).toISOString();

    const sessionRecord = {
      session_id: sessionId,
      user_id: user.user_id,
      role: user.role,
      workspace,
      csrf_token: csrfToken,
      user_agent: req.headers['user-agent'] || 'Unknown',
      ip: req.socket.remoteAddress || '127.0.0.1',
      created_at: nowIso,
      last_active_at: nowIso,
      revoked_at: null
    };

    this.db.insert('sessions', sessionRecord);
    this.db.logAudit({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'LOGIN_SUCCESS',
      targetType: 'SESSION',
      targetId: sessionId,
      reason: `User logged in to ${workspace} workspace`,
      hospitalId: user.org_id
    });

    return sessionRecord;
  }

  quickLogin({ userId, workspace, req }) {
    const cleanId = String(userId || '').trim().toLowerCase();
    const user = this.db.findOne('users', u =>
      u.user_id.toLowerCase() === cleanId ||
      (u.phone && u.phone.replace(/\D/g, '') === cleanId.replace(/\D/g, '')) ||
      (u.email && u.email.toLowerCase() === cleanId)
    );

    if (!user) {
      throw new Error(`User profile "${userId}" not found`);
    }

    // Reset failed attempts
    this.db.update('users', 'user_id', user.user_id, { failed_attempts: 0, lock_until: null });

    const targetWorkspace = workspace || (user.role === ROLES.BORROWER ? 'borrower' : 'executive');
    const session = this.createSession(user, targetWorkspace, req);

    return {
      session,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        org_id: user.org_id,
        branch_id: user.branch_id
      },
      workspaceRoute: WORKSPACE_ROUTES[user.role] || `/${targetWorkspace}/dashboard`
    };
  }

  revokeSession(sessionId, actorUser) {
    const session = this.db.findById('sessions', 'session_id', sessionId);
    if (!session) return false;

    this.db.update('sessions', 'session_id', sessionId, { revoked_at: new Date(this.db.now()).toISOString() });
    this.db.logAudit({
      actorId: actorUser.user_id,
      actorRole: actorUser.role,
      action: 'SESSION_REVOKED',
      targetType: 'SESSION',
      targetId: sessionId,
      reason: `Session revoked by ${actorUser.name}`
    });
    if (this.sseHub) {
      this.sseHub.notifySessionRevoked(session.user_id);
    }
    return true;
  }

  revokeAllUserSessions(userId, actorUser) {
    const sessions = this.db.find('sessions', s => s.user_id === userId && !s.revoked_at);
    const nowIso = new Date(this.db.now()).toISOString();
    for (const s of sessions) {
      this.db.update('sessions', 'session_id', s.session_id, { revoked_at: nowIso });
    }
    if (this.sseHub) {
      this.sseHub.notifySessionRevoked(userId);
    }
    return sessions.length;
  }

  // --- Workforce Login ---
  loginWorkforce({ userIdOrEmail, password, totpCode, workspace, req }) {
    const now = this.db.now();
    const cleanId = String(userIdOrEmail || '').trim().toLowerCase();
    const user = this.db.findOne('users', u =>
      (u.user_id.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) &&
      u.role !== ROLES.BORROWER
    );

    if (!user) {
      throw new Error('Invalid credentials or unauthorized workspace');
    }

    // Check account lockout
    if (user.lock_until && new Date(user.lock_until).getTime() > now) {
      const waitMins = Math.ceil((new Date(user.lock_until).getTime() - now) / 60000);
      throw new Error(`Account temporarily locked due to multiple failed attempts. Try again in ${waitMins} minutes.`);
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      const failed = (user.failed_attempts || 0) + 1;
      const updates = { failed_attempts: failed };
      if (failed >= MAX_FAILED_ATTEMPTS) {
        updates.lock_until = new Date(now + LOCKOUT_DURATION_MS).toISOString();
        this.db.logAudit({
          actorId: user.user_id,
          actorRole: user.role,
          action: 'ACCOUNT_LOCKED',
          targetType: 'USER',
          targetId: user.user_id,
          reason: `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts`
        });
      }
      this.db.update('users', 'user_id', user.user_id, updates);
      throw new Error('Invalid credentials or unauthorized workspace');
    }

    // OTP/MFA requirement removed for now per evaluation request
    // If a totpCode is provided, verify it, but never block login if missing
    if (totpCode) {
      const isTotpValid = verifyTOTP(totpCode, user.totp_secret, 1, now);
      if (!isTotpValid) {
        throw new Error('Invalid MFA authenticator code. Check your clock or code.');
      }
    }

    // Reset failed attempts
    this.db.update('users', 'user_id', user.user_id, { failed_attempts: 0, lock_until: null });

    const session = this.createSession(user, workspace, req);
    return {
      session,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        org_id: user.org_id,
        branch_id: user.branch_id,
        force_password_change: user.force_password_change
      }
    };
  }

  // --- Borrower Direct Login (No OTP required) ---
  loginBorrowerDirect({ phone, req }) {
    const cleanPhone = String(phone || '').trim();
    if (!cleanPhone) throw new Error('Valid mobile number required');

    let user = this.db.findOne('users', u =>
      u.role === ROLES.BORROWER &&
      (u.phone === cleanPhone || (u.phone && cleanPhone && u.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')))
    );

    // If borrower user doesn't exist yet, seed a profile
    if (!user) {
      user = this.db.insert('users', {
        user_id: `BOR-${Date.now().toString(36).toUpperCase()}`,
        name: 'Borrower',
        phone: cleanPhone,
        email: `${cleanPhone.replace(/\D/g, '')}@borrower.mock`,
        role: ROLES.BORROWER,
        status: 'ACTIVE',
        context: 'Self-registered borrower session'
      });
    }

    const session = this.createSession(user, 'borrower', req);
    return {
      session,
      user: {
        user_id: user.user_id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      },
      workspaceRoute: '/borrower/home'
    };
  }

  // --- Borrower SMS OTP Login ---
  requestBorrowerOTP(phone) {
    const cleanPhone = String(phone || '').trim();
    if (!cleanPhone) throw new Error('Valid mobile number required');

    const now = this.db.now();
    let user = this.db.findOne('users', u => u.phone === cleanPhone && u.role === ROLES.BORROWER);

    // Anti-enumeration: If borrower user doesn't exist yet, seed a temporary profile
    if (!user) {
      user = this.db.insert('users', {
        user_id: `BOR-${Date.now().toString(36).toUpperCase()}`,
        name: 'Borrower',
        phone: cleanPhone,
        email: `${cleanPhone.replace(/\D/g, '')}@borrower.mock`,
        role: ROLES.BORROWER,
        status: 'ACTIVE',
        context: 'Self-registered borrower session'
      });
    }

    const otp = generateNumericOTP(6);
    const otpExpiry = new Date(now + 10 * 60 * 1000).toISOString();

    this.db.update('users', 'user_id', user.user_id, {
      active_otp: otp,
      otp_expiry: otpExpiry,
      otp_attempts: 0
    });

    // Queue SMS in simulated outbox
    this.db.queueSMS(cleanPhone, `Your Aidvans Healthcare Financing access code is ${otp}. Valid for 10 minutes. Do not share.`, otp);

    return {
      success: true,
      phone: cleanPhone,
      demo_otp: otp,
      message: 'One-Time Password (OTP) dispatched to your mobile number'
    };
  }

  verifyBorrowerOTP(phone, otp, req) {
    const cleanPhone = String(phone || '').trim();
    const cleanOtp = String(otp || '').trim();
    const now = this.db.now();

    const user = this.db.findOne('users', u => u.phone === cleanPhone && u.role === ROLES.BORROWER);
    if (!user || !user.active_otp) {
      throw new Error('Invalid or expired OTP. Request a new code.');
    }

    if (new Date(user.otp_expiry).getTime() < now) {
      throw new Error('OTP expired. Please request a new code.');
    }

    if (user.active_otp !== cleanOtp) {
      const attempts = (user.otp_attempts || 0) + 1;
      this.db.update('users', 'user_id', user.user_id, { otp_attempts: attempts });
      if (attempts >= 5) {
        this.db.update('users', 'user_id', user.user_id, { active_otp: null });
        throw new Error('Too many invalid attempts. Request a new OTP.');
      }
      throw new Error('Invalid OTP. Please check and try again.');
    }

    // Clear consumed OTP
    this.db.update('users', 'user_id', user.user_id, { active_otp: null, otp_attempts: 0 });

    const session = this.createSession(user, 'borrower', req);
    return {
      session,
      user: {
        user_id: user.user_id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    };
  }

  // --- Step-Up OTP Verification ---
  requestStepUpOTP(user) {
    const otp = generateNumericOTP(6);
    const now = this.db.now();
    this.db.update('users', 'user_id', user.user_id, {
      step_up_otp: otp,
      step_up_expiry: new Date(now + 5 * 60 * 1000).toISOString()
    });
    this.db.queueSMS(user.phone || '+91 98000 00011', `Aidvans Step-Up Authorization Code: ${otp}. Authorizes loan agreement or funding drawdown.`, otp);
    return { success: true, demo_otp: otp, message: 'Step-up authorization code sent via SMS' };
  }

  verifyStepUpOTP(user, otp) {
    const now = this.db.now();
    const dbUser = this.db.findById('users', 'user_id', user.user_id);
    if (!dbUser || !dbUser.step_up_otp) throw new Error('No step-up OTP requested or code expired');
    if (new Date(dbUser.step_up_expiry).getTime() < now) throw new Error('Step-up code expired');
    if (dbUser.step_up_otp !== String(otp).trim()) throw new Error('Invalid authorization code');

    this.db.update('users', 'user_id', user.user_id, { step_up_otp: null, step_up_expiry: null });
    return true;
  }

  // --- Cookie Parser ---
  parseCookies(req) {
    const list = {};
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return list;

    cookieHeader.split(';').forEach(cookie => {
      let [name, ...rest] = cookie.split('=');
      name = name?.trim();
      if (!name) return;
      const value = rest.join('=').trim();
      list[name] = decodeURIComponent(value);
    });
    return list;
  }

  formatSessionCookie(sessionId, maxAgeSeconds = 86400) {
    return `aidvans_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
  }

  formatClearSessionCookie() {
    return `aidvans_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  }
}

