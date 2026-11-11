import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

test.describe('Tier 3 Performance: Bundle Budgets (< 40KB login, < 100KB workspaces)', () => {
  const ROOT_DIR = path.resolve();
  const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

  function getGzipSize(filePath) {
    const content = fs.readFileSync(filePath);
    return zlib.gzipSync(content).length;
  }

  test('Shared CSS bundle is under 15 KB gzipped', () => {
    const cssPath = path.join(PUBLIC_DIR, 'css', 'app.css');
    const size = getGzipSize(cssPath);
    expect(size).toBeLessThan(15 * 1024);
  });

  test('Shared HTML shell is under 5 KB gzipped', () => {
    const htmlPath = path.join(PUBLIC_DIR, 'index.html');
    const size = getGzipSize(htmlPath);
    expect(size).toBeLessThan(5 * 1024);
  });

  test('All workspace login page bundles are under 40 KB gzipped', () => {
    const workspaces = ['executive', 'hospital', 'borrower', 'ops', 'admin', 'compliance', 'support'];
    const cssSize = getGzipSize(path.join(PUBLIC_DIR, 'css', 'app.css'));
    const coreApiSize = getGzipSize(path.join(PUBLIC_DIR, 'js', 'core', 'api.js'));
    const coreRouterSize = getGzipSize(path.join(PUBLIC_DIR, 'js', 'core', 'router.js'));
    const coreSessionSize = getGzipSize(path.join(PUBLIC_DIR, 'js', 'core', 'session.js'));

    for (const ws of workspaces) {
      const loginPath = path.join(PUBLIC_DIR, 'js', 'workspaces', ws, 'login.js');
      const loginSize = getGzipSize(loginPath);
      const totalFirstLoadGzipped = cssSize + coreApiSize + coreRouterSize + coreSessionSize + loginSize;

      expect(totalFirstLoadGzipped).toBeLessThan(40 * 1024);
    }
  });

  test('All workspace full bundle trees are under 100 KB gzipped', () => {
    const workspaces = ['executive', 'hospital', 'borrower', 'ops', 'admin', 'compliance', 'support'];
    const cssSize = getGzipSize(path.join(PUBLIC_DIR, 'css', 'app.css'));

    for (const ws of workspaces) {
      const wsDir = path.join(PUBLIC_DIR, 'js', 'workspaces', ws);
      const files = fs.readdirSync(wsDir).filter(f => f.endsWith('.js'));
      let wsTotalBytes = cssSize;

      for (const f of files) {
        wsTotalBytes += getGzipSize(path.join(wsDir, f));
      }

      expect(wsTotalBytes).toBeLessThan(100 * 1024);
    }
  });
});

