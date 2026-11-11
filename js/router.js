/**
 * Hash-Based SPA Router with Centralized RBAC Enforcement
 * Meets Section 4. technical constraints & non-negotiable security rules.
 */

import { checkAccess, ROLES } from './rbac.js';
import { renderPermissionDeniedState, renderErrorState, escapeHTML } from './ui.js';

export class Router {
  constructor(store) {
    this.store = store;
    this.routes = [];
    this.currentRoute = null;
    this.appRoot = document.getElementById('app-root');
    this.navRoot = document.getElementById('main-nav');
    this.bannerRoot = document.getElementById('prototype-banner');

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  register(pathPattern, viewHandler, requiredPermission = null) {
    // Convert e.g. '#/executive/cases/:id' into regex
    const paramNames = [];
    const regexStr = '^' + pathPattern.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    }) + '$';

    this.routes.push({
      pattern: pathPattern,
      regex: new RegExp(regexStr),
      paramNames,
      viewHandler,
      requiredPermission
    });
  }

  navigate(hashPath) {
    window.location.hash = hashPath;
  }

  getRouteContext() {
    const rawHash = window.location.hash || '#/';
    const [pathPart, queryPart] = rawHash.split('?');
    const query = new URLSearchParams(queryPart || '');
    return { rawHash, path: pathPart, query };
  }

  async handleRoute() {
    const { rawHash, path, query } = this.getRouteContext();
    const currentUser = this.store.getCurrentUser();

    // Find matching route
    let matched = null;
    let params = {};

    for (const r of this.routes) {
      const match = path.match(r.regex);
      if (match) {
        matched = r;
        r.paramNames.forEach((name, idx) => {
          params[name] = decodeURIComponent(match[idx + 1]);
        });
        break;
      }
    }

    if (!matched) {
      this.appRoot.innerHTML = renderErrorState('404 Page Not Found', `The path '${escapeHTML(path)}' does not exist.`);
      return;
    }

    // RBAC check
    if (matched.requiredPermission) {
      const isAllowed = checkAccess(currentUser, matched.requiredPermission, {
        path,
        params,
        query
      });

      if (!isAllowed) {
        this.store.audit.log({
          actorId: currentUser.user_id,
          actorRole: currentUser.role,
          action: 'ACCESS_DENIED_ROUTE',
          targetType: 'ROUTE',
          targetId: path,
          reason: `User role ${currentUser.role} attempted direct URL access to restricted route`
        });

        this.appRoot.innerHTML = renderPermissionDeniedState(
          `Your role (${currentUser.role}) does not have permission to access '${escapeHTML(path)}'.`
        );
        this.updateNav(path, currentUser);
        return;
      }
    }

    try {
      this.appRoot.innerHTML = '<div style="padding:24px 0;"><p>Loading view...</p></div>';
      const viewHtml = await matched.viewHandler({
        path,
        params,
        query,
        user: currentUser,
        store: this.store
      });
      this.appRoot.innerHTML = viewHtml;
      this.updateNav(path, currentUser);
      // Run view post-mount callbacks if any
      if (typeof window.__ON_VIEW_MOUNTED__ === 'function') {
        window.__ON_VIEW_MOUNTED__();
        window.__ON_VIEW_MOUNTED__ = null;
      }
    } catch (err) {
      console.error('Route handler error:', err);
      this.appRoot.innerHTML = renderErrorState('Application Error', err.message, err.stack);
    }
  }

  updateNav(currentPath, user) {
    if (!this.navRoot) return;
    const role = user ? user.role : 'PUBLIC';

    let navHtml = '';

    const isPublicOrAuth = [
      '#/', '#/how-it-works', '#/hospitals', '#/lenders', '#/fees', '#/privacy', '#/grievance', '#/login', '#/auth'
    ].includes(currentPath);

    if (isPublicOrAuth) {
      // Public site navigation
      navHtml += `<a href="#/" class="${currentPath === '#/' ? 'active' : ''}">Overview</a>`;
      navHtml += `<a href="#/how-it-works" class="${currentPath === '#/how-it-works' ? 'active' : ''}">How It Works</a>`;
      navHtml += `<a href="#/hospitals" class="${currentPath === '#/hospitals' ? 'active' : ''}">Hospitals</a>`;
      navHtml += `<a href="#/lenders" class="${currentPath === '#/lenders' ? 'active' : ''}">Lenders</a>`;
      navHtml += `<a href="#/fees" class="${currentPath === '#/fees' ? 'active' : ''}">Fees</a>`;
      navHtml += `<a href="#/privacy" class="${currentPath === '#/privacy' ? 'active' : ''}">Privacy</a>`;
      navHtml += `<a href="#/grievance" class="${currentPath === '#/grievance' ? 'active' : ''}">Grievance</a>`;
      navHtml += `<a href="#/login" class="${currentPath === '#/login' ? 'active' : ''}" style="color:var(--primary-accent);font-weight:600;" data-testid="nav-workspace-login">Workspace Login</a>`;
      navHtml += `<a href="#/sandbox/lender" class="${currentPath.startsWith('#/sandbox') ? 'active' : ''}" style="color:#b45309;font-weight:600;background:#fffbeb;border:1px solid #fde68a;">Lender Sandbox</a>`;
    } else {
      // Role-specific workspace navigation
      if ([ROLES.EXECUTIVE, ROLES.OPS_MANAGER, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role) && currentPath.startsWith('#/executive')) {
        navHtml += `<a href="#/executive/dashboard" class="${currentPath === '#/executive/dashboard' ? 'active' : ''}">Cases & Pipeline</a>`;
        navHtml += `<a href="#/executive/new-case" class="${currentPath === '#/executive/new-case' ? 'active' : ''}">+ New Case</a>`;
        navHtml += `<a href="#/executive/disbursements" class="${currentPath === '#/executive/disbursements' ? 'active' : ''}">Disbursements</a>`;
      } else if ([ROLES.HOSPITAL_FINANCE, ROLES.HOSPITAL_ADMIN, ROLES.HOSPITAL_REFERRAL].includes(role) && currentPath.startsWith('#/hospital')) {
        navHtml += `<a href="#/hospital/dashboard" class="${currentPath === '#/hospital/dashboard' ? 'active' : ''}">Hospital Cases</a>`;
        navHtml += `<a href="#/hospital/receipts" class="${currentPath === '#/hospital/receipts' ? 'active' : ''}">Receipt Confirmation</a>`;
        navHtml += `<a href="#/hospital/beneficiary" class="${currentPath === '#/hospital/beneficiary' ? 'active' : ''}">Bank Verification</a>`;
      } else if ([ROLES.OPS_MANAGER, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role) && currentPath.startsWith('#/ops')) {
        navHtml += `<a href="#/ops/dashboard" class="${currentPath === '#/ops/dashboard' ? 'active' : ''}">Ops Overview</a>`;
        navHtml += `<a href="#/ops/exceptions" class="${currentPath === '#/ops/exceptions' ? 'active' : ''}">Exception Workbench</a>`;
        navHtml += `<a href="#/ops/reconciliation" class="${currentPath === '#/ops/reconciliation' ? 'active' : ''}">Daily Reconciliation</a>`;
        navHtml += `<a href="#/executive/dashboard" class="${currentPath.startsWith('#/executive') ? 'active' : ''}">Executive Desk</a>`;
      } else if ([ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role) && currentPath.startsWith('#/admin')) {
        navHtml += `<a href="#/admin/dashboard" class="${currentPath === '#/admin/dashboard' ? 'active' : ''}">Admin Control</a>`;
        navHtml += `<a href="#/admin/users" class="${currentPath === '#/admin/users' ? 'active' : ''}">User Directory</a>`;
        navHtml += `<a href="#/admin/hospitals" class="${currentPath === '#/admin/hospitals' ? 'active' : ''}">Hospital Accounts</a>`;
        navHtml += `<a href="#/admin/products" class="${currentPath === '#/admin/products' ? 'active' : ''}">Lender Products</a>`;
        navHtml += `<a href="#/admin/audit" class="${currentPath === '#/admin/audit' ? 'active' : ''}">Audit Logs</a>`;
      } else if ([ROLES.COMPLIANCE_AUDITOR, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role) && currentPath.startsWith('#/compliance')) {
        navHtml += `<a href="#/compliance/consent" class="${currentPath === '#/compliance/consent' ? 'active' : ''}">Consent Registry</a>`;
        navHtml += `<a href="#/compliance/incidents" class="${currentPath === '#/compliance/incidents' ? 'active' : ''}">Incident Workbench</a>`;
        navHtml += `<a href="#/admin/audit" class="${currentPath === '#/admin/audit' ? 'active' : ''}">Audit Logs</a>`;
      } else if ([ROLES.SUPPORT_AGENT, ROLES.OPS_MANAGER, ROLES.PLATFORM_ADMIN].includes(role) && currentPath.startsWith('#/support')) {
        navHtml += `<a href="#/support/tickets" class="${currentPath === '#/support/tickets' ? 'active' : ''}">Support Queue</a>`;
        navHtml += `<a href="#/grievance" class="${currentPath === '#/grievance' ? 'active' : ''}">Public Grievances</a>`;
      } else if ((role === ROLES.BORROWER || role === ROLES.PATIENT_VIEWER) && currentPath.startsWith('#/borrower')) {
        navHtml += `<a href="#/borrower/overview" class="${currentPath === '#/borrower/overview' ? 'active' : ''}">My Financing</a>`;
        navHtml += `<a href="#/borrower/link" class="${currentPath === '#/borrower/link' ? 'active' : ''}">Link Case (FRID)</a>`;
        navHtml += `<a href="#/borrower/privacy" class="${currentPath === '#/borrower/privacy' ? 'active' : ''}">Privacy Centre</a>`;
        navHtml += `<a href="#/borrower/help" class="${currentPath === '#/borrower/help' ? 'active' : ''}">Help & Grievance</a>`;
      } else {
        // Fallback for general navigation
        if ([ROLES.EXECUTIVE, ROLES.OPS_MANAGER, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
          navHtml += `<a href="#/executive/dashboard" class="${currentPath.startsWith('#/executive') ? 'active' : ''}">Executive Desk</a>`;
        }
        if ([ROLES.HOSPITAL_FINANCE, ROLES.HOSPITAL_ADMIN, ROLES.HOSPITAL_REFERRAL].includes(role)) {
          navHtml += `<a href="#/hospital/dashboard" class="${currentPath.startsWith('#/hospital') ? 'active' : ''}">Hospital Portal</a>`;
        }
        if ([ROLES.OPS_MANAGER, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
          navHtml += `<a href="#/ops/dashboard" class="${currentPath.startsWith('#/ops') ? 'active' : ''}">Operations</a>`;
        }
        if ([ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
          navHtml += `<a href="#/admin/dashboard" class="${currentPath.startsWith('#/admin') ? 'active' : ''}">Admin</a>`;
        }
      }

      navHtml += `<a href="#/" style="color:var(--text-muted);font-size:0.8125rem;">Public Site</a>`;
      navHtml += `<a href="#/sandbox/lender" class="${currentPath.startsWith('#/sandbox') ? 'active' : ''}" style="color:#b45309;font-weight:600;background:#fffbeb;border:1px solid #fde68a;">Lender Sandbox</a>`;
    }

    this.navRoot.innerHTML = navHtml;
  }
}

