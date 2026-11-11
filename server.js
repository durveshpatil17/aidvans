/**
 * Root Server Entry Point
 * Starts both Product BFF Server (Origin A) and Lender Sandbox Server (Origin B)
 * Auto-detects free ports on collision. Never crashes with EADDRINUSE.
 */

import { ProductServer } from './server/server.js';
import { LenderSandboxServer } from './lender-sandbox/server.js';

const PRODUCT_PORT = Number(process.env.PORT) || 3000;
const LENDER_PORT = Number(process.env.LENDER_PORT) || 3001;

async function bootstrap() {
  console.log('--- Starting Aidvans Healthcare Financing Platform ---');

  // 1. Start Lender Sandbox Server (Origin B)
  const lenderSandbox = new LenderSandboxServer(LENDER_PORT, `http://localhost:${PRODUCT_PORT}`);
  const actualLenderPort = await lenderSandbox.start();

  // 2. Start Product BFF Server (Origin A)
  const productServer = new ProductServer(PRODUCT_PORT, `http://localhost:${actualLenderPort}`);
  const actualProductPort = await productServer.start();

  console.log('\n======================================================');
  console.log(` Product BFF Origin:    http://localhost:${actualProductPort}/`);
  console.log(` Lender Sandbox Origin: http://localhost:${actualLenderPort}/`);
  console.log(` Demo Console URL:     http://localhost:${actualProductPort}/demo`);
  console.log('======================================================\n');

  // Handle graceful termination
  const shutdown = async () => {
    console.log('\nGracefully shutting down servers...');
    await Promise.all([productServer.stop(), lenderSandbox.stop()]);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { productServer, lenderSandbox, actualProductPort, actualLenderPort };
}

// Only auto-start when executed directly from CLI
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  bootstrap().catch(err => {
    console.error('Fatal Server Bootstrap Error:', err);
    process.exit(1);
  });
}

export { bootstrap, ProductServer, LenderSandboxServer };
