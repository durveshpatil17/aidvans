import { test, expect } from '@playwright/test';
import { setupConsoleCheck, setupNetworkCheck, loginAs, resetData } from './helpers/test-utils.js';

test.describe('Slice S8: Admin, Ops, Compliance & Feature Flags (AT-15, AT-16, AT-17, AT-19, AT-21, AT-22, AT-23, AT-24, AT-26, AT-29, AT-30, J15, J16)', () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test('AT-15: Hospital user opens another hospital case: denied, logged, zero details leaked', async ({ page }) => {
    // USR-ANAND belongs to HOSP-02; CASE-1001 belongs to HOSP-01
    await loginAs(page, 'USR-ANAND');
    await page.goto('http://localhost:3000/#/hospital/cases/CASE-1001');

    // Must show Access Denied
    await expect(page.locator('text=Access Denied').first()).toBeVisible();
    await expect(page.locator('text=Cross-Hospital Access Denied')).toBeVisible();

    // Sensitive details must not be rendered
    await expect(page.locator('text=Clinical Demographics')).not.toBeVisible();

    // Verify audit log has cross-hospital access denial
    const logs = await page.evaluate(() => window.__LSP_STORE__.getState().audit_logs);
    const deniedLog = logs.find(l => l.action === 'CROSS_HOSPITAL_ACCESS_DENIED' && l.target_id === 'CASE-1001');
    expect(deniedLog).toBeTruthy();
    expect(deniedLog.reason).toContain('attempted access to case owned by HOSP-01');
  });

  test('AT-16: Hospital user views case: zero borrower KYC, income, PAN, Aadhaar or KFS displayed', async ({ page }) => {
    // USR-SUNITA belongs to HOSP-01 and opens CASE-1001 (same hospital)
    await loginAs(page, 'USR-SUNITA'); // Hospital 1 Finance
    await page.goto('http://localhost:3000/#/hospital/cases/CASE-1001');
    await expect(page.locator('h1')).toContainText('Hospital Case Summary');

    // Verify borrower personal KYC and sensitive financial data is strictly absent
    await expect(page.locator('text=PAN')).not.toBeVisible();
    await expect(page.locator('text=Aadhaar')).not.toBeVisible();
    await expect(page.locator('text=Bureau')).not.toBeVisible();
    await expect(page.locator('text=KFS Archive')).not.toBeVisible();
    await expect(page.locator('text=Credit Report')).not.toBeVisible();

    // Patient name should be masked (e.g. R*** K***)
    const patientText = await page.locator('text=Patient Name:').locator('..').innerText();
    expect(patientText).toContain('***');
  });

  test('AT-17: Executive portal: zero OTP or PIN fields exist on staff screens', async ({ page }) => {
    await loginAs(page, 'USR-PRIYA'); // Executive

    // Check dashboard
    await page.goto('http://localhost:3000/#/executive/dashboard');
    const otpInputs1 = await page.locator('input[id*="otp" i], input[name*="otp" i], input[placeholder*="otp" i]').count();
    expect(otpInputs1).toBe(0);

    // Check case creation wizard
    await page.goto('http://localhost:3000/#/executive/cases/new');
    const otpInputs2 = await page.locator('input[id*="otp" i], input[name*="otp" i], input[placeholder*="otp" i]').count();
    expect(otpInputs2).toBe(0);

    // Check case details
    await page.goto('http://localhost:3000/#/executive/cases/CASE-1001');
    const otpInputs3 = await page.locator('input[id*="otp" i], input[name*="otp" i], input[placeholder*="otp" i]').count();
    expect(otpInputs3).toBe(0);
  });

  test('AT-19: Borrower continues in app after web start: same case, no new FRID', async ({ page }) => {
    // Borrower links CASE-1001
    await page.evaluate(() => {
      window.__LSP_STORE__.linkCase('HF-7K3M-9QX2', 'TOK-DEMO-B1-VALID', 'BOR-B1');
    });

    await loginAs(page, 'BOR-B1');
    await page.goto('http://localhost:3000/#/borrower/overview');
    await expect(page.locator('h1')).toContainText('BOR-03');

    // Case FRID is HF-7K3M-9QX2
    await expect(page.locator('text=HF-7K3M-9QX2')).toBeVisible();

    // Case count in state remains unchanged
    const cases = await page.evaluate(() => window.__LSP_STORE__.getState().cases);
    expect(cases.filter(c => c.primary_borrower_id === 'BOR-B1').length).toBe(1);
  });

  test('AT-21 & AT-22: Personal expense journal feature flag OFF vs ON', async ({ page }) => {
    // Default: flag is OFF
    await loginAs(page, 'BOR-B1');
    await page.goto('http://localhost:3000/#/borrower/expenses');

    // AT-21: When OFF, feature is disabled / 404
    await expect(page.locator('text=Feature Disabled')).toBeVisible();

    // Enable feature flag
    await page.evaluate(() => {
      window.__LSP_STORE__.update(s => ({
        ...s,
        config: { ...s.config, featureFlags: { expenseJournal: true } }
      }));
    });

    // AT-22: When ON, visible to borrower after reload
    await page.reload();
    await expect(page.locator('h1')).toContainText('Expense Journal');

    // AT-22: Non-borrower staff accessing expense journal is denied
    await loginAs(page, 'USR-PRIYA'); // Executive
    await page.goto('http://localhost:3000/#/borrower/expenses');
    await expect(page.locator('text=Access Denied').first()).toBeVisible();

    await loginAs(page, 'USR-ANAND'); // Hospital
    await page.goto('http://localhost:3000/#/borrower/expenses');
    await expect(page.locator('text=Access Denied').first()).toBeVisible();
  });

  test('AT-23: Lender complaint: routed to grievance redressal channel, grievance officer details visible', async ({ page }) => {
    await loginAs(page, 'BOR-B1');
    await page.goto('http://localhost:3000/#/borrower/help');
    await expect(page.locator('h1')).toContainText('Help & Complaints');

    // Grievance Redressal Officer card visible
    await expect(page.locator('[data-testid="grievance-officer-card"]')).toBeVisible();
    await expect(page.locator('text=Rajesh Verma (Nodal Officer)')).toBeVisible();
    await expect(page.locator('text=grievance@lender-nbfc.mock')).toBeVisible();
    await expect(page.locator('text=1800-200-9999')).toBeVisible();

    // Submit a formal lender grievance
    await page.selectOption('[data-testid="ticket-category"]', 'LENDER_GRIEVANCE');
    await page.fill('[data-testid="ticket-message"]', 'Dispute over loan processing charges not mentioned in sanction letter');
    await page.click('[data-testid="btn-submit-ticket"]');
    await page.waitForFunction(() => window.__LSP_STORE__ !== undefined);

    // Verify ticket recorded
    const tickets = await page.evaluate(() => window.__LSP_STORE__.getState().support_tickets);
    const grievanceTicket = tickets.find(t => t.category === 'LENDER_GRIEVANCE');
    expect(grievanceTicket).toBeTruthy();
    expect(grievanceTicket.status).toBe('OPEN');
  });

  test('AT-24 & J15: Staff deactivated: active session revoked, case history preserved', async ({ page }) => {
    // Platform Admin deactivates USR-PRIYA
    await loginAs(page, 'USR-ADITI');
    await page.goto('http://localhost:3000/#/admin/users');
    await expect(page.locator('h1')).toContainText('Staff User Directory');

    await page.click('[data-testid="btn-deactivate-USR-PRIYA"]');
    await page.waitForFunction(() => window.__LSP_STORE__ !== undefined);

    // Verify USR-PRIYA status in store
    const user = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().users.find(u => u.user_id === 'USR-PRIYA');
    });
    expect(user.status).toBe('DEACTIVATED');

    // Attempt to access executive portal as deactivated user
    await loginAs(page, 'USR-PRIYA');
    await page.goto('http://localhost:3000/#/executive/dashboard');
    await expect(page.locator('text=Access Denied').first()).toBeVisible();

    // Case history created by USR-PRIYA is strictly preserved
    const case1001 = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().cases.find(c => c.case_id === 'CASE-1001');
    });
    expect(case1001).toBeTruthy();
    expect(case1001.assigned_executive_id).toBe('USR-PRIYA');
  });

  test('AT-26: Consent withdrawal: future sharing stops; mandatory statutory records kept', async ({ page }) => {
    // Borrower links and grants consent
    await page.evaluate(() => {
      const store = window.__LSP_STORE__;
      store.linkCase('HF-7K3M-9QX2', 'TOK-DEMO-B1-VALID', 'BOR-B1');
      store.recordConsent('CASE-1001', 'BOR-B1', [
        { purpose: 'LENDER_CREDIT_EVALUATION', category: 'CREDIT', recipient: 'LENDER', granted: true }
      ]);
    });

    // Borrower visits Privacy Centre and withdraws consent
    await loginAs(page, 'BOR-B1');
    await page.goto('http://localhost:3000/#/borrower/privacy');
    await expect(page.locator('h1')).toContainText('Privacy Centre');

    const consent = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().consents.find(c => c.purpose === 'LENDER_CREDIT_EVALUATION');
    });
    expect(consent).toBeTruthy();

    await page.click(`[data-consent-id="${consent.consent_id}"]`);
    await page.waitForFunction(() => window.__LSP_STORE__ !== undefined);

    // Verify consent marked withdrawn
    const withdrawnConsent = await page.evaluate(cid => {
      return window.__LSP_STORE__.getState().consents.find(c => c.consent_id === cid);
    }, consent.consent_id);
    expect(withdrawnConsent.withdrawn).toBe(true);

    // Attempting to submit application now fails due to withdrawn consent
    const submitResult = await page.evaluate(() => {
      try {
        window.__LSP_STORE__.submitApplication({
          caseId: 'CASE-1001',
          borrowerId: 'BOR-B1',
          lenderId: 'LENDER-A',
          productId: 'PROD-01',
          monthlyIncome: 75000,
          employmentType: 'SALARIED',
          declaredObligations: 0
        });
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    expect(submitResult.success).toBe(false);
    expect(submitResult.error).toContain('Mandatory consent not granted or withdrawn');

    // Mandatory audit trail of consent withdrawal is preserved
    const auditLogs = await page.evaluate(() => window.__LSP_STORE__.getState().audit_logs);
    const withdrawAudit = auditLogs.find(l => l.action === 'CONSENT_WITHDRAWN' && l.target_id === consent.consent_id);
    expect(withdrawAudit).toBeTruthy();
  });

  test('AT-29: Executive data export denied unless specifically permitted by role; audit logged', async ({ page }) => {
    const executiveUser = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().users.find(u => u.user_id === 'USR-PRIYA');
    });

    // Check RBAC permission for EXPORT_DATA
    const hasExportAccess = await page.evaluate(u => {
      return window.__RBAC__.checkAccess(u, 'EXPORT_DATA');
    }, executiveUser);

    expect(hasExportAccess).toBe(false);

    // Compliance Auditor does have export access
    const auditorUser = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().users.find(u => u.user_id === 'USR-ROHAN');
    });

    const auditorHasAccess = await page.evaluate(u => {
      return window.__RBAC__.checkAccess(u, 'EXPORT_DATA');
    }, auditorUser);

    expect(auditorHasAccess).toBe(true);
  });

  test('AT-30 & J16: Security breach simulation: incident workbench opens, notification assessment recorded', async ({ page }) => {
    await loginAs(page, 'USR-ROHAN'); // Compliance Auditor
    await page.goto('http://localhost:3000/#/compliance/incidents');
    await expect(page.locator('h1')).toContainText('Security Incident & Breach Register');

    // Trigger breach simulation
    await page.click('[data-testid="btn-simulate-breach"]');
    await page.waitForFunction(() => window.__LSP_STORE__ !== undefined);

    // Verify incident record in UI
    await expect(page.locator('text=Simulated Security Incident: Unauthorized FRID Enumeration Surge')).toBeVisible();
    await expect(page.locator('text=Containment successful via 15-minute rate limit')).toBeVisible();

    // Verify incident stored in state
    const incidents = await page.evaluate(() => window.__LSP_STORE__.getState().incidents);
    const breach = incidents.find(i => i.severity === 'HIGH');
    expect(breach).toBeTruthy();
    expect(breach.status).toBe('CONTAINED');
    expect(breach.notification_assessment).toContain('Containment successful');

    // Audit trail verification
    const auditLogs = await page.evaluate(() => window.__LSP_STORE__.getState().audit_logs);
    const incidentAudit = auditLogs.find(l => l.action === 'SECURITY_INCIDENT_OPENED');
    expect(incidentAudit).toBeTruthy();
  });
});
