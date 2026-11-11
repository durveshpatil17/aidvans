/**
 * RBAC and ABAC Access Control and Field Masking
 * Meets TDS Section 3 (Identity, RBAC, ABAC and Field-Level Access)
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  OPS_MANAGER: 'OPS_MANAGER',
  EXECUTIVE: 'EXECUTIVE',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  HOSPITAL_FINANCE: 'HOSPITAL_FINANCE',
  HOSPITAL_REFERRAL: 'HOSPITAL_REFERRAL',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  COMPLIANCE_AUDITOR: 'COMPLIANCE_AUDITOR',
  BORROWER: 'BORROWER',
  PATIENT_VIEWER: 'PATIENT_VIEWER'
};

/**
 * Checks if user has base role permission and ABAC scope.
 */
export function checkAccess(user, action, context = {}) {
  if (!user) return false;
  // AT-24: Deactivated staff have all permissions and sessions immediately revoked
  if (user.status === 'DEACTIVATED') return false;
  const role = user.role;

  // Rule: Hospital users NEVER see borrower KYC, income, PAN, Aadhaar, bureau, or KFS archive
  if (['VIEW_BORROWER_KYC', 'VIEW_INCOME', 'VIEW_KFS_ARCHIVE'].includes(action)) {
    if ([ROLES.HOSPITAL_ADMIN, ROLES.HOSPITAL_FINANCE, ROLES.HOSPITAL_REFERRAL].includes(role)) {
      return false;
    }
  }

  // Rule: Patient viewer never sees loan, KFS, income, or EMI
  if (role === ROLES.PATIENT_VIEWER) {
    if (['VIEW_LOAN_INFO', 'VIEW_KFS', 'VIEW_INCOME', 'VIEW_EMI', 'AUTHORISE_DRAWDOWN'].includes(action)) {
      return false;
    }
    if (action === 'VIEW_PATIENT_EPISODE_SUMMARY') return true;
    return false;
  }

  // Rule: Staff cannot authorise loan drawdowns (Borrower only)
  if (action === 'AUTHORISE_DRAWDOWN') {
    return role === ROLES.BORROWER;
  }

  // Rule: Expense journal is borrower only
  if (action === 'VIEW_EXPENSE_JOURNAL') {
    return role === ROLES.BORROWER;
  }

  // ABAC Scope: Hospital tenant isolation
  if (context.hospitalId && [ROLES.HOSPITAL_ADMIN, ROLES.HOSPITAL_FINANCE, ROLES.HOSPITAL_REFERRAL].includes(role)) {
    if (user.org_id !== context.hospitalId) {
      return false; // Cross-hospital access denied
    }
  }

  // ABAC Scope: Executive assigned hospital/case
  if (role === ROLES.EXECUTIVE) {
    if (context.hospitalId && user.assigned_hospital_ids && !user.assigned_hospital_ids.includes(context.hospitalId)) {
      return false;
    }
  }

  // ABAC Scope: Borrower linked case
  if (role === ROLES.BORROWER) {
    if (context.caseObj) {
      if (context.caseObj.primary_borrower_id !== user.user_id) {
        return false;
      }
    }
  }

  // Action-specific matrix checks
  switch (action) {
    case 'CREATE_FINANCING_CASE':
      return [ROLES.EXECUTIVE, ROLES.OPS_MANAGER, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role);

    case 'VIEW_EXECUTIVE_DASHBOARD':
      return [ROLES.EXECUTIVE, ROLES.OPS_MANAGER, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role);

    case 'VIEW_HOSPITAL_PORTAL':
      return [ROLES.HOSPITAL_ADMIN, ROLES.HOSPITAL_FINANCE, ROLES.HOSPITAL_REFERRAL, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role);

    case 'SUBMIT_HOSPITAL_DEMAND':
      return [ROLES.HOSPITAL_FINANCE, ROLES.HOSPITAL_ADMIN, ROLES.EXECUTIVE].includes(role);

    case 'CONFIRM_HOSPITAL_RECEIPT':
      return [ROLES.HOSPITAL_FINANCE, ROLES.HOSPITAL_ADMIN].includes(role);

    case 'MANAGE_HOSPITAL_BENEFICIARY':
      return [ROLES.HOSPITAL_ADMIN, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role);

    case 'APPROVE_BENEFICIARY_MAKER_CHECKER':
      return [ROLES.PLATFORM_ADMIN, ROLES.OPS_MANAGER, ROLES.SUPER_ADMIN].includes(role);

    case 'VIEW_OPS_WORKBENCH':
      return [ROLES.OPS_MANAGER, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role);

    case 'VIEW_ADMIN_PORTAL':
      return [ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role);

    case 'VIEW_COMPLIANCE_AUDIT':
      return [ROLES.COMPLIANCE_AUDITOR, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role);

    case 'VIEW_SUPPORT_PORTAL':
      return [ROLES.SUPPORT_AGENT, ROLES.OPS_MANAGER, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role);

    case 'EXPORT_DATA':
      return [ROLES.COMPLIANCE_AUDITOR, ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN].includes(role);

    case 'VIEW_CASE_DETAILS':
      return true; // Subject to ABAC filtering above

    default:
      return true;
  }
}

/**
 * Data Masking Functions
 */
export function maskName(name) {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  return parts
    .map(p => (p.length > 2 ? p[0] + '*'.repeat(p.length - 2) + p[p.length - 1] : p[0] + '*'))
    .join(' ');
}

export function maskPhone(phone) {
  if (!phone) return '—';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 4) return '••••';
  return '•••• •••• ' + clean.slice(-2);
}

export function maskPAN(pan) {
  if (!pan) return '—';
  if (pan.length < 4) return '••••';
  return '••••••••' + pan.slice(-2);
}

export function maskBankAccount(accountNo) {
  if (!accountNo) return '—';
  const clean = accountNo.replace(/\s+/g, '');
  return '•••• •••• ' + clean.slice(-4);
}

export function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const num = Number(amount);
  return '₹' + num.toLocaleString('en-IN');
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const datePart = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${datePart} ${timePart}`;
  } catch {
    return isoString;
  }
}
