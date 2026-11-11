/**
 * Public Landing Page (home.js)
 * High-density banking aesthetics, zero buzzwords, RBI statutory disclosures.
 */

export function renderPublicHome() {
  return `
    <div style="min-height:100vh;display:flex;flex-direction:column;">
      <header class="top-bar" style="height:64px;">
        <div class="top-bar-context">
          <span class="brand-title">AIDVANS HEALTHCARE FINANCING</span>
          <span style="font-size:12px;color:var(--text-subtle);">| Lending Service Platform</span>
        </div>
        <div class="top-bar-actions">
          <a href="/login" class="btn btn-primary btn-sm">One-Click Login Portal</a>
          <a href="/how-it-works" class="nav-link">How It Works</a>
          <a href="/privacy" class="nav-link">Privacy</a>
          <a href="/grievance" class="nav-link">Grievance</a>
          <a href="/borrower/login" class="btn btn-secondary btn-sm">Borrower Access</a>
          <a href="/executive/login" class="btn btn-secondary btn-sm">Staff Login</a>
        </div>
      </header>

      <main class="page-container" style="max-width:960px;margin:40px auto;flex:1;">
        <div class="box" style="padding:40px;border-left:4px solid var(--primary);">
          <span class="badge badge-blue">Regulated Lending Service Platform</span>
          <h1 style="font-size:28px;margin:12px 0 8px 0;">Assisted Medical Financing Desk & Direct Hospital Settlement</h1>
          <p style="font-size:16px;color:var(--text-muted);margin-bottom:24px;line-height:1.6;">
            Aidvans facilitates hospital-desk credit origination for accredited Indian healthcare institutions.
            Borrowers review transparent Key Fact Statements (KFS) from regulated NBFCs with zero platform fees,
            and approved tranches disburse directly to verified hospital beneficiary bank accounts.
          </p>

          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <a href="/login" class="btn btn-primary">Open All Logins Portal (One-Click Access) &rarr;</a>
            <a href="/executive/login" class="btn btn-secondary">LSP Executive Desk &rarr;</a>
            <a href="/hospital/login" class="btn btn-secondary">Hospital Billing Portal &rarr;</a>
            <a href="/borrower/login" class="btn btn-secondary">Borrower / Patient Access &rarr;</a>
          </div>
        </div>

        <div class="alert alert-info">
          <strong>Mandatory Regulatory Disclosure (RBI Digital Lending Guidelines):</strong><br>
          Aidvans acts strictly as an agent of regulated lending partners (NBFCs). We do not lend funds, do not make credit underwriting decisions, collect zero platform fees from borrowers, and never hold, route, or touch loan or hospital funds.
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin:32px 0;">
          <div class="box" style="margin:0;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:var(--primary);">12</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Accredited Hospital Branches</div>
          </div>
          <div class="box" style="margin:0;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:var(--primary);">2</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Regulated Partner NBFCs</div>
          </div>
          <div class="box" style="margin:0;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:var(--success);">₹0</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Borrower Platform Fee</div>
          </div>
          <div class="box" style="margin:0;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:var(--primary);">100%</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Direct Hospital Transfer</div>
          </div>
        </div>

        <h2>Workspaces & Portals</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;">
          <div class="box" style="margin:0;">
            <h3>LSP Executive Desk</h3>
            <p style="font-size:14px;color:var(--text-muted);">Hospital-based desk for origination, patient/borrower separation, FRID generation, and offer assistance.</p>
            <a href="/executive/login" class="btn btn-secondary btn-sm">Enter Executive Desk</a>
          </div>
          <div class="box" style="margin:0;">
            <h3>Hospital Billing Portal</h3>
            <p style="font-size:14px;color:var(--text-muted);">Hospital finance staff demand submission, receipt confirmation against lender UTRs, and bank accounts.</p>
            <a href="/hospital/login" class="btn btn-secondary btn-sm">Enter Hospital Portal</a>
          </div>
          <div class="box" style="margin:0;">
            <h3>Central Operations & Admin</h3>
            <p style="font-size:14px;color:var(--text-muted);">Exception workbench, 3-way daily reconciliation, maker-checker bank approval, and audit log.</p>
            <a href="/ops/login" class="btn btn-secondary btn-sm">Enter Operations</a>
          </div>
        </div>
      </main>
    </div>
  `;
}

