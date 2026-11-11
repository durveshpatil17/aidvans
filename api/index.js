/**
 * Vercel Serverless Function Entry Point (api/index.js)
 * Routes incoming HTTP requests to Product BFF Server and NBFC Lender Sandbox
 */

import { ProductServer } from '../server/server.js';
import { LenderSandboxServer } from '../lender-sandbox/server.js';

let productServerInstance = null;
let lenderSandboxInstance = null;

function getServers(host) {
  if (!productServerInstance) {
    const protocol = host && (host.startsWith('localhost') || host.startsWith('127.0.0.1')) ? 'http' : 'https';
    const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
    productServerInstance = new ProductServer(3000, baseUrl);
    lenderSandboxInstance = new LenderSandboxServer(3001, baseUrl);
  }
  return { productServer: productServerInstance, lenderSandbox: lenderSandboxInstance };
}

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const { productServer, lenderSandbox } = getServers(host);

  const parsedUrl = new URL(req.url, `http://${host}`);
  const pathname = parsedUrl.pathname;

  // Route to Lender Sandbox if lender endpoints
  if (pathname.startsWith('/lender-a/') || pathname.startsWith('/lender-b/') || pathname === '/lender-sandbox' || pathname.startsWith('/lender-sandbox/')) {
    return lenderSandbox.handleRequest(req, res);
  }

  // All other API, webhook, and BFF endpoints
  return productServer.handleRequest(req, res);
}
