import { test, expect } from '@playwright/test';
import { setupConsoleCheck, setupNetworkCheck, loginAs, resetData } from './helpers/test-utils.js';

test.describe('Slice S3: Borrower Case Linking, Consent & KYC Handoff (BOR-01 to BOR-07)', () => {
  test.use({ viewport: { width: 360, height: 740 } }); // Mobile first 360px per prompt

  test.beforeEach(async ({ page }) => {
    await resetData(page);
    await loginAs(page, 'BOR-B1'); // Ramesh Kumar
  });

  test('AT-02: App user without FRID cannot apply; sees guidance to visit the desk', async ({ page }) => {
    const assertNoErrors = setupConsoleCheck(page);
    const assertNoExternal = setupNetworkCheck(page);

    await page.goto('/#/borrower/welcome');
    await page.waitForLoadState('domcontentloaded');

    const notice = page.locator('[data-testid="borrower-guidance-notice"]');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText('Desk Referral Required (AT-02)');
    await expect(notice).toContainText('self-service standalone loan applications are not permitted');

    // Button to link case is available
    await expect(page.locator('[data-testid="btn-go-to-link"]')).toBeVisible();

    assertNoErrors();
    assertNoExternal();
  });

  test('AT-03: Borrower links FRID through secure link; case visible only after link + consent', async ({ page }) => {
    // Open linking page with valid seeded case CASE-1001
    await page.goto('/#/borrower/link?frid=HF-7K3M-9QX2&token=TOK-DEMO-B1-VALID');

    await expect(page.locator('[data-testid="input-frid"]')).toHaveValue('HF-7K3M-9QX2');
    await expect(page.locator('[data-testid="input-token"]')).toHaveValue('TOK-DEMO-B1-VALID');

    await page.click('[data-testid="btn-submit-link"]');

    // Next step must be purpose-specific consent (BOR-06)
    await page.waitForURL(/.*#\/borrower\/consent\/.*/);
    await expect(page.locator('h1')).toContainText('Purpose-Specific Consent (BOR-06)');

    // Accept consents
    await page.click('[data-testid="btn-grant-consent"]');

    // Next step is application details (BOR-05)
    await page.waitForURL(/.*#\/borrower\/apply\/.*/);
    await expect(page.locator('h1')).toContainText('Complete Loan Application (BOR-05)');

    // Submit application
    await page.click('[data-testid="btn-submit-application"]');

    // Next step is KYC handoff mock (BOR-07)
    await page.waitForURL(/.*#\/borrower\/kyc\/.*/);
    await expect(page.locator('[data-testid="sandbox-kyc-banner"]')).toBeVisible();

    // Complete mock KYC
    await page.click('[data-testid="btn-complete-mock-kyc"]');

    // Lands on case overview (BOR-03)
    await page.waitForURL(/.*#\/borrower\/overview/);
    await expect(page.locator('h1')).toContainText('My Healthcare Case (BOR-03)');
  });

  test('AT-04 & J10: Guessed or reused FRID: rate limited after 5 tries, no details leaked, audit logged', async ({ page }) => {
    await page.goto('/#/borrower/link');

    // Perform 5 consecutive failed linking attempts
    for (let i = 1; i <= 5; i++) {
      await page.fill('[data-testid="input-frid"]', 'HF-FAKE-GUES');
      await page.fill('[data-testid="input-token"]', `WRONG-TOKEN-${i}`);
      await page.click('[data-testid="btn-submit-link"]');
      await page.waitForTimeout(100);
    }

    // 6th attempt should hit the 15-minute rate limit lock
    await page.fill('[data-testid="input-frid"]', 'HF-FAKE-GUES');
    await page.fill('[data-testid="input-token"]', 'WRONG-TOKEN-6');
    await page.click('[data-testid="btn-submit-link"]');

    const alert = page.locator('.alert-error');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Too many failed attempts');
    await expect(alert).toContainText('locked for');

    // Verify audit log has the rate limit event
    const logs = await page.evaluate(() => window.__LSP_STORE__.getState().audit_logs);
    const lockEvent = logs.find(l => l.action === 'FRID_RATE_LIMIT_LOCKED');
    expect(lockEvent).toBeTruthy();
    expect(lockEvent.target_id).toBe('HF-FAKE-GUES');
  });

  test('AT-06: Borrower declines consent: nothing sent to lender; decline recorded', async ({ page }) => {
    // Navigate to consent page for seeded case CASE-1002
    await page.goto('/#/borrower/consent/CASE-1002');

    // Click Decline All
    await page.click('[data-testid="btn-decline-consent"]');

    // Check message
    const alert = page.locator('.alert-error');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Consent Declined (AT-06)');
    await expect(alert).toContainText('no information will be transmitted to regulated lenders');

    // Verify in store that no applications were created for CASE-1002
    const apps = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().applications.filter(a => a.case_id === 'CASE-1002');
    });
    expect(apps.length).toBe(0);

    // Verify consent record in store shows decline
    const consents = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().consents.filter(c => c.case_id === 'CASE-1002');
    });
    expect(consents.some(c => c.granted === false)).toBe(true);
  });
});

