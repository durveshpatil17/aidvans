import { expect } from '@playwright/test';

/**
 * Attaches console error and warning listeners to the page.
 * Returns a function that asserts zero console errors/warnings occurred.
 */
export function setupConsoleCheck(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });
  return () => {
    expect(errors, `Expected zero console errors, but found: ${errors.join('; ')}`).toEqual([]);
  };
}

/**
 * Attaches request listener to ensure no requests to external origins are made.
 */
export function setupNetworkCheck(page) {
  const externalRequests = [];
  page.on('request', req => {
    const url = new URL(req.url());
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      externalRequests.push(req.url());
    }
  });
  return () => {
    expect(externalRequests, `Expected zero external network requests, but found: ${externalRequests.join(', ')}`).toEqual([]);
  };
}

/**
 * Resets prototype data to canonical seed state.
 */
export async function resetData(page) {
  await page.goto('/#/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    if (window.__LSP_STORE__) {
      window.__LSP_STORE__.reset();
    }
  });
  await page.waitForTimeout(50);
}

/**
 * Switch role or log in as a specific persona (by ID or role).
 */
export async function loginAs(page, userIdOrRole) {
  await page.goto('/#/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((uid) => {
    if (window.__LSP_STORE__) {
      window.__LSP_STORE__.setCurrentUser(uid);
    }
  }, userIdOrRole);
  const select = page.locator('[data-testid="role-switcher-select"]');
  if (await select.isVisible()) {
    await select.selectOption({ value: userIdOrRole }).catch(() => {});
  }
  await page.waitForTimeout(100);
}

/**
 * Lender sandbox actions for controlling the NBFC mock.
 */
export const lenderSandbox = {
  async navigate(page) {
    await page.goto('/#/sandbox/lender');
    await page.waitForLoadState('domcontentloaded');
  },

  async approveApplication(page, appId) {
    await this.navigate(page);
    await page.click(`[data-testid="lender-action-approve-${appId}"]`);
    await page.waitForTimeout(150);
  },

  async rejectApplication(page, appId, reason = 'Underwriting criteria not met') {
    await this.navigate(page);
    await page.fill(`[data-testid="lender-reject-reason-${appId}"]`, reason);
    await page.click(`[data-testid="lender-action-reject-${appId}"]`);
    await page.waitForTimeout(150);
  },

  async sanctionLowerAmount(page, appId, amount) {
    await this.navigate(page);
    await page.fill(`[data-testid="lender-lower-amount-${appId}"]`, String(amount));
    await page.click(`[data-testid="lender-action-sanction-lower-${appId}"]`);
    await page.waitForTimeout(150);
  },

  async requestMoreInfo(page, appId, query = 'Additional salary slips needed') {
    await this.navigate(page);
    await page.fill(`[data-testid="lender-info-query-${appId}"]`, query);
    await page.click(`[data-testid="lender-action-request-info-${appId}"]`);
    await page.waitForTimeout(150);
  },

  async simulateTimeout(page, appId) {
    await this.navigate(page);
    await page.click(`[data-testid="lender-action-timeout-${appId}"]`);
    await page.waitForTimeout(150);
  },

  async approveDrawdown(page, drawdownId) {
    await this.navigate(page);
    await page.click(`[data-testid="lender-drawdown-approve-${drawdownId}"]`);
    await page.waitForTimeout(150);
  },

  async rejectDrawdown(page, drawdownId, reason = 'Limit exceeded') {
    await this.navigate(page);
    await page.fill(`[data-testid="lender-drawdown-reject-reason-${drawdownId}"]`, reason);
    await page.click(`[data-testid="lender-drawdown-reject-${drawdownId}"]`);
    await page.waitForTimeout(150);
  },

  async confirmDisbursement(page, disbId) {
    await this.navigate(page);
    await page.click(`[data-testid="lender-disb-confirm-${disbId}"]`);
    await page.waitForTimeout(150);
  },

  async failDisbursement(page, disbId, reason = 'Account beneficiary mismatch at bank') {
    await this.navigate(page);
    await page.fill(`[data-testid="lender-disb-fail-reason-${disbId}"]`, reason);
    await page.click(`[data-testid="lender-disb-fail-${disbId}"]`);
    await page.waitForTimeout(150);
  },

  async reverseDisbursement(page, disbId, reason = 'Bank return: NEFT technical failure') {
    await this.navigate(page);
    await page.fill(`[data-testid="lender-disb-reverse-reason-${disbId}"]`, reason);
    await page.click(`[data-testid="lender-disb-reverse-${disbId}"]`);
    await page.waitForTimeout(150);
  },

  async duplicateWebhook(page, eventId) {
    await this.navigate(page);
    await page.click(`[data-testid="lender-webhook-duplicate-${eventId}"]`);
    await page.waitForTimeout(150);
  }
};
