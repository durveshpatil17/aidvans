/**
 * Pure Vanilla HTTP API Client
 * Wraps native fetch with CSRF tokens, Idempotency keys, and Correlation IDs
 */

export class ApiClient {
  constructor() {
    this.csrfToken = null;
    this.lastCorrelationId = null;
  }

  setCsrfToken(token) {
    this.csrfToken = token;
  }

  async request(path, options = {}) {
    const method = options.method || 'GET';
    const headers = {
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    if (this.csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const response = await fetch(path, {
      ...options,
      method,
      headers
    });

    this.lastCorrelationId = response.headers.get('x-correlation-id');

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const err = new Error(data?.error?.message || `HTTP ${response.status}`);
      err.status = response.status;
      err.code = data?.error?.code || 'API_ERROR';
      err.correlationId = this.lastCorrelationId;
      err.details = data?.error?.details;
      throw err;
    }

    return data;
  }

  get(path, headers) { return this.request(path, { method: 'GET', headers }); }
  post(path, body, idempotencyKey, headers) { return this.request(path, { method: 'POST', body, idempotencyKey, headers }); }
  put(path, body, headers) { return this.request(path, { method: 'PUT', body, headers }); }
  delete(path, headers) { return this.request(path, { method: 'DELETE', headers }); }
}

export const api = new ApiClient();

