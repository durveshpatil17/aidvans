/**
 * Standalone Regulated NBFC Sandbox Server (Origin B)
 * Operates on port 3001 (or next free port) completely separate from Product BFF.
 * Simulates NBFC underwriting, direct hospital transfers, hosted journeys, and HMAC signed webhooks.
 */

import http from 'http';
import { generateHMAC, generateSecureToken } from '../server/crypto.js';

const DEFAULT_LENDER_PORT = Number(process.env.LENDER_PORT) || 3001;

export class LenderSandboxServer {
  constructor(port = DEFAULT_LENDER_PORT, productUrl = 'http://localhost:3000') {
    this.initialPort = port;
    this.port = port;
    this.productUrl = productUrl;
    this.server = null;
    this.state = {
      applications: new Map(),
      offers: new Map(),
      disbursements: new Map(),
      loans: new Map(),
      webhookHistory: []
    };
  }

  start() {
    return new Promise((resolve, reject) => {
      const tryListen = (currentPort) => {
        const srv = http.createServer((req, res) => this.handleRequest(req, res));

        srv.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.warn(`Lender Sandbox Port ${currentPort} busy, trying ${currentPort + 1}...`);
            tryListen(currentPort + 1);
          } else {
            reject(err);
          }
        });

        srv.listen(currentPort, () => {
          this.port = currentPort;
          this.server = srv;
          console.log(`Lender Sandbox (Origin B) running at http://localhost:${this.port}/`);
          resolve(this.port);
        });
      };

      tryListen(this.initialPort);
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  async handleRequest(req, res) {
    const parsed = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsed.pathname;

    // CORS for API / Iframe
    res.setHeader('Access-Control-Allow-Origin', this.productUrl);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const dispatch = async (data) => {
      try {
        // --- Lender A REST Endpoints ---
        if (pathname === '/lender-a/api/applications/submit') {
          return this.handleLenderASubmit(req, res, data);
        }
        if (pathname.startsWith('/lender-a/api/applications/') && pathname.endsWith('/offers')) {
          const appId = pathname.split('/')[4];
          return this.handleGetOffers(req, res, 'LENDER_A', appId);
        }
        if (pathname.startsWith('/lender-a/api/offers/') && pathname.endsWith('/kfs')) {
          const offerId = pathname.split('/')[4];
          return this.handleGetKfs(req, res, 'LENDER_A', offerId);
        }

        // --- Lender B REST Endpoints ---
        if (pathname === '/lender-b/api/facility/apply') {
          return this.handleLenderBSubmit(req, res, data);
        }
        if (pathname.startsWith('/lender-b/api/facility/') && pathname.endsWith('/offers')) {
          const appId = pathname.split('/')[4];
          return this.handleGetOffers(req, res, 'LENDER_B', appId);
        }
        if (pathname.startsWith('/lender-b/api/facility/offers/') && pathname.endsWith('/kfs')) {
          const offerId = pathname.split('/')[5];
          return this.handleGetKfs(req, res, 'LENDER_B', offerId);
        }

        // --- Hosted Redirect Journeys (Cross-Origin) ---
        if (pathname === '/hosted/redirect/kyc') {
          return this.renderHostedKycPage(req, res, parsed);
        }
        if (pathname === '/hosted/redirect/esign') {
          return this.renderHostedEsignPage(req, res, parsed);
        }

        // --- Hosted Iframe Journeys (Cross-Origin) ---
        if (pathname === '/hosted/iframe/application') {
          return this.renderHostedIframePage(req, res, parsed, 'Application');
        }
        if (pathname === '/hosted/iframe/kyc') {
          return this.renderHostedIframePage(req, res, parsed, 'KYC');
        }

        // --- Lender Sandbox Control API (Trigger webhooks) ---
        if (pathname === '/api/sandbox/trigger-webhook') {
          return this.handleTriggerWebhook(req, res, data);
        }

        // Default: Console UI
        if (pathname === '/' || pathname === '/console') {
          return this.renderConsoleUI(req, res);
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found on Lender Sandbox' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    };

    // Immediate dispatch for GET/HEAD, pre-ended streams, or pre-parsed bodies
    const isStreamEnded = Boolean(req.readableEnded || req.complete);
    const isNoBodyMethod = req.method === 'GET' || req.method === 'HEAD';
    const hasParsedBody = req.body !== undefined && req.body !== null;

    if (isNoBodyMethod || isStreamEnded || hasParsedBody) {
      let data = {};
      if (typeof req.body === 'object' && req.body !== null) {
        data = req.body;
      } else if (typeof req.body === 'string' && req.body.trim()) {
        try { data = JSON.parse(req.body); } catch {}
      }
      return dispatch(data);
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      let data = {};
      try {
        if (body) data = JSON.parse(body);
      } catch {}
      return dispatch(data);
    });
    req.on('error', (err) => {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
  }

  handleLenderASubmit(req, res, data) {
    const appId = data.partner_application_ref || `APP-${Date.now()}`;
    const record = {
      appId,
      lenderCode: 'LENDER_A',
      status: 'UNDERWRITING_IN_PROGRESS',
      caseId: data.case_id,
      frid: data.frid,
      applicant: data.applicant,
      demand: data.hospital_demand,
      receivedAt: new Date().toISOString()
    };
    this.state.applications.set(appId, record);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      partner_application_ref: appId,
      status: 'ACKNOWLEDGED',
      message: 'Application acknowledged by CareFinance Underwriting Engine'
    }));
  }

  handleLenderBSubmit(req, res, data) {
    const appId = data.facility_request_id || `APP-FAC-${Date.now()}`;
    const record = {
      appId,
      lenderCode: 'LENDER_B',
      status: 'UNDERWRITING_IN_PROGRESS',
      caseId: data.case_id,
      frid: data.frid,
      applicant: data.applicant,
      initialTranche: data.initial_tranche,
      receivedAt: new Date().toISOString()
    };
    this.state.applications.set(appId, record);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      facility_request_id: appId,
      status: 'ACKNOWLEDGED',
      message: 'Staged care facility request acknowledged by HealthCredit Underwriting'
    }));
  }

  handleGetOffers(req, res, lenderCode, appId) {
    const app = this.state.applications.get(appId) || { demand: { amount: 125000 } };
    const amount = app.demand?.amount || 125000;

    const offerId = `OFFER-${lenderCode}-${Date.now().toString(36).toUpperCase()}`;
    const offer = {
      offerId,
      lenderCode,
      lenderName: lenderCode === 'LENDER_A' ? 'CareFinance Capital NBFC' : 'HealthCredit India NBFC',
      sanctionedAmount: amount,
      apr: lenderCode === 'LENDER_A' ? '13.5% p.a.' : '14.2% p.a.',
      tenorMonths: 12,
      emi: lenderCode === 'LENDER_A' ? 11195 : 11238,
      asOfTimestamp: new Date().toISOString(),
      coolingOffDays: 3,
      disclaimer: 'Authoritative lender quote per RBI Digital Lending Guidelines. Final terms locked in KFS.'
    };
    this.state.offers.set(offerId, offer);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ offers: [offer] }));
  }

  handleGetKfs(req, res, lenderCode, offerId) {
    const offer = this.state.offers.get(offerId) || { sanctionedAmount: 125000, emi: 11195 };
    const kfsDocument = {
      kfsId: `KFS-${lenderCode}-${Date.now().toString(36).toUpperCase()}`,
      offerId,
      lenderLegalName: lenderCode === 'LENDER_A' ? 'CareFinance Capital NBFC Private Limited' : 'HealthCredit India NBFC Limited',
      rbiRegistrationNo: lenderCode === 'LENDER_A' ? 'RBI-NBFC-B-14.00981' : 'RBI-NBFC-N-07.00452',
      sanctionedAmount: offer.sanctionedAmount,
      totalInterestCharge: Math.round(offer.sanctionedAmount * 0.075),
      apr: offer.apr || '13.5% p.a.',
      tenorMonths: offer.tenorMonths || 12,
      monthlyInstallment: offer.emi,
      coolingOffPeriodDays: 3,
      beneficiaryHospitalVerificationMandate: 'Direct NEFT/RTGS to verified hospital bank account only. Zero borrower cash disbursement.',
      generatedAt: new Date().toISOString()
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(kfsDocument));
  }

  // --- Hosted Redirect Journeys ---
  renderHostedKycPage(req, res, parsed) {
    const returnUrl = parsed.searchParams.get('return_url');
    const stateToken = parsed.searchParams.get('state');

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CareFinance Regulated Partner e-KYC</title>
        <style>body{font-family:sans-serif;padding:32px;background:#f8fafc;color:#0f172a;max-width:480px;margin:40px auto;border:1px solid #cbd5e1;border-radius:8px;}</style>
      </head>
      <body>
        <h2>Regulated NBFC Hosted e-KYC</h2>
        <p>You have been redirected to the secure verification endpoint of <strong>CareFinance Capital NBFC</strong> (RBI Reg: RBI-NBFC-B-14.00981).</p>
        <div style="background:#e0f2fe;padding:12px;border-radius:4px;margin:16px 0;font-size:0.875rem;">
          Simulated Aadhaar OTP verification via UIDAI authentication service.
        </div>
        <form action="${returnUrl || `${this.productUrl}/borrower/offers`}" method="GET">
          <input type="hidden" name="state" value="${stateToken || ''}">
          <input type="hidden" name="kyc_token" value="KYC_VERIFIED_${Date.now()}">
          <button type="submit" style="background:#2563eb;color:#fff;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;font-weight:600;width:100%;">
            Verify with Aadhaar OTP & Complete
          </button>
        </form>
      </body>
      </html>
    `);
  }

  renderHostedEsignPage(req, res, parsed) {
    const returnUrl = parsed.searchParams.get('return_url');
    const stateToken = parsed.searchParams.get('state');

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Regulated Digital Loan Agreement Execution</title>
        <style>body{font-family:sans-serif;padding:32px;background:#f8fafc;color:#0f172a;max-width:480px;margin:40px auto;border:1px solid #cbd5e1;border-radius:8px;}</style>
      </head>
      <body>
        <h2>NBFC Digital Loan Agreement (E-Sign)</h2>
        <p>Executing bilateral loan contract with <strong>CareFinance Capital NBFC</strong>.</p>
        <div style="background:#fef3c7;padding:12px;border-radius:4px;margin:16px 0;font-size:0.875rem;">
          Mandatory KFS acknowledgement: Disbursed directly to verified hospital beneficiary account.
        </div>
        <form action="${returnUrl || `${this.productUrl}/borrower/offers`}" method="GET">
          <input type="hidden" name="state" value="${stateToken || ''}">
          <input type="hidden" name="agreement_token" value="AGR_SIGNED_${Date.now()}">
          <button type="submit" style="background:#15803d;color:#fff;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;font-weight:600;width:100%;">
            E-Sign via Digital Signature & Return
          </button>
        </form>
      </body>
      </html>
    `);
  }

  renderHostedIframePage(req, res, parsed, stepName) {
    const refuseFraming = parsed.searchParams.get('refuse_framing') === 'true';

    if (refuseFraming) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'DENY'
      });
      res.end(`<html><body><h1>Framing Refused by NBFC Policy</h1></body></html>`);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Embedded NBFC ${stepName}</title>
        <style>body{font-family:sans-serif;padding:16px;background:#ffffff;color:#1e293b;}</style>
      </head>
      <body>
        <div style="border:1px dashed #94a3b8;padding:16px;border-radius:6px;">
          <h3>HealthCredit NBFC Embedded ${stepName}</h3>
          <p style="font-size:0.875rem;">This step is securely hosted in an iframe by HealthCredit India NBFC.</p>
          <button type="button" id="btn-done" style="background:#2563eb;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">
            Complete Step
          </button>
        </div>
        <script>
          document.getElementById('btn-done').addEventListener('click', () => {
            // Emit postMessage to parent origin
            window.parent.postMessage({
              type: 'LENDER_IFRAME_COMPLETED',
              step: '${stepName}',
              token: 'IFRAME_SUCCESS_' + Date.now()
            }, '${this.productUrl}');
          });
        </script>
      </body>
      </html>
    `);
  }

  // --- Dispatch HMAC-Signed Webhook to Product BFF ---
  async dispatchWebhook({ lenderCode, eventType, caseId, applicationId, data, keyId = 'key_carefin_2026_primary', secret = 'sec_carefin_primary_9876543210', overrideSignature = null, overrideTimestamp = null, eventId = null }) {
    const finalEventId = eventId || `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timestamp = overrideTimestamp || Date.now();

    const payloadObj = {
      event_id: finalEventId,
      event_type: eventType,
      case_id: caseId,
      application_id: applicationId,
      timestamp,
      data
    };

    const rawBody = JSON.stringify(payloadObj);
    const signature = overrideSignature || generateHMAC(secret, rawBody);

    const webhookUrl = new URL(`/webhooks/lender/${lenderCode.toLowerCase()}`, this.productUrl);

    return new Promise((resolve, reject) => {
      const req = http.request(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(rawBody),
          'x-lender-signature': signature,
          'x-lender-key-id': keyId,
          'x-lender-timestamp': String(timestamp)
        }
      }, (res) => {
        let respData = '';
        res.on('data', chunk => respData += chunk);
        res.on('end', () => {
          const outcome = {
            statusCode: res.statusCode,
            response: respData,
            eventId: finalEventId
          };
          this.state.webhookHistory.push(outcome);
          resolve(outcome);
        });
      });

      req.on('error', reject);
      req.write(rawBody);
      req.end();
    });
  }

  async handleTriggerWebhook(req, res, data) {
    const outcome = await this.dispatchWebhook(data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(outcome));
  }

  renderConsoleUI(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Regulated NBFC Simulator Console (Origin B)</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; background: #f8fafc; color: #0f172a; max-width: 800px; margin: 0 auto; }
          .card { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .badge { display: inline-block; padding: 2px 8px; font-size: 0.75rem; font-weight: 700; border-radius: 4px; background: #e2e8f0; }
        </style>
      </head>
      <body>
        <h1>Regulated NBFC Sandbox Panel (Origin B)</h1>
        <p>Port: <strong>${this.port}</strong> &bull; Target Product URL: <strong>${this.productUrl}</strong></p>
        <div class="card">
          <h3>Active Simulated Applications: ${this.state.applications.size}</h3>
          <p style="font-size:0.875rem;color:#64748b;">Controls and webhook dispatch history.</p>
        </div>
      </body>
      </html>
    `);
  }
}

