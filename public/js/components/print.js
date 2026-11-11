/**
 * Printable Document Generator
 * Meets Section 7 & 8: Clean printable slips with verification code, parties, amounts, and no decoration.
 */

export function renderPrintableReceipt({ title, receiptNumber, timestamp, parties, items, totalAmount, verificationNotice }) {
  return `
    <div class="print-document" style="background:#ffffff;padding:24px;border:1px solid #000000;max-width:720px;margin:20px auto;color:#000000;font-family:monospace;">
      <div style="text-align:center;border-bottom:2px solid #000000;padding-bottom:12px;margin-bottom:16px;">
        <h2 style="margin:0 0 4px 0;font-size:18px;">AIDVANS HEALTHCARE FINANCING LSP</h2>
        <p style="margin:0;font-size:12px;">Operating under RBI Digital Lending Guidelines &bull; Zero Borrower Fees</p>
        <h3 style="margin:8px 0 0 0;font-size:15px;text-transform:uppercase;">${title}</h3>
      </div>

      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:16px;">
        <div>
          <strong>Document Ref:</strong> ${receiptNumber}<br>
          <strong>Generated At:</strong> ${timestamp} IST
        </div>
        <div style="text-align:right;">
          <strong>Ecosystem Status:</strong> AUTHENTICATED SERVER RECORD<br>
          <strong>Money Event:</strong> DIRECT HOSPITAL DISBURSEMENT
        </div>
      </div>

      <div style="border-top:1px dashed #000000;border-bottom:1px dashed #000000;padding:12px 0;margin-bottom:16px;font-size:12px;">
        <h4 style="margin:0 0 8px 0;font-size:13px;">PARTIES & ACCREDITATION</h4>
        ${Object.entries(parties).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join('')}
      </div>

      <div style="margin-bottom:16px;">
        <h4 style="margin:0 0 8px 0;font-size:13px;">FINANCIAL PARTICULARS</h4>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          ${items.map(item => `
            <tr>
              <td style="padding:4px 0;border-bottom:1px dotted #ccc;">${item.description}</td>
              <td style="padding:4px 0;text-align:right;border-bottom:1px dotted #ccc;font-weight:700;">${item.amount}</td>
            </tr>
          `).join('')}
          <tr>
            <td style="padding:8px 0;font-weight:700;">TOTAL TRANSACTION VALUE</td>
            <td style="padding:8px 0;text-align:right;font-weight:700;font-size:14px;">${totalAmount}</td>
          </tr>
        </table>
      </div>

      <div style="border-top:1px dashed #000000;padding-top:12px;font-size:11px;">
        <p style="margin:0 0 4px 0;"><strong>STATUTORY VERIFICATION NOTICE:</strong></p>
        <p style="margin:0;">${verificationNotice || 'This document is an immutable server-generated record of the Aidvans Lending Service Platform. Funds disbursed directly by regulated lender to verified hospital account.'}</p>
      </div>

      <div class="no-print" style="margin-top:20px;text-align:center;">
        <button type="button" class="btn btn-primary btn-sm" onclick="window.print()">Print Document / Save as PDF</button>
      </div>
    </div>
  `;
}
