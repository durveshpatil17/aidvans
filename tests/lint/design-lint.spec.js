import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Tier 3 Lint: Design System, Regulatory Copy & Security Linting', () => {
  const ROOT_DIR = path.resolve();
  const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

  function getAllFiles(dir, exts = ['.js', '.html', '.css']) {
    let files = [];
    if (!fs.existsSync(dir)) return files;
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        files = files.concat(getAllFiles(full, exts));
      } else if (exts.includes(path.extname(full))) {
        files.push(full);
      }
    }
    return files;
  }

  test('Non-Negotiable Rule: Zero occurrences of forbidden word "Paid" in public UI code', () => {
    const files = getAllFiles(PUBLIC_DIR, ['.js', '.html']);
    const violations = [];

    // Match "paid" as a distinct word, excluding comments like // Zero 'Paid'
    const wordPaidRegex = /\bpaid\b/i;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Skip comment lines
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

        if (wordPaidRegex.test(line)) {
          violations.push(`${file}:${idx + 1} -> ${trimmed}`);
        }
      });
    }

    expect(violations, `Found forbidden word "Paid" in UI code: \n${violations.join('\n')}`).toEqual([]);
  });

  test('Design Rule: Zero emojis in public files', () => {
    const files = getAllFiles(PUBLIC_DIR, ['.js', '.html', '.css']);
    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2700}-\u{27BF}]/u;
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (emojiRegex.test(line)) {
          violations.push(`${file}:${idx + 1} -> ${line.trim()}`);
        }
      });
    }

    expect(violations, `Found emojis in UI code: \n${violations.join('\n')}`).toEqual([]);
  });

  test('Design Rule: Zero gradients or shadows in CSS', () => {
    const cssPath = path.join(PUBLIC_DIR, 'css', 'app.css');
    const content = fs.readFileSync(cssPath, 'utf8');

    expect(content).not.toContain('linear-gradient');
    expect(content).not.toContain('radial-gradient');
    expect(content).not.toContain('box-shadow');
    expect(content).not.toContain('text-shadow');
  });

  test('Code Quality: Zero native alert(), confirm(), prompt() in public JS', () => {
    const files = getAllFiles(PUBLIC_DIR, ['.js']);
    const nativeDialogRegex = /\b(window\.)?(alert|confirm|prompt)\s*\(/;
    const violations = [];

    for (const file of files) {
      // Allow modal.js component definition itself
      if (file.endsWith('modal.js')) continue;

      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
        // Don't match modal.confirm or modal.prompt
        if (/modal\.(confirm|prompt|alert)/.test(line)) return;

        if (nativeDialogRegex.test(line)) {
          violations.push(`${file}:${idx + 1} -> ${trimmed}`);
        }
      });
    }

    expect(violations, `Found native alert/confirm/prompt in UI code: \n${violations.join('\n')}`).toEqual([]);
  });

  test('Code Quality: Zero console.log in public JS files', () => {
    const files = getAllFiles(PUBLIC_DIR, ['.js']);
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
        if (/console\.log\s*\(/.test(line)) {
          violations.push(`${file}:${idx + 1} -> ${trimmed}`);
        }
      });
    }

    expect(violations, `Found console.log in public UI code: \n${violations.join('\n')}`).toEqual([]);
  });

  test('Architecture Rule: Zero hash routes (#/) in navigation links', () => {
    const files = getAllFiles(PUBLIC_DIR, ['.js', '.html']);
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
        if (/href=["']#\//.test(line)) {
          violations.push(`${file}:${idx + 1} -> ${trimmed}`);
        }
      });
    }

    expect(violations, `Found hash route (#/) in navigation links: \n${violations.join('\n')}`).toEqual([]);
  });
});

