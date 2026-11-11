/**
 * Client-Side History API Router
 * Implements real path routing (pushState/popstate) without hash fragments.
 * Dynamically updates document <title> and manages workspace shells.
 */

export class HistoryRouter {
  constructor(appRootId = 'app-root') {
    this.appRoot = document.getElementById(appRootId);
    this.routes = [];
    this.currentPath = window.location.pathname;

    window.addEventListener('popstate', () => {
      this.resolve(window.location.pathname);
    });

    // Intercept internal link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || link.getAttribute('target') === '_blank') {
        return;
      }

      e.preventDefault();
      this.navigate(href);
    });
  }

  register(pathPattern, handler, options = {}) {
    const paramNames = [];
    const regexStr = '^' + pathPattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    }) + '$';

    this.routes.push({
      pattern: pathPattern,
      regex: new RegExp(regexStr),
      paramNames,
      handler,
      title: options.title || 'Aidvans Healthcare Financing LSP',
      workspace: options.workspace || null,
      requiredRole: options.requiredRole || null
    });
  }

  navigate(pathname) {
    if (window.location.pathname === pathname) return;
    window.history.pushState({}, '', pathname);
    this.resolve(pathname);
  }

  async resolve(pathname = window.location.pathname) {
    this.currentPath = pathname;
    let matched = null;
    let params = {};

    for (const route of this.routes) {
      const match = pathname.match(route.regex);
      if (match) {
        matched = route;
        route.paramNames.forEach((name, idx) => {
          params[name] = decodeURIComponent(match[idx + 1]);
        });
        break;
      }
    }

    if (!matched) {
      document.title = '404 Page Not Found | Aidvans LSP';
      this.appRoot.innerHTML = `
        <div style="padding:48px 24px;text-align:center;max-width:480px;margin:40px auto;">
          <h2>404 — Page Not Found</h2>
          <p style="color:var(--text-muted);">The requested URL path '${pathname}' does not exist on this server.</p>
          <a href="/" class="btn btn-primary btn-sm">Return to Home</a>
        </div>
      `;
      return;
    }

    document.title = `${matched.title} | Aidvans LSP`;

    try {
      this.appRoot.innerHTML = `<div style="padding:48px 24px;text-align:center;"><p>Loading view...</p></div>`;
      const html = await matched.handler({ pathname, params });
      this.appRoot.innerHTML = html;

      // Execute view mounted callback if defined
      if (typeof window.__ON_VIEW_MOUNTED__ === 'function') {
        window.__ON_VIEW_MOUNTED__();
        window.__ON_VIEW_MOUNTED__ = null;
      }
    } catch (err) {
      document.title = 'Application Error | Aidvans LSP';
      this.appRoot.innerHTML = `
        <div style="padding:48px 24px;max-width:540px;margin:40px auto;" class="alert alert-danger">
          <h3>Error Loading Page</h3>
          <p>${err.message}</p>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.location.reload()">Reload</button>
        </div>
      `;
    }
  }
}

