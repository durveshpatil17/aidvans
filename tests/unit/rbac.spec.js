import { test, expect } from '@playwright/test';
import {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS
} from '../../shared/permissions.js';
import {
  hasPermission,
  enforceTenantIsolation,
  enforceBorrowerIsolation,
  maskEntityFields,
  AccessDeniedError
} from '../../server/rbac.js';

test.describe('Tier 1 Unit: Server-Side RBAC & ABAC Policy Enforcement', () => {
  test('hasPermission correctly checks role permissions matrix', () => {
    expect(hasPermission(ROLES.EXECUTIVE, PERMISSIONS.CREATE_FINANCING_CASE)).toBe(true);
    expect(hasPermission(ROLES.HOSPITAL_FINANCE, PERMISSIONS.CREATE_FINANCING_CASE)).toBe(false);
    expect(hasPermission(ROLES.HOSPITAL_FINANCE, PERMISSIONS.SUBMIT_PAYMENT_DEMAND)).toBe(true);
    expect(hasPermission(ROLES.BORROWER, PERMISSIONS.AUTHORISE_DRAWDOWN)).toBe(true);
    expect(hasPermission(ROLES.EXECUTIVE, PERMISSIONS.AUTHORISE_DRAWDOWN)).toBe(false);
    expect(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.APPROVE_BENEFICIARY_CHANGE)).toBe(true);
    expect(hasPermission(ROLES.HOSPITAL_ADMIN, PERMISSIONS.APPROVE_BENEFICIARY_CHANGE)).toBe(false);
  });

  test('enforceTenantIsolation prevents cross-hospital data leakage', () => {
    const userHosp1 = { user_id: 'USR-SUNITA', role: ROLES.HOSPITAL_FINANCE, org_id: 'HOSP-01' };

    // Same hospital passes
    expect(() => enforceTenantIsolation(userHosp1, 'HOSP-01', 'Case')).not.toThrow();

    // Cross hospital throws AccessDeniedError with 403
    expect(() => enforceTenantIsolation(userHosp1, 'HOSP-02', 'Case')).toThrow(AccessDeniedError);

    try {
      enforceTenantIsolation(userHosp1, 'HOSP-02', 'Case');
    } catch (err) {
      expect(err.statusCode).toBe(403);
    }

    // Platform admin bypasses tenant isolation
    const admin = { user_id: 'USR-ADITI', role: ROLES.PLATFORM_ADMIN, org_id: 'ORG-LSP-01' };
    expect(() => enforceTenantIsolation(admin, 'HOSP-02', 'Case')).not.toThrow();
  });

  test('enforceBorrowerIsolation prevents borrower seeing another borrower case', () => {
    const borrower1 = { user_id: 'BOR-01', role: ROLES.BORROWER };
    const case1 = { case_id: 'CASE-01', primary_borrower_id: 'BOR-01' };
    const case2 = { case_id: 'CASE-02', primary_borrower_id: 'BOR-02' };

    expect(() => enforceBorrowerIsolation(borrower1, case1)).not.toThrow();
    expect(() => enforceBorrowerIsolation(borrower1, case2)).toThrow(AccessDeniedError);
  });

  test('maskEntityFields masks borrower KYC/PAN from hospital users (AT-16)', () => {
    const caseRecord = {
      case_id: 'CASE-01',
      hospital_id: 'HOSP-01',
      primary_borrower_id: 'BOR-01',
      borrower_pan: 'ABCDE1234F',
      borrower_income: 1200000,
      kfs_details: { apr: '12%', emi: 11000 }
    };

    const masked = maskEntityFields(caseRecord, ROLES.HOSPITAL_FINANCE);
    expect(masked.borrower_pan).toBeUndefined();
    expect(masked.borrower_income).toBeUndefined();
    expect(masked.kfs_details).toBeUndefined();
    expect(masked.case_id).toBe('CASE-01');
  });
});
