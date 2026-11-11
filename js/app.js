/**
 * Application Bootstrap & Main Entry Point
 */

import { Store } from './store.js';
import { Router } from './router.js';
import { LenderMockAdapter } from './lender-mock.js';
import { checkAccess, ROLES } from './rbac.js';
import { escapeHTML } from './ui.js';

// Import portal views
import {
  renderPublicHome,
  renderHowItWorks,
  renderPartnerHospitals,
  renderLenderPartners,
  renderFeesExplanation,
  renderPrivacyNotice,
  renderGrievanceContacts
} from './portals/public.js';

import {
  renderExecutiveDashboard,
  renderNewCaseWizard,
  renderBorrowerInvitation,
  renderExecutiveCaseDetails,
  renderNewDemandScreen,
  renderExecutiveDisbursements,
  renderExecutiveTimeline,
  renderExecutiveCaseClosure
} from './portals/executive.js';

import {
  renderBorrowerWelcome,
  renderBorrowerLink,
  renderBorrowerConsent,
  renderBorrowerApply,
  renderKYCHandoff,
  renderBorrowerOverview,
  renderBorrowerOffers,
  renderBorrowerKFS,
  renderBorrowerDrawdown,
  renderBorrowerTimeline,
  renderBorrowerLoanInfo,
  renderBorrowerPrivacy,
  renderBorrowerHelp
} from './portals/borrower.js';

import {
  renderHospitalDashboard,
  renderHospitalCaseDetails,
  renderHospitalReceipts,
  renderHospitalBeneficiary
} from './portals/hospital.js';

import {
  renderOpsDashboard,
  renderOpsExceptions,
  renderOpsReconciliation
} from './portals/ops.js';

import {
  renderAdminDashboard,
  renderUserDirectory,
  renderHospitalAdminManagement,
  renderProductConfiguration,
  renderAuditLogs
} from './portals/admin.js';

import {
  renderConsentAudit,
  renderIncidentRegister,
  renderSupportQueue
} from './portals/compliance.js';

import { renderLenderSandbox } from './portals/sandbox.js';
import { renderLoginPage } from './portals/auth.js';
import { SEED_DATA } from '../data/seed.js';

async function bootstrap() {
  const seedData = SEED_DATA;

  const store = new Store(seedData);
  const adapter = new LenderMockAdapter(store);

  // Expose global handles for testing and inspection
  window.__LSP_STORE__ = store;
  window.__LENDER_ADAPTER__ = adapter;
  window.__RBAC__ = { checkAccess, ROLES };

  // Initialize router
  const router = new Router(store);

  // Role Switcher Setup
  const roleSelect = document.getElementById('role-switcher-select');
  const contextSpan = document.getElementById('current-user-context');
  const resetBtn = document.getElementById('reset-demo-data');
  const signOutBtn = document.getElementById('btn-sign-out');
  const headerUserStatus = document.getElementById('header-user-status');
  const headerUserAvatar = document.getElementById('header-user-avatar');
  const headerUserName = document.getElementById('header-user-name');

  function updateBanner(user) {
    if (contextSpan && user) {
      contextSpan.innerHTML = `<strong>${escapeHTML(user.name)}</strong> (${escapeHTML(user.role)}) — <small style="color:#cbd5e1;">${escapeHTML(user.context || '')}</small>`;
    }
    if (roleSelect && user) {
      roleSelect.value = user.user_id;
    }
    if (headerUserStatus) {
      if (user && user.role !== 'PUBLIC') {
        headerUserStatus.style.display = 'flex';
        if (headerUserAvatar) headerUserAvatar.textContent = user.name.split(' ').map(n => n[0]).join('');
        if (headerUserName) headerUserName.textContent = `${user.name} (${user.role.replace(/_/g, ' ')})`;
      } else {
        headerUserStatus.style.display = 'none';
      }
    }
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      store.signOut();
      window.location.hash = '#/login';
      router.handleRoute();
    });
  }

  // Populate persona selector
  if (roleSelect) {
    roleSelect.innerHTML = seedData.users.map(u => `
      <option value="${u.user_id}">
        ${escapeHTML(u.name)} [${escapeHTML(u.role)}]
      </option>
    `).join('');

    roleSelect.addEventListener('change', e => {
      store.setCurrentUser(e.target.value);
      router.handleRoute();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      store.reset();
      window.location.hash = '#/';
      router.handleRoute();
    });
  }

  store.subscribe(() => {
    updateBanner(store.getCurrentUser());
  });

  updateBanner(store.getCurrentUser());

  // --- Route Registrations ---

  // Authentication & Portal Access (AUTH-01)
  router.register('#/login', ctx => renderLoginPage({ store, router }));
  router.register('#/auth', ctx => renderLoginPage({ store, router }));

  // Public Portal (PUB-01 to PUB-07)
  router.register('#/', () => renderPublicHome());
  router.register('#/how-it-works', () => renderHowItWorks());
  router.register('#/hospitals', () => renderPartnerHospitals(store));
  router.register('#/lenders', () => renderLenderPartners(store));
  router.register('#/fees', () => renderFeesExplanation());
  router.register('#/privacy', () => renderPrivacyNotice());
  router.register('#/grievance', () => renderGrievanceContacts(store));

  // Executive Portal (EXE-01 to EXE-13)
  router.register('#/executive/dashboard', ctx => renderExecutiveDashboard(ctx), 'VIEW_EXECUTIVE_DASHBOARD');
  router.register('#/executive/new-case', ctx => renderNewCaseWizard(ctx), 'CREATE_FINANCING_CASE');
  router.register('#/executive/invitation/:id', ctx => renderBorrowerInvitation(ctx), 'VIEW_EXECUTIVE_DASHBOARD');
  router.register('#/executive/cases/:id', ctx => renderExecutiveCaseDetails(ctx), 'VIEW_EXECUTIVE_DASHBOARD');
  router.register('#/executive/new-demand/:id', ctx => renderNewDemandScreen(ctx), 'VIEW_EXECUTIVE_DASHBOARD');
  router.register('#/executive/disbursements', ctx => renderExecutiveDisbursements(ctx), 'VIEW_EXECUTIVE_DASHBOARD');
  router.register('#/executive/timeline/:id', ctx => renderExecutiveTimeline(ctx), 'VIEW_EXECUTIVE_DASHBOARD');
  router.register('#/executive/close/:id', ctx => renderExecutiveCaseClosure(ctx), 'VIEW_EXECUTIVE_DASHBOARD');

  // Borrower Portal (BOR-01 to BOR-16)
  router.register('#/borrower/welcome', ctx => renderBorrowerWelcome(ctx));
  router.register('#/borrower/link', ctx => renderBorrowerLink(ctx));
  router.register('#/borrower/consent/:id', ctx => renderBorrowerConsent(ctx));
  router.register('#/borrower/apply/:id', ctx => renderBorrowerApply(ctx));
  router.register('#/borrower/kyc/:id', ctx => renderKYCHandoff(ctx));
  router.register('#/borrower/overview', ctx => renderBorrowerOverview(ctx));
  router.register('#/borrower/offers/:id', ctx => renderBorrowerOffers(ctx), 'VIEW_LOAN_INFO');
  router.register('#/borrower/kfs/:id', ctx => renderBorrowerKFS(ctx), 'VIEW_LOAN_INFO');
  router.register('#/borrower/drawdown/:id', ctx => renderBorrowerDrawdown(ctx), 'AUTHORISE_DRAWDOWN');
  router.register('#/borrower/timeline/:id', ctx => renderBorrowerTimeline(ctx));
  router.register('#/borrower/loan/:id', ctx => renderBorrowerLoanInfo(ctx), 'VIEW_LOAN_INFO');
  router.register('#/borrower/privacy', ctx => renderBorrowerPrivacy(ctx));
  router.register('#/borrower/help', ctx => renderBorrowerHelp(ctx));

  // Optional Expense Journal (BOR-13: AT-21 & AT-22)
  router.register('#/borrower/expenses', () => {
    const isFlagOn = store.getState().config?.featureFlags?.expenseJournal === true;
    if (!isFlagOn) {
      return `<div class="alert alert-error"><h3>Feature Disabled</h3><p>Expense journal is disabled by platform policy (AT-21).</p></div>`;
    }
    return `<div class="mobile-view-wrapper"><h1>Expense Journal (BOR-13)</h1><p>Personal episode expense journal (Borrower Only).</p></div>`;
  }, 'VIEW_EXPENSE_JOURNAL');

  // Hospital Portal (HOS-01 to HOS-11)
  router.register('#/hospital/dashboard', ctx => renderHospitalDashboard(ctx), 'VIEW_HOSPITAL_PORTAL');
  router.register('#/hospital/cases/:id', ctx => renderHospitalCaseDetails(ctx), 'VIEW_HOSPITAL_PORTAL');
  router.register('#/hospital/receipts', ctx => renderHospitalReceipts(ctx), 'CONFIRM_HOSPITAL_RECEIPT');
  router.register('#/hospital/beneficiary', ctx => renderHospitalBeneficiary(ctx), 'VIEW_HOSPITAL_PORTAL');

  // Operations Portal (OPS-01 to OPS-07)
  router.register('#/ops/dashboard', ctx => renderOpsDashboard(ctx), 'VIEW_OPS_WORKBENCH');
  router.register('#/ops/exceptions', ctx => renderOpsExceptions(ctx), 'VIEW_OPS_WORKBENCH');
  router.register('#/ops/reconciliation', ctx => renderOpsReconciliation(ctx), 'VIEW_OPS_WORKBENCH');

  // Admin Portal (ADM-01 to ADM-13)
  router.register('#/admin/dashboard', ctx => renderAdminDashboard(ctx), 'VIEW_ADMIN_PORTAL');
  router.register('#/admin/users', ctx => renderUserDirectory(ctx), 'VIEW_ADMIN_PORTAL');
  router.register('#/admin/hospitals', ctx => renderHospitalAdminManagement(ctx), 'VIEW_ADMIN_PORTAL');
  router.register('#/admin/products', ctx => renderProductConfiguration(ctx), 'VIEW_ADMIN_PORTAL');
  router.register('#/admin/audit', ctx => renderAuditLogs(ctx), 'VIEW_ADMIN_PORTAL');

  // Compliance & Support (CMP-01 to CMP-05, SUP-01/02)
  router.register('#/compliance/consent', ctx => renderConsentAudit(ctx), 'VIEW_COMPLIANCE_AUDIT');
  router.register('#/compliance/incidents', ctx => renderIncidentRegister(ctx), 'VIEW_COMPLIANCE_AUDIT');
  router.register('#/support/tickets', ctx => renderSupportQueue(ctx), 'VIEW_SUPPORT_PORTAL');

  // Regulated NBFC Sandbox Panel
  router.register('#/sandbox/lender', ctx => renderLenderSandbox(ctx));

  // Handle first route
  router.handleRoute();
}

// Start app
bootstrap().catch(err => {
  console.error('Fatal initialization error:', err);
  document.getElementById('app-root').innerHTML = `
    <div class="alert alert-error">
      <h2>Initialization Error</h2>
      <p>${escapeHTML(err.message)}</p>
    </div>
  `;
});
