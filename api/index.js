/**
 * Vercel Serverless Function Entry Point (api/index.js)
 * Routes incoming HTTP requests to Product BFF Server and NBFC Lender Sandbox
 */

import { ProductServer } from '../server/server.js';
import { LenderSandboxServer } from '../lender-sandbox/server.js';

let productServerInstance = null;
let lenderSandboxInstance = null;

function getServers(host) {
  const protocol = host && (host.startsWith('localhost') || host.startsWith('127.0.0.1')) ? 'http' : 'https';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';

  if (!productServerInstance) {
    productServerInstance = new ProductServer(3000, baseUrl);
    lenderSandboxInstance = new LenderSandboxServer(3001, baseUrl);
  } else if (host) {
    productServerInstance.lenderSandboxUrl = baseUrl;
    lenderSandboxInstance.productUrl = baseUrl;
  }
  return { productServer: productServerInstance, lenderSandbox: lenderSandboxInstance };
}

export default async function handler(req, res) {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const { productServer, lenderSandbox } = getServers(host);

    const parsedUrl = new URL(req.url, `http://${host}`);

    // Restore original path if routed through Vercel rewrite
    if (parsedUrl.searchParams.has('__route')) {
      const originalPath = parsedUrl.searchParams.get('__route');
      parsedUrl.searchParams.delete('__route');
      const qs = parsedUrl.searchParams.toString();
      req.url = originalPath + (qs ? `?${qs}` : '');
    } else if (req.headers['x-matched-path'] && !req.headers['x-matched-path'].startsWith('/api/index')) {
      req.url = req.headers['x-matched-path'];
    }

    const effectiveUrl = new URL(req.url, `http://${host}`);
    const pathname = effectiveUrl.pathname;

    // Route to Lender Sandbox if lender endpoints
    if (
      pathname.startsWith('/lender-a/') ||
      pathname.startsWith('/lender-b/') ||
      pathname.startsWith('/hosted/') ||
      pathname === '/lender-sandbox' ||
      pathname.startsWith('/lender-sandbox/')
    ) {
      return await lenderSandbox.handleRequest(req, res);
    }

    // All other API, webhook, and BFF endpoints
    return await productServer.handleRequest(req, res);
  } catch (err) {
    console.error('Unhandled Vercel serverless function exception:', err);
    if (!res.headersSent) {
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify({
        error: {
          code: 'SERVERLESS_FUNCTION_ERROR',
          message: err.message || 'Internal Serverless Execution Error'
        }
      }));
    }
  }
}
