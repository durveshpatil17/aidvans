import { test, expect } from '@playwright/test';
import { setupConsoleCheck, setupNetworkCheck, resetData } from './helpers/test-utils.js';

test.describe('Slice S10: Enterprise Auth Portal & RBAC Workspaces', () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test('S10-01: Auth Portal renders on #/login with Staff SSO and Borrower tabs', async ({ page }) => {
    const assertNoErrors = setupConsoleCheck(page);
    const assertNoExternal = setupNetworkCheck(page);

    await page.goto('http://localhost:3000/#/login');
    await page.waitForLoadState('domcontentloaded');

    // Check title and regulatory badges
    await expect(page.locator('h1.auth-title')).toContainText('Enterprise Healthcare Financing Portal');
    await expect(page.locator('.auth-brand-badge')).toContainText('RBI Compliant');

    // Check both tabs exist
    const staffTab = page.locator('#tab-btn-staff');
    const borrowerTab = page.locator('#tab-btn-borrower');
    await expect(staffTab).toBeVisible();
    await expect(borrowerTab).toBeVisible();

    // Verify staff persona cards are rendered
    await expect(page.locator('[data-testid="btn-login-USR-PRIYA"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-login-USR-SUNITA"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-login-USR-VIKRAM"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-login-USR-ADITI"]')).toBeVisible();

    // Switch to Borrower tab
    await borrowerTab.click();
    await expect(page.locator('#login-section-borrower')).toBeVisible();
    await expect(page.locator('[data-testid="btn-login-BOR-B1"]')).toBeVisible();

    assertNoErrors();
    assertNoExternal();
  });

  test('S10-02: Executive login (Priya Sharma) sets RBAC and navigates to Executive Desk', async ({ page }) => {
    await page.goto('http://localhost:3000/#/login');
    await page.click('[data-testid="btn-login-USR-PRIYA"]');

    // Expect navigation to Executive Dashboard
    await page.waitForURL('**/#/executive/dashboard');
    await expect(page.locator('h1')).toContainText('Executive Financing Desk');

    // Header should show user profile chip
    const userChip = page.locator('#header-user-status');
    await expect(userChip).toBeVisible();
    await expect(userChip).toContainText('Priya Sharma');

    // Check Executive workspace navigation items
    const nav = page.locator('#main-nav');
    await expect(nav).toContainText('Cases & Pipeline');
    await expect(nav).toContainText('+ New Case');
    await expect(nav).toContainText('Disbursements');
  });

  test('S10-03: Hospital Finance login (Sunita Patil) routes to Hospital Dashboard and enforces scope', async ({ page }) => {
    await page.goto('http://localhost:3000/#/login');
    await page.click('[data-testid="btn-login-USR-SUNITA"]');

    // Expect navigation to Hospital Dashboard
    await page.waitForURL('**/#/hospital/dashboard');
    await expect(page.locator('h1')).toContainText('Hospital Portal Dashboard');

    // Verify hospital name in header context
    const userChip = page.locator('#header-user-status');
    await expect(userChip).toBeVisible();
    await expect(userChip).toContainText('Sunita Patil');

    // Check Hospital workspace navigation items
    const nav = page.locator('#main-nav');
    await expect(nav).toContainText('Hospital Cases');
    await expect(nav).toContainText('Receipt Confirmation');
    await expect(nav).toContainText('Bank Verification');

    // Verify admin links are NOT present in hospital navbar
    await expect(nav).not.toContainText('Admin Control');
    await expect(nav).not.toContainText('User Directory');
  });

  test('S10-04: Operations Manager login (Vikram Malhotra) routes to Ops Dashboard and Exception Workbench', async ({ page }) => {
    await page.goto('http://localhost:3000/#/login');
    await page.click('[data-testid="btn-login-USR-VIKRAM"]');

    // Expect navigation to Ops Dashboard
    await page.waitForURL('**/#/ops/dashboard');
    await expect(page.locator('h1')).toContainText('Operations Control Workbench');

    // Check Ops workspace navigation items
    const nav = page.locator('#main-nav');
    await expect(nav).toContainText('Ops Overview');
    await expect(nav).toContainText('Exception Workbench');
    await expect(nav).toContainText('Daily Reconciliation');
  });

  test('S10-05: Platform Admin login (Aditi Joshi) routes to Admin Control and User Directory', async ({ page }) => {
    await page.goto('http://localhost:3000/#/login');
    await page.click('[data-testid="btn-login-USR-ADITI"]');

    // Expect navigation to Admin Dashboard
    await page.waitForURL('**/#/admin/dashboard');
    await expect(page.locator('h1')).toContainText('Platform Administration');

    // Check Admin workspace navigation items
    const nav = page.locator('#main-nav');
    await expect(nav).toContainText('Admin Control');
    await expect(nav).toContainText('User Directory');
    await expect(nav).toContainText('Hospital Accounts');
    await expect(nav).toContainText('Lender Products');
    await expect(nav).toContainText('Audit Logs');
  });

  test('S10-06: Sign Out button logs out user, resets session, and navigates back to #/login', async ({ page }) => {
    // Start logged in as Executive
    await page.goto('http://localhost:3000/#/login');
    await page.click('[data-testid="btn-login-USR-PRIYA"]');
    await page.waitForURL('**/#/executive/dashboard');

    // Click Sign Out
    await page.click('#btn-sign-out');
    await page.waitForURL('**/#/login');

    // Verify user profile chip is hidden
    const userChip = page.locator('#header-user-status');
    await expect(userChip).toBeHidden();

    // Try accessing restricted executive route directly
    await page.goto('http://localhost:3000/#/executive/dashboard');
    await expect(page.locator('.alert-error')).toContainText('Access Denied');
  });

  test('S10-07: Public landing page contains direct links to Auth Portal and Borrower Linking Desk', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');

    // Check Hero CTA buttons
    const signInCta = page.locator('a[href="#/login"]').first();
    await expect(signInCta).toBeVisible();

    const linkCta = page.locator('a[href="#/borrower/link"]').first();
    await expect(linkCta).toBeVisible();

    // Clicking Sign In navigates to Auth Portal
    await signInCta.click();
    await page.waitForURL('**/#/login');
    await expect(page.locator('h1.auth-title')).toBeVisible();
  });

  test('S10-08: Capture production screenshots of Auth Portal and Landing Page', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'docs/screens/PUB-01.png' });

    await page.goto('http://localhost:3000/#/login');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'docs/screens/AUTH-01.png' });

    await page.click('#tab-btn-borrower');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'docs/screens/AUTH-02-borrower.png' });
  });
});
