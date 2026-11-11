export function renderStatus() {
  return `
    <div style="min-height:100vh;display:flex;flex-direction:column;">
      <header class="top-bar">
        <div class="top-bar-context"><a href="/" class="brand-title">AIDVANS HEALTHCARE FINANCING</a></div>
        <div class="top-bar-actions"><a href="/" class="nav-link">Home</a></div>
      </header>
      <main class="page-container" style="max-width:800px;margin:30px auto;">
        <h1>Platform System Status</h1>
        <div class="box">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span><strong>Core BFF API Service:</strong></span>
            <span class="badge badge-emerald">OPERATIONAL</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span><strong>Lender A (CareFinance) Integration:</strong></span>
            <span class="badge badge-emerald">ONLINE (Redirect Mode)</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span><strong>Lender B (HealthCredit) Integration:</strong></span>
            <span class="badge badge-emerald">ONLINE (Iframe + Fallback)</span>
          </div>
        </div>
      </main>
    </div>
  `;
}

