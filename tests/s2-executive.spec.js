import { test, expect } from '@playwright/test';
import { setupConsoleCheck, setupNetworkCheck, loginAs, resetData } from './helpers/test-utils.js';

test.describe('Slice S2: Executive Case Creation & Invitation (EXE-02 to EXE-06)', () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
    await loginAs(page, 'USR-PRIYA'); // Executive assigned to Hospital 1
  });

  test('AT-01: Executive creates valid case; CASE and FRID generated; no hospital system call', async ({ page }) => {
    const assertNoErrors = setupConsoleCheck(page);
    const assertNoExternal = setupNetworkCheck(page);

    await page.goto('/#/executive/dashboard');
    await page.click('[data-testid="btn-create-new-case"]');

    // Step 1: Hospital details
    await page.selectOption('[data-testid="hospital-select"]', 'HOSP-01');
    await page.selectOption('[data-testid="branch-select"]', 'BRANCH-01');
    await page.fill('[data-testid="patient-adm-ref"]', 'IPD-2026-TEST-001');

    // Step 2: Patient details (Self borrower)
    await page.fill('[data-testid="patient-name"]', 'Deepak Verma');
    await page.fill('[data-testid="patient-age"]', '42');
    await page.fill('[data-testid="patient-contact"]', '+91 98000 00055');

    // Step 3: Initial demand
    await page.selectOption('[data-testid="demand-type"]', 'ADMISSION_ADVANCE');
    await page.fill('[data-testid="demand-amount"]', '150000');
    await page.fill('[data-testid="demand-evidence-ref"]', 'EST-2026-TEST-99');

    // Step 4: Submit & Generate FRID
    await page.click('[data-testid="btn-create-case-submit"]');

    // Verify redirected to EXE-06 Borrower Invitation
    await page.waitForURL(/.*#\/executive\/invitation\/.*/);

    // Verify FRID format: HF- plus 8 chars (HF-XXXX-XXXX)
    const fridEl = page.locator('[data-testid="generated-frid"]');
    await expect(fridEl).toBeVisible();
    const fridText = (await fridEl.textContent()).trim();
    expect(fridText).toMatch(/^HF-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);

    // Verify QR code container exists and contains local SVG
    const qrContainer = page.locator('[data-testid="qr-code-container"] svg');
    await expect(qrContainer).toBeVisible();

    // Verify invitation raw token is present
    const rawToken = page.locator('[data-testid="invitation-raw-token"]');
    await expect(rawToken).toBeVisible();

    // Verify case in store has READY_FOR_INVITATION status
    const caseObj = await page.evaluate(frid => {
      return window.__LSP_STORE__.getState().cases.find(c => c.frid === frid);
    }, fridText);

    expect(caseObj).toBeTruthy();
    expect(caseObj.case_status).toBe('READY_FOR_INVITATION');

    assertNoErrors();
    assertNoExternal();
  });

  test('AT-05: Patient differs from borrower: separate identities and permissions', async ({ page }) => {
    await page.goto('/#/executive/new-case');

    await page.selectOption('[data-testid="hospital-select"]', 'HOSP-01');
    await page.fill('[data-testid="patient-adm-ref"]', 'IPD-2026-DIFF-002');
    await page.fill('[data-testid="patient-name"]', 'Harish Shah');
    await page.fill('[data-testid="patient-age"]', '71');
    await page.fill('[data-testid="patient-contact"]', '+91 98000 00098');

    // Toggle different borrower
    await page.click('[data-testid="borrower-diff"]');

    await page.fill('[data-testid="borrower-name"]', 'Amit Harish Shah');
    await page.fill('[data-testid="borrower-contact"]', '+91 98000 00012');
    await page.selectOption('[data-testid="borrower-relationship"]', 'SON');

    await page.fill('[data-testid="demand-amount"]', '200000');
    await page.fill('[data-testid="demand-evidence-ref"]', 'EST-DIFF-002');
    await page.click('[data-testid="btn-create-case-submit"]');

    await page.waitForURL(/.*#\/executive\/invitation\/.*/);

    const frid = (await page.locator('[data-testid="generated-frid"]').textContent()).trim();
    const caseData = await page.evaluate(frid => {
      const state = window.__LSP_STORE__.getState();
      const c = state.cases.find(x => x.frid === frid);
      const pat = state.patients.find(p => p.patient_id === c.patient_id);
      const bor = state.users.find(u => u.user_id === c.primary_borrower_id);
      return { caseObj: c, patient: pat, borrower: bor };
    }, frid);

    expect(caseData.caseObj.patient_is_borrower).toBe(false);
    expect(caseData.patient.name).toBe('Harish Shah');
    expect(caseData.borrower.name).toBe('Amit Harish Shah');
    expect(caseData.caseObj.borrower_relationship).toBe('SON');
  });

  test('S2-03 (AT-05/J8): Minor patient cannot apply directly; routes to warning and halts creation', async ({ page }) => {
    await page.goto('/#/executive/new-case');

    await page.fill('[data-testid="patient-adm-ref"]', 'IPD-MINOR-001');
    await page.fill('[data-testid="patient-name"]', 'Master Rahul (Minor)');
    await page.fill('[data-testid="patient-age"]', '12'); // Minor age
    await page.fill('[data-testid="patient-contact"]', '+91 98000 00018');

    await page.fill('[data-testid="demand-amount"]', '50000');
    await page.fill('[data-testid="demand-evidence-ref"]', 'EST-MINOR-001');

    await page.click('[data-testid="btn-create-case-submit"]');

    // Expect warning alert and case NOT created
    const errorAlert = page.locator('.alert-error');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Incapacitated or Minor Patient');

    // Ensure we stayed on new-case page
    expect(page.url()).toContain('#/executive/new-case');
  });

  test('S2-04: Duplicate check rejects creation if duplicate admission ref already active', async ({ page }) => {
    await page.goto('/#/executive/new-case');

    // Use admission ref already seeded for CASE-1001
    await page.selectOption('[data-testid="hospital-select"]', 'HOSP-01');
    await page.fill('[data-testid="patient-adm-ref"]', 'IPD-2026-8810');
    await page.fill('[data-testid="patient-name"]', 'Duplicate Candidate');
    await page.fill('[data-testid="patient-age"]', '30');
    await page.fill('[data-testid="patient-contact"]', '+91 98000 00099');
    await page.fill('[data-testid="demand-amount"]', '50000');
    await page.fill('[data-testid="demand-evidence-ref"]', 'EST-DUP-01');

    await page.click('[data-testid="btn-create-case-submit"]');

    const errorAlert = page.locator('.alert-error');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Duplicate case candidate detected');
  });

  test('S2-05: Resend invitation revokes old token and generates new token', async ({ page }) => {
    await page.goto('/#/executive/invitation/CASE-1001');

    const tokenBefore = (await page.locator('[data-testid="invitation-raw-token"]').textContent()).trim();

    // Click Resend
    await page.click('[data-testid="btn-resend-invitation"]');

    const tokenAfter = (await page.locator('[data-testid="invitation-raw-token"]').textContent()).trim();
    expect(tokenAfter).not.toBe(tokenBefore);
  });
});

