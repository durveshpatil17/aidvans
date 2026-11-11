export function renderGrievance() {
  return `
    <div style="min-height:100vh;display:flex;flex-direction:column;">
      <header class="top-bar">
        <div class="top-bar-context"><a href="/" class="brand-title">AIDVANS HEALTHCARE FINANCING</a></div>
        <div class="top-bar-actions"><a href="/" class="nav-link">Home</a></div>
      </header>
      <main class="page-container" style="max-width:800px;margin:30px auto;">
        <h1>Grievance Redressal Mechanism</h1>
        <div class="box">
          <h3>Nodal Grievance Redressal Officer</h3>
          <p style="color:var(--text-muted);font-size:14px;">In compliance with Reserve Bank of India (RBI) Digital Lending Guidelines:</p>
          <ul style="font-size:14px;color:var(--text-main);line-height:1.8;">
            <li><strong>LSP Nodal Officer:</strong> Vikram Malhotra</li>
            <li><strong>Email:</strong> grievance@aidvans.mock</li>
            <li><strong>Toll-Free Helpline:</strong> 1800-2026-999</li>
            <li><strong>Escalation Turnaround Time (TAT):</strong> Maximum 30 calendar days</li>
          </ul>
        </div>
      </main>
    </div>
  `;
}
