/**
 * Idempotency Key Manager
 * Fulfills Section 4.3: Mutating requests require Idempotency-Key; replayed key returns original response.
 */

export class IdempotencyManager {
  constructor(db) {
    this.db = db;
    this.inFlight = new Set();
  }

  getKey(req, userId) {
    const rawKey = req.headers['idempotency-key'];
    if (!rawKey) return null;
    return `${userId}:${req.method}:${req.url}:${rawKey.trim()}`;
  }

  isProcessing(key) {
    return this.inFlight.has(key);
  }

  startProcessing(key) {
    this.inFlight.add(key);
  }

  endProcessing(key) {
    this.inFlight.delete(key);
  }

  getRecord(key) {
    return this.db.findOne('idempotency_records', r => r.key === key);
  }

  saveRecord(key, statusCode, headers, body) {
    const record = {
      key,
      status_code: statusCode,
      headers: {
        'content-type': headers['content-type'] || 'application/json; charset=utf-8',
        'x-idempotent-replayed': 'true'
      },
      body: typeof body === 'object' ? JSON.stringify(body) : String(body),
      created_at: new Date(this.db.now()).toISOString()
    };
    this.db.insert('idempotency_records', record);
    return record;
  }
}

