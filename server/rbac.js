/**
 * Server-Side RBAC & ABAC Security Evaluation Engine
 * Meets Section 3 & TDS Section 9 security specifications
 */

import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from '../shared/permissions.js';
import { maskName, maskPhone, maskAccount, maskPAN, maskAadhaar } from '../shared/validators.js';

export class AccessDeniedError extends Error {
  constructor(message = 'Access Denied', code = 'PERMISSION_DENIED', details = {}) {
    super(message);
    this.name = 'AccessDeniedError';
    this.statusCode = 403;
    this.code = code;
    this.details = details;
  }
}

export function hasPermission(role, permission) {
  if (!role) return false;
  if (role === ROLES.SUPER_ADMIN) return true;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function enforceTenantIsolation(user, hospitalId, targetEntity = 'Resource') {
  if (!user) {
    throw new AccessDeniedError('Unauthenticated request', 'UNAUTHENTICATED');
  }

  // LSP Admin and Ops have cross-tenant governance
  if ([ROLES.PLATFORM_ADMIN, ROLES.SUPER_ADMIN, ROLES.OPS_MANAGER, ROLES.COMPLIANCE_AUDITOR].includes(user.role)) {
    return true;
  }

  // Executive can only act in assigned hospitals
  if (user.role === ROLES.EXECUTIVE) {
    if (user.assigned_hospital_ids && !user.assigned_hospital_ids.includes(hospitalId)) {
      throw new AccessDeniedError(`Executive ${user.name} is not assigned to hospital ${hospitalId}`, 'HOSPITAL_ISOLATION_VIOLATION', { hospitalId });
    }
    return true;
  }

  // Hospital staff are strictly limited to their own org_id
  if (user.role.startsWith('HOSPITAL_')) {
    if (user.org_id !== hospitalId) {
      throw new AccessDeniedError(`Cross-hospital access denied. User org ${user.org_id} cannot access hospital ${hospitalId}`, 'HOSPITAL_ISOLATION_VIOLATION', {
        userOrg: user.org_id,
        targetHospital: hospitalId
      });
    }
    return true;
  }

  return true;
}

export function enforceBorrowerIsolation(user, caseRecord) {
  if (!user) throw new AccessDeniedError('Unauthenticated', 'UNAUTHENTICATED');
  if ([ROLES.BORROWER, ROLES.PATIENT_VIEWER].includes(user.role)) {
    if (caseRecord.primary_borrower_id !== user.user_id && caseRecord.patient_id !== user.user_id) {
      throw new AccessDeniedError('Borrower cannot access cases belonging to another party', 'CASE_ISOLATION_VIOLATION');
    }
  }
  return true;
}

export function maskEntityFields(entity, viewerRole) {
  if (!entity || typeof entity !== 'object') return entity;
  const clone = JSON.parse(JSON.stringify(entity));

  // Patient view never shows loan, KFS, income, or EMI
  if (viewerRole === ROLES.PATIENT_VIEWER) {
    delete clone.loan_account;
    delete clone.kfs;
    delete clone.income;
    delete clone.emi;
    delete clone.apr;
    delete clone.offers;
  }

  // Hospital users never see KYC, bureau, PAN, Aadhaar, or KFS archive
  if (viewerRole.startsWith('HOSPITAL_')) {
    delete clone.kyc_records;
    delete clone.bureau_score;
    delete clone.kfs_archive;
    delete clone.borrower_bank_account;
    if (clone.pan) clone.pan = maskPAN(clone.pan);
    if (clone.aadhaar) clone.aadhaar = maskAadhaar(clone.aadhaar);
    if (clone.phone) clone.phone = maskPhone(clone.phone);
  }

  // Mask sensitive fields by default
  if (clone.patient_phone) clone.patient_phone = maskPhone(clone.patient_phone);
  if (clone.borrower_phone) clone.borrower_phone = maskPhone(clone.borrower_phone);
  if (clone.account_number_raw && !['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(viewerRole)) {
    delete clone.account_number_raw;
  }

  return clone;
}
