/**
 * Frontend Application Bootstrap (app.js)
 * Initializes HistoryRouter, SessionManager, and dynamic workspace views.
 */

import { HistoryRouter } from './router.js';
import { SessionManager } from './session.js';
import { SSEClient } from './sse.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';

const router = new HistoryRouter('app-root');

const session = new SessionManager(
  // On idle warning (60s countdown)
  async (secondsLeft) => {
    const keepActive = await modal.confirm({
      title: 'Session Inactivity Warning',
      message: `Your session has been idle and will expire in ${secondsLeft} seconds. Do you wish to stay signed in?`,
      confirmText: 'Stay Signed In',
      cancelText: 'Sign Out'
    });

    if (keepActive) {
      await session.staySignedIn();
      toast.info('Session refreshed.');
    } else {
      await session.logout();
      window.location.href = '/';
    }
  },
  // On session expired
  () => {
    toast.warning('Your session has expired due to inactivity. Please sign in again.');
    const workspace = session.workspace || 'executive';
    window.location.href = `/${workspace}/login?expired=1`;
  }
);

// Connect SSE client for live updates
const sse = new SSEClient((eventType, payload) => {
  if (eventType === 'case_updated') {
    toast.info(`Case ${payload.frid || payload.case_id} updated: ${payload.action}`);
    // If the active view has a refresh handler, invoke it
    if (typeof window.__REFRESH_ACTIVE_VIEW__ === 'function') {
      window.__REFRESH_ACTIVE_VIEW__();
    }
  } else if (eventType === 'session_revoked') {
    toast.danger('Your session has been terminated by an administrator.');
    window.location.href = '/';
  }
});

// --- Register Core Views ---

// Public Pages
router.register('/', async () => {
  const { renderPublicHome } = await import('../workspaces/public/home.js');
  return renderPublicHome();
}, { title: 'Healthcare Financing LSP — National Network' });

router.register('/how-it-works', async () => {
  const { renderHowItWorks } = await import('../workspaces/public/how-it-works.js');
  return renderHowItWorks();
}, { title: 'How It Works — Digital Healthcare Financing' });

router.register('/privacy', async () => {
  const { renderPrivacy } = await import('../workspaces/public/privacy.js');
  return renderPrivacy();
}, { title: 'Data Privacy Notice' });

router.register('/grievance', async () => {
  const { renderGrievance } = await import('../workspaces/public/grievance.js');
  return renderGrievance();
}, { title: 'Grievance Redressal Mechanism' });

router.register('/status', async () => {
  const { renderStatus } = await import('../workspaces/public/status.js');
  return renderStatus();
}, { title: 'System Status & Uptime' });

// Unified One-Click Logins Portal
router.register('/login', async () => {
  const { renderAllLoginsPortal } = await import('../workspaces/public/login-portal.js');
  return renderAllLoginsPortal({ router, session });
}, { title: 'One-Click Workspace Access Portal' });

// Auth / Login Pages per Workspace
const WORKSPACES = ['executive', 'hospital', 'borrower', 'ops', 'admin', 'compliance', 'support'];
for (const ws of WORKSPACES) {
  router.register(`/${ws}/login`, async ({ pathname }) => {
    const { renderWorkspaceLogin } = await import(`../workspaces/${ws}/login.js`);
    return renderWorkspaceLogin({ router, session });
  }, { title: `${ws.charAt(0).toUpperCase() + ws.slice(1)} Workspace Login` });
}

// Workspace Routers (Loaded Dynamically)
router.register('/executive/:view', async (ctx) => {
  const { renderExecutiveWorkspace } = await import('../workspaces/executive/index.js');
  return renderExecutiveWorkspace(ctx, { router, session });
}, { title: 'Executive Desk Workspace', workspace: 'executive' });

router.register('/hospital/:view', async (ctx) => {
  const { renderHospitalWorkspace } = await import('../workspaces/hospital/index.js');
  return renderHospitalWorkspace(ctx, { router, session });
}, { title: 'Hospital Billing Portal', workspace: 'hospital' });

router.register('/borrower/:view', async (ctx) => {
  const { renderBorrowerWorkspace } = await import('../workspaces/borrower/index.js');
  return renderBorrowerWorkspace(ctx, { router, session });
}, { title: 'Borrower Mobile Journey', workspace: 'borrower' });

router.register('/ops/:view', async (ctx) => {
  const { renderOpsWorkspace } = await import('../workspaces/ops/index.js');
  return renderOpsWorkspace(ctx, { router, session });
}, { title: 'Central Operations Workbench', workspace: 'ops' });

router.register('/admin/:view', async (ctx) => {
  const { renderAdminWorkspace } = await import('../workspaces/admin/index.js');
  return renderAdminWorkspace(ctx, { router, session });
}, { title: 'Platform Administration', workspace: 'admin' });

router.register('/compliance/:view', async (ctx) => {
  const { renderComplianceWorkspace } = await import('../workspaces/compliance/index.js');
  return renderComplianceWorkspace(ctx, { router, session });
}, { title: 'Compliance & Audit Console', workspace: 'compliance' });

router.register('/support/:view', async (ctx) => {
  const { renderSupportWorkspace } = await import('../workspaces/support/index.js');
  return renderSupportWorkspace(ctx, { router, session });
}, { title: 'Customer Support Workbench', workspace: 'support' });

// Demo Console (/demo)
router.register('/demo', async () => {
  const { renderDemoConsole } = await import('../workspaces/demo/index.js');
  return renderDemoConsole();
}, { title: 'Developer & Test Demo Console' });

// Initialize active session and connect SSE
session.checkCurrentSession().then(() => {
  if (session.user) {
    sse.connect();
  }
  router.resolve();
});

