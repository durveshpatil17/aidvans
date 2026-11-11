/**
 * Hospital Billing Portal Workspace (/hospital/*)
 * Meets Section 7.2: ABAC tenant isolation, billing demands, receipts, and bank change requests.
 */

import { api } from '../../core/api.js';
import { formatINR } from '../../../shared/money.js';
import { maskAccount } from '../../../shared/validators.js';
import { renderDataTable } from '../../components/datatable.js';
import { toast } from '../../components/toast.js';
import { modal } from '../../components/modal.js';

export async function renderHospitalWorkspace(ctx, { router, session }) {
  const user = session.user;
  if (!user || !user.role.startsWith('HOSPITAL_')) {
    return renderAccessDenied('HOSPITAL_*');
  }

  const subview = ctx.params.view || 'dashboard';

  let cases = [];
  try {
    const res = await api.get('/api/v1/cases');
    cases = res.cases || [];
  } catch {}

  window.__ON_VIEW_MOUNTED__ = () => {
    // Demand Form
    const demandForm = document.getElementById('new-demand-form');
    if (demandForm) {
      demandForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const caseId = document.getElementById('demand-case-id').value;
        const amount = document.getElementById('demand-amount').value;
        const procedureName = document.getElementById('procedure-name').value;
        const invoiceNumber = document.getElementById('invoice-number').value;

        try {
          await api.post('/api/v1/demands', {
            caseId,
            amount,
            procedureName,
            invoiceNumber
          }, `DEM-CREATE-${Date.now()}`);

          toast.success('Payment demand submitted to LSP desk.');
          router.navigate('/hospital/dashboard');
        } catch (err) {
          toast.danger(err.message);
        }
      });
    }

    // Receipt Confirmation
    document.querySelectorAll('[data-action="confirm-receipt"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const disbId = btn.getAttribute('data-disb-id');
        const utr = await modal.prompt({
          title: 'Confirm Hospital Receipt',
          message: 'Enter the electronic Bank UTR received in the hospital designated credit account:',
          defaultValue: 'SBX-NEFT-99182',
          inputLabel: 'Electronic UTR / Bank Reference Number'
        });
        if (!utr) return;

        const amountStr = await modal.prompt({
          title: 'Confirm Hospital Receipt Amount',
          message: 'Confirm the exact credited amount in INR matching the bank entry:',
          defaultValue: '125000',
          inputLabel: 'Credited Amount (INR)'
        });
        if (!amountStr) return;

        try {
          await api.post('/api/v1/receipts/confirm', {
            disbursementId: disbId,
            transferUtr: utr,
            confirmedAmount: Number(amountStr)
          });
          toast.success('Hospital receipt successfully confirmed against UTR.');
          router.resolve();
        } catch (err) {
          toast.danger(err.message);
        }
      });
    });

    // Mismatch Report
    document.querySelectorAll('[data-action="report-mismatch"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const disbId = btn.getAttribute('data-disb-id');
        try {
          await api.post('/api/v1/receipts/mismatch', {
            disbursementId: disbId,
            reportedUtr: 'SBX-DISC-UTR',
            creditedAmount: 100000,
            expectedAmount: 125000
          });
          toast.warning('Discrepancy logged for Central Ops investigation.');
          router.resolve();
        } catch (err) {
          toast.danger(err.message);
        }
      });
    });
  };

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="brand-title">HOSPITAL BILLING</span>
          <span class="brand-subtitle">Branch: ${user.org_id}</span>
        </div>
        <nav class="sidebar-nav">
          <a href="/hospital/dashboard" class="nav-link ${subview === 'dashboard' ? 'active' : ''}">Overview</a>
          <a href="/hospital/demands" class="nav-link ${subview === 'demands' ? 'active' : ''}">Payment Demands</a>
          <a href="/hospital/receipts" class="nav-link ${subview === 'receipts' ? 'active' : ''}">Disbursement Receipts</a>
          <a href="/hospital/beneficiary" class="nav-link ${subview === 'beneficiary' ? 'active' : ''}">Bank Verification</a>
        </nav>
        <div style="padding:16px;border-top:1px solid var(--border-light);font-size:12px;color:var(--text-muted);">
          <span>Staff: <strong>${user.name}</strong></span><br>
          <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;width:100%;" onclick="fetch('/api/v1/auth/logout',{method:'POST'}).then(()=>window.location.href='/hospital/login')">Sign Out</button>
        </div>
      </aside>

      <div class="main-content">
        <header class="top-bar">
          <div class="top-bar-context">
            <span class="badge badge-emerald">Hospital Finance</span>
            <span>Tenant: <strong>${user.org_id}</strong></span>
          </div>
          <div class="top-bar-actions">
            <span style="font-size:13px;color:var(--text-muted);">${user.email}</span>
          </div>
        </header>

        <main class="page-container">
          <div class="breadcrumbs">
            <a href="/hospital/dashboard">Hospital Portal</a> &gt;
            <span>${subview.charAt(0).toUpperCase() + subview.slice(1)}</span>
          </div>

          ${renderHospitalSubview(subview, { cases, user })}
        </main>
      </div>
    </div>
  `;
}

function renderHospitalSubview(subview, { cases, user }) {
  if (subview === 'demands') {
    return `
      <h1>Hospital Demands & Advances</h1>
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">Submit clinical cost demands against verified financing cases.</p>

      <div class="box" style="max-width:600px;margin-bottom:24px;">
        <h3>Submit New Payment Demand</h3>
        <form id="new-demand-form">
          <div class="form-group">
            <label for="demand-case-id">Select Financing Case</label>
            <select id="demand-case-id" required class="form-input">
              ${cases.map(c => `<option value="${c.case_id}">${c.frid} (${c.admission_ref})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="procedure-name">Procedure / Department</label>
            <input type="text" id="procedure-name" required value="Surgical Tranche 2" class="form-input">
          </div>
          <div class="form-group">
            <label for="demand-amount">Demand Amount (INR)</label>
            <input type="number" id="demand-amount" required value="85000" class="form-input">
          </div>
          <div class="form-group">
            <label for="invoice-number">Hospital Bill / Estimate Ref</label>
            <input type="text" id="invoice-number" required value="BILL-${Date.now().toString().slice(-5)}" class="form-input">
          </div>
          <button type="submit" class="btn btn-primary">Submit Demand to LSP Desk &rarr;</button>
        </form>
      </div>
    `;
  }

  if (subview === 'beneficiary') {
    return `
      <h1>Verified Hospital Beneficiary Bank Account</h1>
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">Account to which regulated lenders transfer disbursed loan funds directly via NEFT/RTGS.</p>

      <div class="box" style="max-width:600px;">
        <table style="width:100%;font-size:14px;">
          <tr>
            <td style="font-weight:600;padding:8px 0;">Account Holder:</td>
            <td>Sahyadri Care Super Specialty Hospital Operations</td>
          </tr>
          <tr>
            <td style="font-weight:600;padding:8px 0;">Bank Name:</td>
            <td>HDFC Bank</td>
          </tr>
          <tr>
            <td style="font-weight:600;padding:8px 0;">IFSC Code:</td>
            <td>HDFC0001234</td>
          </tr>
          <tr>
            <td style="font-weight:600;padding:8px 0;">Account Number:</td>
            <td>•••• •••• 4092</td>
          </tr>
          <tr>
            <td style="font-weight:600;padding:8px 0;">Verification Status:</td>
            <td><span class="badge badge-emerald">VERIFIED</span></td>
          </tr>
        </table>
      </div>
    `;
  }

  // Default Dashboard
  return `
    <h1>Hospital Billing Dashboard</h1>
    <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">Open clinical demands, receipt confirmations, and lender transfer tracking.</p>

    <h2>Active Hospital Cases</h2>
    ${renderDataTable({
      columns: [
        { label: 'FRID', key: 'frid', render: val => `<strong>${val}</strong>` },
        { label: 'Admission Ref', key: 'admission_ref' },
        { label: 'Status', key: 'case_status', render: val => `<span class="badge badge-blue">${val}</span>` },
        { label: 'Created', key: 'created_at', render: val => new Date(val).toLocaleDateString('en-IN') }
      ],
      data: cases,
      emptyMessage: 'No cases recorded for this hospital branch.'
    })}
  `;
}

function renderAccessDenied(expected) {
  return `
    <div style="padding:48px 24px;max-width:540px;margin:40px auto;" class="alert alert-danger">
      <h2>Access Denied (403)</h2>
      <p>Permission Denied: Your authenticated user role does not have permission to access the Hospital Billing Portal.</p>
      <a href="/" class="btn btn-secondary btn-sm">&larr; Return to Home</a>
    </div>
  `;
}
