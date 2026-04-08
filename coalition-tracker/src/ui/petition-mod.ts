import type { PetitionSigner, User } from '../db/client';
import { getSharedHeader, getSharedHeaderCss, getSharedHeaderScript } from './shared-header';

type Stats = { total: number; pending: number; approved: number; rejected: number };

function statsHtml(stats: Stats): string {
  return `
    <div class="header-stats">
      <div class="hstat">
        <div class="hstat-number">${stats.total}</div>
        <div class="hstat-label">Total</div>
      </div>
      <div class="hstat hstat-pending">
        <div class="hstat-number">${stats.pending}</div>
        <div class="hstat-label">Pending</div>
      </div>
      <div class="hstat hstat-approved">
        <div class="hstat-number">${stats.approved}</div>
        <div class="hstat-label">Approved</div>
      </div>
      <div class="hstat">
        <div class="hstat-number">${stats.rejected}</div>
        <div class="hstat-label">Rejected</div>
      </div>
    </div>`;
}

function signerRows(signers: PetitionSigner[], showActions: boolean): string {
  return signers.map(s => `
    <tr id="row-${s.id}">
      <td class="name-cell">${s.name}</td>
      <td>${s.business_name
        ? `<span class="business-name">${s.business_name}</span>${s.business_url ? ` <a href="${s.business_url}" target="_blank" rel="noopener" class="ext-link">↗</a>` : ''}`
        : '<span class="muted">—</span>'}</td>
      <td class="muted-cell">${s.email}</td>
      <td class="muted-cell">${s.zip_code || '<span class="muted">—</span>'}</td>
      <td>${s.comment
        ? `<span class="comment-text" title="${s.comment.replace(/"/g, '&quot;')}">${s.comment.length > 40 ? s.comment.slice(0, 40) + '…' : s.comment}</span>`
        : '<span class="muted">—</span>'}</td>
      <td>${s.anonymous ? '<span class="badge badge-anon">Anon</span>' : '<span class="muted">—</span>'}</td>
      <td><span class="badge badge-${s.status}">${s.status}</span></td>
      <td class="date-cell">${new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      ${showActions ? `<td class="actions-cell">
        ${s.status !== 'approved' ? `<button class="action-btn btn-approve" onclick="updateStatus(${s.id}, 'approved')">Approve</button>` : ''}
        ${s.status !== 'rejected' ? `<button class="action-btn btn-reject" onclick="updateStatus(${s.id}, 'rejected')">Reject</button>` : ''}
      </td>` : '<td></td>'}
    </tr>
  `).join('');
}

export function getPetitionModHtml(
  user: Omit<User, 'password_hash'> | undefined,
  pending: PetitionSigner[],
  all: PetitionSigner[],
  stats: Stats
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Petition Mod — LIFT Philly</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #0f172a;
      --navy-light: #1e293b;
      --gold: #fbbf24;
      --gold-light: #fef3c7;
      --text: #1e293b;
      --text-muted: #64748b;
      --white: #ffffff;
      --bg: #f8fafc;
      --border: #e2e8f0;
      --success: #059669;
      --success-bg: #d1fae5;
      --warning: #d97706;
      --warning-bg: #fef3c7;
      --danger: #dc2626;
      --danger-bg: #fee2e2;
      --muted-bg: #f1f5f9;
      --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
      --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--font-body);
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    ${getSharedHeaderCss()}

    /* Stats in header */
    .header-stats {
      display: flex;
      gap: 28px;
    }

    .hstat {
      text-align: center;
      position: relative;
    }

    .hstat::after {
      content: '';
      position: absolute;
      right: -14px;
      top: 50%;
      transform: translateY(-50%);
      width: 1px;
      height: 28px;
      background: rgba(255,255,255,0.15);
    }

    .hstat:last-child::after { display: none; }

    .hstat-number {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--gold);
      line-height: 1;
    }

    .hstat-pending .hstat-number { color: #fbbf24; }
    .hstat-approved .hstat-number { color: #34d399; }

    .hstat-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255,255,255,0.6);
      margin-top: 4px;
    }

    /* Layout */
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    /* Section headers */
    .section {
      margin-bottom: 36px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }

    .section-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--navy);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--warning-bg);
      color: var(--warning);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 100px;
    }

    .count-badge.all {
      background: var(--muted-bg);
      color: var(--text-muted);
    }

    /* Table */
    .table-wrap {
      background: var(--white);
      border-radius: 12px;
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    thead th {
      background: var(--navy);
      color: rgba(255,255,255,0.75);
      padding: 11px 14px;
      text-align: left;
      font-weight: 600;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    tbody td {
      padding: 11px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: #f8fafc; }

    .name-cell { font-weight: 500; color: var(--navy); }
    .muted-cell { color: var(--text-muted); font-size: 0.8rem; }
    .date-cell { color: #94a3b8; font-size: 0.8rem; white-space: nowrap; }
    .muted { color: #94a3b8; }
    .business-name { font-weight: 500; }
    .ext-link { color: var(--text-muted); text-decoration: none; margin-left: 4px; }
    .ext-link:hover { color: var(--navy); }
    .comment-text { color: var(--text-muted); }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 100px;
      font-size: 0.72rem;
      font-weight: 600;
    }

    .badge-pending { background: var(--warning-bg); color: var(--warning); }
    .badge-approved { background: var(--success-bg); color: var(--success); }
    .badge-rejected { background: var(--danger-bg); color: var(--danger); }
    .badge-anon { background: #e0e7ff; color: #4f46e5; }

    .actions-cell { display: flex; gap: 8px; }

    .action-btn {
      border: none;
      border-radius: 6px;
      padding: 5px 12px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      transition: background 0.1s;
    }

    .btn-approve { background: var(--success-bg); color: var(--success); }
    .btn-approve:hover { background: #a7f3d0; }
    .btn-reject { background: var(--danger-bg); color: var(--danger); }
    .btn-reject:hover { background: #fecaca; }

    .empty-state {
      padding: 40px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--navy);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      opacity: 0;
      transition: opacity 0.25s;
      pointer-events: none;
      z-index: 999;
    }

    .toast.show { opacity: 1; }
  </style>
</head>
<body>
  ${getSharedHeader(user?.display_name || '', 'petition', statsHtml(stats))}

  <div class="container">
    <div class="section">
      <div class="section-header">
        <span class="section-title">Pending Review</span>
        <span class="count-badge">${pending.length}</span>
      </div>
      ${pending.length === 0
        ? `<div class="table-wrap"><p class="empty-state">No pending signatures — all clear.</p></div>`
        : `<div class="table-wrap"><table>
            <thead><tr><th>Name</th><th>Business</th><th>Email</th><th>Zip</th><th>Comment</th><th>Anon</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
            <tbody>${signerRows(pending, true)}</tbody>
          </table></div>`}
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">All Signatures</span>
        <span class="count-badge all">${all.length}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Business</th><th>Email</th><th>Zip</th><th>Comment</th><th>Anon</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
          <tbody>${signerRows(all, true)}</tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    async function updateStatus(id, status) {
      const btn = event.target;
      btn.disabled = true;
      btn.textContent = '…';
      try {
        const res = await fetch('/api/petition/' + id + '/' + status, { method: 'POST' });
        if (!res.ok) throw new Error('Failed');
        location.reload();
      } catch (e) {
        btn.disabled = false;
        btn.textContent = status === 'approved' ? 'Approve' : 'Reject';
        showToast('Error — try again', true);
      }
    }

    function showToast(msg, isError) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.style.background = isError ? '#dc2626' : '#0f172a';
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2500);
    }

    ${getSharedHeaderScript()}
  </script>
</body>
</html>`;
}
