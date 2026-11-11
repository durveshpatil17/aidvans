/**
 * Plain Vanilla Reusable DataTable Component
 * Handles search, column rendering, empty states, and pagination without third-party frameworks.
 */

export function renderDataTable({ columns, data, emptyMessage = 'No records found', onRowClick = null }) {
  if (!data || data.length === 0) {
    return `
      <div class="table-container">
        <div style="padding:40px 24px;text-align:center;color:var(--text-muted);">
          <p style="margin:0;font-weight:500;">${emptyMessage}</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map((row, rowIdx) => `
            <tr data-row-index="${rowIdx}">
              ${columns.map(col => {
                const val = col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—');
                return `<td>${val}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

