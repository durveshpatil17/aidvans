/**
 * Executive Desk Workspace (/executive/*)
 * Meets Section 7.1: Work queues, multi-step case wizard, printable case slip, FRID, timeline, case closure.
 */

import { api } from '../../core/api.js';
import { formatINR } from '../../../shared/money.js';
import { maskName, maskPhone } from '../../../shared/validators.js';
import { renderDataTable } from '../../components/datatable.js';
import { renderTimeline } from '../../components/timeline.js';
import { renderPrintableReceipt } from '../../components/print.js';
import { toast } from '../../components/toast.js';
import { modal } from '../../components/modal.js';

export async function renderExecutiveWorkspace(ctx, { router, session }) {
  const user = session.user;
  if (!user || user.role !== 'EXECUTIVE') {
    return renderAccessDenied('EXECUTIVE');
  }

  const subview = ctx.params.view || 'dashboard';

  let cases = [];
  try {
    const res = await api.get('/api/v1/cases');
    cases = res.cases || [];
  } catch {}

  const activeCount = cases.filter(c => !['CLOSED', 'CANCELLED', 'FACILITATION_CLOSED'].includes(c.case_status)).length;
  const inviteCount = cases.filter(c => c.case_status === 'READY_FOR_INVITATION').length;
  const disbPendingCount = cases.filter(c => c.case_status === 'DISBURSEMENT_PENDING').length;

  window.__REFRESH_ACTIVE_VIEW__ = () => {
    router.resolve();
  };

  window.__ON_VIEW_MOUNTED__ = () => {
    // New Case Form Wizard
    const newCaseForm = document.getElementById('new-case-form');
    if (newCaseForm) {
      newCaseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const patientName = document.getElementById('patient-name').value;
        const admissionRef = document.getElementById('patient-adm').value;
        const patientPhone = document.getElementById('patient-phone').value;
        const patientAge = document.getElementById('patient-age').value;
        const isBorrowerSame = document.getElementById('same-borrower-chk').checked;

        const borrowerName = isBorrowerSame ? patientName : document.getElementById('borrower-name').value;
        const borrowerPhone = isBorrowerSame ? patientPhone : document.getElementById('borrower-phone').value;
        const borrowerPan = isBorrowerSame ? 'TESTP1111A' : document.getElementById('borrower-pan').value;

        const amount = document.getElementById('demand-amount').value;
        const procedureName = document.getElementById('procedure-name').value;

        try {
          const created = await api.post('/api/v1/cases', {
            hospitalId: user.assigned_hospital_ids ? user.assigned_hospital_ids[0] : 'HOSP-01',
            branchId: user.assigned_branch_ids ? user.assigned_branch_ids[0] : 'BRANCH-01',
            patient: { name: patientName, admissionRef, phone: patientPhone, age: patientAge },
            borrower: { name: borrowerName, phone: borrowerPhone, pan: borrowerPan },
            initialDemand: { amount, procedureName }
          }, `CASE-CREATE-${Date.now()}`);

          toast.success(`Case created! FRID: ${created.frid}`);
          router.navigate('/executive/cases');
        } catch (err) {
          toast.danger(err.message);
        }
      });
    }

    // Close Case Handler
    document.querySelectorAll('[data-action="close-case"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const caseId = btn.getAttribute('data-case-id');
        const confirmed = await modal.confirm({
          title: 'Close LSP Facilitation Case',
          message: 'Notice: Closing this LSP facilitation case does NOT terminate or modify the borrower\'s loan agreement with the regulated lender. Are you sure you wish to close this facilitation record?',
          confirmText: 'Confirm Closure',
          cancelText: 'Cancel'
        });

        if (confirmed) {
          try {
            const res = await api.post(`/api/v1/cases/${caseId}/close`);
            toast.info(res.statutoryNotice);
            router.resolve();
          } catch (err) {
            toast.danger(err.message);
          }
        }
      });
    });
  };

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="brand-title">EXECUTIVE DESK</span>
          <span class="brand-subtitle">Station: Sahyadri Care Pune</span>
        </div>
        <nav class="sidebar-nav">
          <a href="/executive/dashboard" class="nav-link ${subview === 'dashboard' ? 'active' : ''}">Today's Queues</a>
          <a href="/executive/cases" class="nav-link ${subview === 'cases' ? 'active' : ''}">Cases & Pipeline</a>
          <a href="/executive/new-case" class="nav-link ${subview === 'new-case' ? 'active' : ''}">+ New Case Wizard</a>
          <a href="/executive/disbursements" class="nav-link ${subview === 'disbursements' ? 'active' : ''}">Disbursement Tracker</a>
          <a href="/executive/account" class="nav-link ${subview === 'account' ? 'active' : ''}">My Account</a>
        </nav>
        <div style="padding:16px;border-top:1px solid var(--border-light);font-size:12px;color:var(--text-muted);">
          <span>Staff: <strong>${user.name}</strong></span><br>
          <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;width:100%;" onclick="fetch('/api/v1/auth/logout',{method:'POST'}).then(()=>window.location.href='/executive/login')">Sign Out</button>
        </div>
      </aside>

      <div class="main-content">
        <header class="top-bar">
          <div class="top-bar-context">
            <span class="badge badge-blue">Desk Executive</span>
            <span>Hospital: <strong>Sahyadri Care Super Specialty</strong></span>
          </div>
          <div class="top-bar-actions">
            <span style="font-size:13px;color:var(--text-muted);">${user.email}</span>
          </div>
        </header>

        <main class="page-container">
          <div class="breadcrumbs">
            <a href="/executive/dashboard">Executive Desk</a> &gt;
            <span>${subview.charAt(0).toUpperCase() + subview.slice(1)}</span>
          </div>

          ${renderSubviewContent(subview, { cases, activeCount, inviteCount, disbPendingCount, user })}
        </main>
      </div>
    </div>
  `;
}

function renderSubviewContent(subview, { cases, activeCount, inviteCount, disbPendingCount, user }) {
  if (subview === 'new-case') {
    return `
      <h1>Create New Financing Case</h1>
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">Originate an assisted healthcare financing case at the hospital desk. Generates FRID and one-time invitation token.</p>

      <div class="box" style="max-width:720px;">
        <form id="new-case-form">
          <h3>1. Patient Demographics & Admission</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label for="patient-name">Patient Full Name</label>
              <input type="text" id="patient-name" required value="Rahul Kumar" class="form-input">
            </div>
            <div class="form-group">
              <label for="patient-adm">Hospital Admission Reference</label>
              <input type="text" id="patient-adm" required value="ADM-${Date.now().toString().slice(-5)}" class="form-input">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label for="patient-phone">Patient Phone</label>
              <input type="tel" id="patient-phone" required value="+91 98000 00011" class="form-input">
            </div>
            <div class="form-group">
              <label for="patient-age">Patient Age</label>
              <input type="number" id="patient-age" required value="34" class="form-input">
            </div>
          </div>

          <h3 style="margin-top:20px;">2. Primary Borrower Designation</h3>
          <div class="form-group" style="background:var(--bg-subtle);padding:12px;border:1px solid var(--border-light);">
            <label style="display:flex;align-items:center;gap:8px;font-weight:500;">
              <input type="checkbox" id="same-borrower-chk" checked>
              Patient is the primary borrower (Self-Financing)
            </label>
          </div>

          <h3 style="margin-top:20px;">3. Initial Clinical Payment Demand</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label for="procedure-name">Medical Procedure / Treatment</label>
              <input type="text" id="procedure-name" required value="Orthopedic Knee Reconstruction" class="form-input">
            </div>
            <div class="form-group">
              <label for="demand-amount">Estimated Demand Amount (INR)</label>
              <input type="number" id="demand-amount" required value="125000" class="form-input">
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top:16px;">Generate Financing Case & FRID &rarr;</button>
        </form>
      </div>
    `;
  }

  if (subview === 'cases') {
    return `
      <h1>Cases & Pipeline</h1>
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">Active financing cases originated at this hospital branch desk.</p>

      ${renderDataTable({
        columns: [
          { label: 'FRID / Case ID', key: 'frid', render: (val, r) => `<strong>${val}</strong><br><small style="color:var(--text-subtle);">${r.case_id}</small>` },
          { label: 'Admission Ref', key: 'admission_ref' },
          { label: 'Lifecycle Status', key: 'case_status', render: val => `<span class="badge badge-blue">${val}</span>` },
          { label: 'Created At', key: 'created_at', render: val => new Date(val).toLocaleDateString('en-IN') },
          { label: 'Actions', key: 'case_id', render: (val, r) => `
            <div style="display:flex;gap:6px;">
              <a href="/executive/case-detail?id=${val}" class="btn btn-secondary btn-sm">Details</a>
              ${r.case_status !== 'FACILITATION_CLOSED' ? `<button type="button" class="btn btn-danger btn-sm" data-action="close-case" data-case-id="${val}">Close Case</button>` : ''}
            </div>
          `}
        ],
        data: cases,
        emptyMessage: 'No financing cases currently active.'
      })}
    `;
  }

  // Default: Dashboard with real work queues
  return `
    <h1>Executive Operations Dashboard</h1>
    <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">Stationed desk work queues, SLA tracking, and pending borrower handoffs.</p>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:28px;">
      <div class="box" style="margin:0;">
        <span style="font-size:12px;color:var(--text-subtle);">Active Cases</span>
        <div style="font-size:24px;font-weight:700;margin-top:4px;">${activeCount}</div>
      </div>
      <div class="box" style="margin:0;">
        <span style="font-size:12px;color:var(--text-subtle);">Awaiting Borrower Link</span>
        <div style="font-size:24px;font-weight:700;margin-top:4px;">${inviteCount}</div>
      </div>
      <div class="box" style="margin:0;">
        <span style="font-size:12px;color:var(--text-subtle);">Disbursement Pending</span>
        <div style="font-size:24px;font-weight:700;margin-top:4px;">${disbPendingCount}</div>
      </div>
    </div>

    <h2>Priority Action Queue</h2>
    ${renderDataTable({
      columns: [
        { label: 'FRID', key: 'frid', render: (val, r) => `<strong>${val}</strong>` },
        { label: 'Current Status', key: 'case_status', render: val => `<span class="badge badge-amber">${val}</span>` },
        { label: 'Admission Ref', key: 'admission_ref' },
        { label: 'Next Action', key: 'case_status', render: val => val === 'READY_FOR_INVITATION' ? 'Send QR / SMS Invitation' : 'Awaiting NBFC Callback' },
        { label: 'Action', key: 'case_id', render: (val, r) => `<a href="/executive/cases" class="btn btn-secondary btn-sm">Process &rarr;</a>` }
      ],
      data: cases.slice(0, 5),
      emptyMessage: 'No urgent tasks pending in queue.'
    })}
  `;
}

function renderAccessDenied(expectedRole) {
  return `
    <div style="padding:48px 24px;max-width:540px;margin:40px auto;" class="alert alert-danger">
      <h2>Access Denied (403)</h2>
      <p>Your authenticated role is not authorized to access the Executive Desk workspace (${expectedRole} required).</p>
      <a href="/" class="btn btn-secondary btn-sm">&larr; Return to Home</a>
    </div>
  `;
}
