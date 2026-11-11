/**
 * Atomic JSON Database Manager
 * Zero dependencies, uses Node.js standard 'fs' and 'path'
 * State persists to data/db.json with atomic rename
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from './crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_PATH = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
  ? path.join('/tmp', 'db.json')
  : path.join(ROOT_DIR, 'data', 'db.json');
const SEED_PATH = path.join(ROOT_DIR, 'data', 'seed.json');

export class Database {
  constructor(dbPath = DB_PATH, seedPath = SEED_PATH) {
    this.dbPath = dbPath;
    this.seedPath = seedPath;
    this.data = this.loadOrInit();
  }

  loadOrInit() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to read db.json, reinitializing from seed:', err.message);
    }
    return this.initFromSeed();
  }

  initFromSeed() {
    const rawSeed = fs.readFileSync(this.seedPath, 'utf8');
    const data = JSON.parse(rawSeed);

    // Ensure all required collections exist
    data.cases = data.cases || [];
    data.patients = data.patients || [];
    data.demands = data.demands || [];
    data.funding_requests = data.funding_requests || [];
    data.drawdowns = data.drawdowns || [];
    data.disbursements = data.disbursements || [];
    data.receipts = data.receipts || [];
    data.audit_logs = data.audit_logs || [];
    data.consents = data.consents || [];
    data.exceptions = data.exceptions || [];
    data.tickets = data.tickets || [];
    data.sessions = data.sessions || [];
    data.idempotency_records = data.idempotency_records || [];
    data.webhook_inbox = data.webhook_inbox || [];
    data.simulated_outbox = data.simulated_outbox || { sms: [], email: [] };
    data.time_offset_ms = 0; // For demo clock advancement

    // Enrich users with default password hashes and TOTP secrets
    data.users = data.users.map(u => {
      // Default workforce password is "Password@123"
      const salt = 'a1b2c3d4e5f60718';
      const password_hash = hashPassword('Password@123', salt);
      // Deterministic 16-byte hex secret for testing
      const totp_secret = Buffer.from(u.user_id.padEnd(16, '0')).toString('hex').slice(0, 32);

      return {
        ...u,
        version: u.version || 1,
        password_hash: u.password_hash || password_hash,
        totp_secret: u.totp_secret || totp_secret,
        failed_attempts: u.failed_attempts || 0,
        lock_until: u.lock_until || null,
        force_password_change: u.force_password_change || false,
        mfa_enrolled: u.mfa_enrolled !== undefined ? u.mfa_enrolled : true,
        phone: u.phone || '+91 98000 00000',
        active_otp: null,
        otp_expiry: null,
        otp_attempts: 0
      };
    });

    // Ensure records have version field for optimistic concurrency
    for (const key of ['cases', 'demands', 'funding_requests', 'drawdowns', 'disbursements', 'receipts']) {
      data[key] = data[key].map(item => ({
        ...item,
        version: item.version || 1
      }));
    }

    this.data = data;
    this.persist();
    return data;
  }

  persist() {
    const tempPath = `${this.dbPath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    const jsonStr = JSON.stringify(this.data, null, 2);
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    fs.writeFileSync(tempPath, jsonStr, 'utf8');
    fs.renameSync(tempPath, this.dbPath);
  }

  reset() {
    return this.initFromSeed();
  }

  // Current simulated timestamp (supports demo time acceleration)
  now() {
    return Date.now() + (this.data.time_offset_ms || 0);
  }

  advanceTime(ms) {
    this.data.time_offset_ms = (this.data.time_offset_ms || 0) + Number(ms);
    this.persist();
    return this.now();
  }

  // --- Collection Queries ---
  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  find(collectionName, predicate = () => true) {
    return this.getCollection(collectionName).filter(predicate);
  }

  findOne(collectionName, predicate) {
    return this.getCollection(collectionName).find(predicate);
  }

  findById(collectionName, idKey, idValue) {
    return this.getCollection(collectionName).find(item => item[idKey] === idValue);
  }

  insert(collectionName, record) {
    const col = this.getCollection(collectionName);
    const enriched = {
      ...record,
      version: 1,
      created_at: record.created_at || new Date(this.now()).toISOString(),
      updated_at: new Date(this.now()).toISOString()
    };
    col.push(enriched);
    this.persist();
    return enriched;
  }

  update(collectionName, idKey, idValue, updates, expectedVersion = null) {
    const col = this.getCollection(collectionName);
    const idx = col.findIndex(item => item[idKey] === idValue);
    if (idx === -1) return null;

    const current = col[idx];

    // Optimistic concurrency check
    if (expectedVersion !== null && current.version !== Number(expectedVersion)) {
      const err = new Error(`Optimistic Concurrency Conflict: Record '${idValue}' version mismatch. Expected ${expectedVersion}, found ${current.version}.`);
      err.statusCode = 409;
      err.code = 'VERSION_CONFLICT';
      throw err;
    }

    const updated = {
      ...current,
      ...updates,
      version: (current.version || 1) + 1,
      updated_at: new Date(this.now()).toISOString()
    };
    col[idx] = updated;
    this.persist();
    return updated;
  }

  delete(collectionName, idKey, idValue) {
    const col = this.getCollection(collectionName);
    const idx = col.findIndex(item => item[idKey] === idValue);
    if (idx === -1) return false;
    col.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Append-Only Audit Trail ---
  logAudit({ actorId, actorRole, action, targetType, targetId, reason = '', hospitalId = null, metadata = {} }) {
    const logEntry = {
      log_id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      timestamp: new Date(this.now()).toISOString(),
      actor_id: actorId || 'SYSTEM',
      actor_role: actorRole || 'SYSTEM',
      action,
      target_type: targetType,
      target_id: targetId,
      hospital_id: hospitalId,
      reason,
      metadata
    };
    this.getCollection('audit_logs').push(logEntry);
    this.persist();
    return logEntry;
  }

  // --- Simulated Outboxes (SMS & Email) ---
  queueSMS(recipientPhone, message, otp = null) {
    const entry = {
      id: `SMS-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      recipient: recipientPhone,
      message,
      otp,
      sent_at: new Date(this.now()).toISOString()
    };
    this.data.simulated_outbox.sms.unshift(entry);
    // Keep last 100 entries
    if (this.data.simulated_outbox.sms.length > 100) {
      this.data.simulated_outbox.sms.pop();
    }
    this.persist();
    return entry;
  }

  queueEmail(recipientEmail, subject, body, token = null) {
    const entry = {
      id: `EML-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      recipient: recipientEmail,
      subject,
      body,
      token,
      sent_at: new Date(this.now()).toISOString()
    };
    this.data.simulated_outbox.email.unshift(entry);
    if (this.data.simulated_outbox.email.length > 100) {
      this.data.simulated_outbox.email.pop();
    }
    this.persist();
    return entry;
  }
}

export function resetDb() {
  const db = new Database();
  return db.reset();
}

export function readDb() {
  const db = new Database();
  return db.data;
}

export function writeDb(data) {
  const db = new Database();
  db.data = data;
  db.persist();
  return db.data;
}

