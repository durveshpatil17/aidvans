export function renderHowItWorks() {
  return `
    <div style="min-height:100vh;display:flex;flex-direction:column;">
      <header class="top-bar">
        <div class="top-bar-context"><a href="/" class="brand-title">AIDVANS HEALTHCARE FINANCING</a></div>
        <div class="top-bar-actions"><a href="/" class="nav-link">Home</a><a href="/executive/login" class="btn btn-primary btn-sm">Sign In</a></div>
      </header>
      <main class="page-container" style="max-width:800px;margin:30px auto;">
        <h1>How Medical Financing Facilitation Works</h1>
        <div class="box">
          <h3>Step 1: Case Origination at Hospital Desk</h3>
          <p style="color:var(--text-muted);font-size:14px;">The hospital financing executive creates a financing case, separates clinical patient data from borrower details, and generates a unique Financing Reference ID (FRID).</p>
        </div>
        <div class="box">
          <h3>Step 2: Borrower Linking & Purpose-Specific Consent</h3>
          <p style="color:var(--text-muted);font-size:14px;">The borrower links using their FRID and one-time token. Consent is collected for explicit purposes (credit evaluation, hospital billing verification, statutory retention) with no bundling.</p>
        </div>
        <div class="box">
          <h3>Step 3: Regulated NBFC Underwriting & KFS</h3>
          <p style="color:var(--text-muted);font-size:14px;">Regulated partner NBFCs evaluate credit. Borrowers compare objective offers with standardized Key Fact Statements (KFS) including total cost of credit and APR.</p>
        </div>
        <div class="box">
          <h3>Step 4: Direct Verified Hospital Disbursement</h3>
          <p style="color:var(--text-muted);font-size:14px;">The lender confirms direct electronic fund transfer (NEFT/RTGS) to the hospital's verified beneficiary bank account. The hospital confirms receipt separately.</p>
        </div>
      </main>
    </div>
  `;
}

