export function renderPrivacy() {
  return `
    <div style="min-height:100vh;display:flex;flex-direction:column;">
      <header class="top-bar">
        <div class="top-bar-context"><a href="/" class="brand-title">AIDVANS HEALTHCARE FINANCING</a></div>
        <div class="top-bar-actions"><a href="/" class="nav-link">Home</a></div>
      </header>
      <main class="page-container" style="max-width:800px;margin:30px auto;">
        <h1>Privacy Notice & Consent Policy</h1>
        <div class="box">
          <h3>Statutory Data Protection Mandate</h3>
          <p style="color:var(--text-muted);font-size:14px;">Aidvans adheres strictly to the Digital Personal Data Protection (DPDP) Act and RBI Digital Lending Guidelines. All borrower data collected is strictly purpose-specific. Consent is unbundled and can be withdrawn by borrowers at any time via the Borrower Privacy Centre.</p>
          <p style="color:var(--text-muted);font-size:14px;">Hospital staff never see borrower KYC records, credit scores, PAN, Aadhaar, or bureau data.</p>
        </div>
      </main>
    </div>
  `;
}

