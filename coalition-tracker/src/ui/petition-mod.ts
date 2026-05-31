import type { PetitionSigner, User } from '../db/client';
import { getSharedHeader, getSharedHeaderCss, getSharedHeaderScript } from './shared-header';
import { DISTRICT_POLYGONS } from '../data/district-polygons';

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

function signerRows(signers: PetitionSigner[], showActions: boolean, prefix = 'r'): string {
  const colCount = showActions ? 7 : 6;
  return signers.map((s, idx) => {
    const detailItems = [
      `<span class="detail-item"><span class="detail-label">Email</span>${s.email}</span>`,
      `<span class="detail-item"><span class="detail-label">Zip</span>${s.zip_code || '—'}</span>`,
      s.anonymous ? `<span class="detail-item"><span class="badge badge-anon">Anon</span></span>` : '',
      s.comment ? `<span class="detail-item detail-comment"><span class="detail-label">Comment</span>${s.comment}</span>` : '',
    ].filter(Boolean).join('');
    const d = new Date(s.created_at.endsWith('Z') ? s.created_at : s.created_at + 'Z');
    const tzOpts = { timeZone: 'America/New_York' };
    const dateStr = d.toLocaleDateString('en-US', { ...tzOpts, month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { ...tzOpts, hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    return `
    <tr id="${prefix}-row-${s.id}" class="signer-row" data-row-idx="${idx}" onclick="toggleDetail('${prefix}',${s.id})" style="cursor:pointer">
      <td class="name-cell">${s.name} <span class="expand-chevron" id="${prefix}-chev-${s.id}">›</span>${s.comment ? ' <span class="comment-dot" title="Has comment">💬</span>' : ''}</td>
      <td class="business-cell">${s.business_name
        ? `<span class="business-name">${s.business_name}</span>${s.business_url ? ` <a href="${s.business_url}" target="_blank" rel="noopener" class="ext-link" onclick="event.stopPropagation()">↗</a>` : ''}`
        : '<span class="muted">—</span>'}</td>
      <td>${s.signer_type ? `<span class="type-tag">${s.signer_type.replace(/_/g, ' ')}</span>` : '<span class="muted">—</span>'}</td>
      <td class="muted-cell">${s.industry || '<span class="muted">—</span>'}</td>
      <td><span class="badge badge-${s.status}">${s.status}</span></td>
      <td class="date-cell">${dateStr}<br><span class="time-str">${timeStr}</span></td>
      ${showActions ? `<td class="actions-cell" onclick="event.stopPropagation()"><div class="btn-wrap">
        ${s.status !== 'approved' ? `<button class="action-btn btn-approve" onclick="updateStatus(${s.id}, 'approved')">Approve</button>` : ''}
        ${s.status !== 'rejected' ? `<button class="action-btn btn-reject" onclick="updateStatus(${s.id}, 'rejected')">Reject</button>` : ''}
      </div></td>` : ''}
    </tr>
    <tr id="${prefix}-detail-${s.id}" class="detail-row" data-row-idx="${idx}" style="display:none">
      <td colspan="${colCount}" class="detail-cell">${detailItems}</td>
    </tr>`;
  }).join('');
}

function signerCards(signers: PetitionSigner[], showActions: boolean): string {
  if (signers.length === 0) return '';
  return `<div class="signer-cards">` + signers.map(s => {
    const biz = s.business_name
      ? `<div class="card-biz">${s.business_name}${s.business_url ? ` <a href="${s.business_url}" target="_blank" rel="noopener" class="ext-link">↗</a>` : ''}</div>`
      : '';
    const comment = s.comment ? `<div class="card-comment">"${s.comment}"</div>` : '';
    const statusSelect = showActions ? `
      <select class="status-select status-select-${s.status}" onchange="changeStatus(${s.id}, this)" data-id="${s.id}" data-prev="${s.status}">
        <option value="pending"${s.status === 'pending' ? ' selected' : ''}>pending</option>
        <option value="approved"${s.status === 'approved' ? ' selected' : ''}>approved</option>
        <option value="rejected"${s.status === 'rejected' ? ' selected' : ''}>rejected</option>
      </select>` : `<span class="badge badge-${s.status}">${s.status}</span>`;
    return `
    <div class="signer-card card-${s.status}" id="card-${s.id}">
      <div class="card-top">
        <div><div class="card-name">${s.name}</div>${biz}</div>
        ${statusSelect}
      </div>
      <div class="card-meta">${s.email} &middot; ${s.zip_code || '—'}</div>
      ${(s.signer_type || s.industry) ? `<div class="card-tags">${s.signer_type ? `<span class="type-tag">${s.signer_type.replace(/_/g, ' ')}</span>` : ''}${s.industry ? `<span class="industry-tag">${s.industry}</span>` : ''}</div>` : ''}
      ${comment}
    </div>`;
  }).join('') + `</div>`;
}

export function getPetitionModHtml(
  user: Omit<User, 'password_hash'> | undefined,
  pending: PetitionSigner[],
  rejected: PetitionSigner[],
  all: PetitionSigner[],
  stats: Stats,
  activationCount: number = 0
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

    thead th.sortable { cursor: pointer; user-select: none; }
    thead th.sortable:hover { color: #fff; }
    thead th.sort-asc::after { content: ' ▲'; font-size: 0.6rem; }
    thead th.sort-desc::after { content: ' ▼'; font-size: 0.6rem; }

    tbody td {
      padding: 11px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: #f8fafc; }

    .name-cell { font-weight: 500; color: var(--navy); white-space: nowrap; }
    .muted-cell { color: var(--text-muted); font-size: 0.8rem; }
    .date-cell { color: #94a3b8; font-size: 0.8rem; white-space: nowrap; }
    .muted { color: #94a3b8; }
    .business-name { font-weight: 500; }
    .business-cell { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .signer-row:hover td { background: #f0f4ff; }
    .expand-chevron { color: #94a3b8; font-size: 1rem; margin-left: 4px; display: inline-block; transition: transform 0.2s; }
    .expand-chevron.open { transform: rotate(90deg); }
    .comment-dot { font-size: 0.85rem; vertical-align: middle; margin-left: 3px; }
    .time-str { font-size: 0.72rem; color: #b0bec5; }

    .pagination { display: flex; align-items: center; justify-content: flex-end; gap: 6px; padding: 12px 16px 4px; flex-wrap: wrap; }
    .pg-btn { border: 1px solid var(--border); background: var(--white); color: var(--navy); border-radius: 6px; padding: 5px 11px; font-size: 0.8rem; cursor: pointer; font-family: var(--font-body); transition: background 0.1s; }
    .pg-btn:hover { background: #f1f5f9; }
    .pg-btn.active { background: var(--navy); color: #fff; border-color: var(--navy); }
    .pg-btn:disabled { opacity: 0.35; cursor: default; }
    .pg-info { font-size: 0.78rem; color: var(--text-muted); margin-right: 6px; }

    .detail-row td { background: #f8fafc; border-bottom: 1px solid var(--border); }
    .detail-cell { padding: 10px 20px 14px 20px !important; }
    .detail-cell { display: table-cell; }
    .detail-item {
      display: inline-flex;
      align-items: baseline;
      gap: 5px;
      margin-right: 20px;
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .detail-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
    .detail-comment { display: block; margin-top: 6px; color: var(--navy); font-style: italic; }
    .ext-link { color: var(--text-muted); text-decoration: none; margin-left: 4px; }
    .ext-link:hover { color: var(--navy); }
    .comment-text { color: var(--text-muted); display: block; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

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

    .type-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 100px;
      font-size: 0.7rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
      text-transform: capitalize;
      white-space: nowrap;
    }
    .industry-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 100px;
      font-size: 0.7rem;
      font-weight: 500;
      background: #ede9fe;
      color: #7c3aed;
    }
    .card-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }

    .status-select {
      appearance: none;
      border: none;
      border-radius: 100px;
      padding: 3px 22px 3px 10px;
      font-size: 0.72rem;
      font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer;
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 10px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2364748b'/%3E%3C/svg%3E");
    }
    .status-select-pending { background-color: var(--warning-bg); color: var(--warning); }
    .status-select-approved { background-color: var(--success-bg); color: var(--success); }
    .status-select-rejected { background-color: var(--danger-bg); color: var(--danger); }

    .actions-cell { white-space: nowrap; }
    .actions-cell .btn-wrap { display: inline-flex; gap: 8px; }

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

    .signer-cards { display: none; }

    /* Mobile: horizontal scroll for medium screens */
    @media (max-width: 900px) {
      .container { padding: 16px; }
      .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .hstat-number { font-size: 1.3rem; }
    }

    /* Mobile: card layout for phones */
    @media (max-width: 640px) {
      /* Stats row takes full width below logo/menu row */
      .header-stats {
        order: 3;
        width: 100%;
        gap: 0;
        justify-content: space-around;
        border-top: 1px solid rgba(255,255,255,0.1);
        padding-top: 10px;
      }
      .hstat::after { display: none; }
      .hstat-number { font-size: 1.2rem; }
      .table-wrap table { display: none; }
      .table-wrap { border-radius: 10px; overflow: visible; box-shadow: none; background: transparent; }

      .signer-cards { display: flex; flex-direction: column; gap: 10px; }

      .signer-card {
        background: var(--white);
        border-radius: 10px;
        box-shadow: var(--shadow-md);
        padding: 14px 16px;
        border-left: 4px solid var(--border);
      }
      .signer-card.card-pending { border-left-color: var(--warning); }
      .signer-card.card-approved { border-left-color: var(--success); }
      .signer-card.card-rejected { border-left-color: var(--danger); }

      .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
      .card-name { font-weight: 600; color: var(--navy); font-size: 0.9rem; }
      .card-biz { color: var(--text-muted); font-size: 0.8rem; margin-top: 1px; }
      .card-meta { color: var(--text-muted); font-size: 0.78rem; margin-bottom: 6px; }
      .card-comment {
        background: var(--muted-bg);
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 0.82rem;
        color: var(--text);
        margin-bottom: 10px;
        font-style: italic;
      }
      .card-actions { display: flex; gap: 8px; }
      .card-actions .action-btn { flex: 1; padding: 8px; font-size: 0.82rem; text-align: center; }

      .header-stats { gap: 16px; }
      .hstat-number { font-size: 1.2rem; }
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

    /* Tab nav */
    .tab-nav {
      display: flex;
      width: fit-content;
      max-width: 100%;
      background: var(--muted-bg);
      border-radius: 10px;
      padding: 4px;
      gap: 2px;
      margin-bottom: 28px;
      overflow: hidden;
    }
    .tab-btn {
      flex: 1;
      padding: 8px 16px;
      font-size: 0.83rem;
      font-weight: 600;
      color: var(--text-muted);
      background: none;
      border: none;
      border-radius: 7px;
      cursor: pointer;
      font-family: var(--font-body);
      transition: background 0.15s, color 0.15s, box-shadow 0.15s;
      white-space: nowrap;
      text-align: center;
    }
    .tab-btn:hover { color: var(--navy); background: rgba(255,255,255,0.6); }
    .tab-btn.active { background: var(--white); color: var(--navy); box-shadow: 0 1px 4px rgba(15,23,42,0.10); }
    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 18px;
      border-radius: 100px;
      padding: 0 6px;
      font-size: 0.68rem;
      font-weight: 700;
      margin-left: 6px;
      line-height: 1;
    }
    .tab-badge-pending { background: #fef3c7; color: #d97706; }
    .tab-badge-rejected { background: #fee2e2; color: #dc2626; }
    .tab-badge-all { background: #e2e8f0; color: #475569; }
    .tab-panel { display: none; }
    .tab-panel.active { display: block; }

    @media (max-width: 640px) {
      .tab-nav { width: 100%; }
      .tab-btn { padding: 8px 8px; font-size: 0.74rem; }
      .tab-badge { display: none; }
    }

    /* Stats tab */
    .stat-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: var(--white); border-radius: 10px; padding: 20px; box-shadow: var(--shadow-md); text-align: center; }
    .stat-card-number { font-size: 2rem; font-weight: 800; color: var(--navy); line-height: 1; }
    .stat-card-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-top: 6px; font-weight: 600; }
    .stat-card.green .stat-card-number { color: var(--success); }
    .stat-card.gold .stat-card-number { color: var(--warning); }

    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .chart-card { background: var(--white); border-radius: 10px; padding: 20px; box-shadow: var(--shadow-md); }
    .chart-title { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 16px; }
    .chart-wrap { position: relative; height: 220px; }

    #map { height: 420px; border-radius: 10px; overflow: hidden; box-shadow: var(--shadow-md); margin-bottom: 32px; }

    .stats-loading { text-align: center; padding: 60px; color: var(--text-muted); font-size: 0.875rem; }

    @media (max-width: 640px) {
      .charts-grid { grid-template-columns: 1fr; }
      .tab-btn { padding: 8px 12px; font-size: 0.8rem; }
    }

    .email-from { white-space: nowrap; font-weight: 500; color: var(--navy); max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
    .email-preview { color: var(--text-muted); font-size: 0.8rem; max-width: 360px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .email-status-select { font-size: 0.78rem; padding: 3px 6px; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer; font-weight: 500; }
    .email-status-select.status-pending { background: #fef3c7; color: #d97706; border-color: #fde68a; }
    .email-status-select.status-assigned { background: #dbeafe; color: #2563eb; border-color: #93c5fd; }
    .email-status-select.status-sent { background: #dcfce7; color: #16a34a; border-color: #86efac; }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</head>
<body>
  ${getSharedHeader(user?.display_name || '', 'petition', statsHtml(stats))}

  <div class="container">
    <div class="tab-nav">
      <button class="tab-btn${pending.length > 0 ? ' active' : ''}" onclick="switchTab('pending', this)">Pending<span class="tab-badge tab-badge-pending">${pending.length}</span></button>
      ${rejected.length > 0 ? `<button class="tab-btn" onclick="switchTab('rejected', this)">Rejected<span class="tab-badge tab-badge-rejected">${rejected.length}</span></button>` : ''}
      <button class="tab-btn${pending.length === 0 ? ' active' : ''}" onclick="switchTab('all', this)">All Signatures<span class="tab-badge tab-badge-all">${all.length}</span></button>
      <button class="tab-btn" onclick="switchTab('stats', this)">Stats &amp; Map</button>
      <button class="tab-btn" onclick="switchTab('activation', this)">Activation${activationCount > 0 ? `<span class="tab-badge tab-badge-all">${activationCount}</span>` : ''}</button>
    </div>

    <div id="tab-pending" class="tab-panel${pending.length > 0 ? ' active' : ''}">
      <div class="section">
        ${pending.length === 0
          ? `<div class="table-wrap"><p class="empty-state">No pending signatures — all clear.</p></div>`
          : `<div class="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Business</th><th>Type</th><th>Industry</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
                <tbody>${signerRows(pending, true, 'p')}</tbody>
              </table>
              <div class="pagination" id="p-pagination"></div>
              ${signerCards(pending, true)}
            </div>`}
      </div>
    </div>

    <div id="tab-rejected" class="tab-panel">
      <div class="section">
        ${rejected.length === 0
          ? `<div class="table-wrap"><p class="empty-state">No rejected signatures.</p></div>`
          : `<div class="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Business</th><th>Type</th><th>Industry</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
                <tbody>${signerRows(rejected, true, 'rj')}</tbody>
              </table>
              <div class="pagination" id="rj-pagination"></div>
              ${signerCards(rejected, true)}
            </div>`}
      </div>
    </div>

    <div id="tab-all" class="tab-panel${pending.length === 0 ? ' active' : ''}">
      <div class="section">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Business</th><th>Type</th><th>Industry</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
            <tbody>${signerRows(all, true, 'a')}</tbody>
          </table>
          <div class="pagination" id="a-pagination"></div>
          ${signerCards(all, true)}
        </div>
      </div>
    </div>

    <div id="tab-stats" class="tab-panel">
      <div id="stats-content"><div class="stats-loading">Loading stats…</div></div>
    </div>

    <div id="tab-activation" class="tab-panel">
      <div id="activation-content"><div class="stats-loading">Loading emails…</div></div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    async function updateStatus(id, status) {
      try {
        const res = await fetch('/api/petition/' + id + '/' + status, { method: 'POST' });
        if (!res.ok) throw new Error('Failed');
        location.reload();
      } catch (e) {
        showToast('Error — try again', true);
      }
    }

    async function changeStatus(id, selectEl) {
      const newStatus = selectEl.value;
      const prevStatus = selectEl.dataset.prev || selectEl.querySelector('option[selected]')?.value;
      selectEl.dataset.prev = newStatus;

      // Optimistic UI update
      const card = document.getElementById('card-' + id);
      if (card) {
        card.className = 'signer-card card-' + newStatus;
      }
      selectEl.className = 'status-select status-select-' + newStatus;

      try {
        const res = await fetch('/api/petition/' + id + '/' + newStatus, { method: 'POST' });
        if (!res.ok) throw new Error('Failed');
        showToast('Saved', false);
      } catch (e) {
        // Revert on failure
        if (prevStatus) {
          selectEl.value = prevStatus;
          selectEl.className = 'status-select status-select-' + prevStatus;
          if (card) card.className = 'signer-card card-' + prevStatus;
        }
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

    // ---- Row expand/collapse ----
    const _openDetail = {};
    function toggleDetail(prefix, id) {
      const prevId = _openDetail[prefix];
      if (prevId && prevId !== id) {
        const prev = document.getElementById(prefix + '-detail-' + prevId);
        const prevChev = document.getElementById(prefix + '-chev-' + prevId);
        if (prev) prev.style.display = 'none';
        if (prevChev) prevChev.classList.remove('open');
      }
      const row = document.getElementById(prefix + '-detail-' + id);
      const chev = document.getElementById(prefix + '-chev-' + id);
      if (!row) return;
      const open = row.style.display === 'table-row';
      row.style.display = open ? 'none' : 'table-row';
      if (chev) chev.classList.toggle('open', !open);
      _openDetail[prefix] = open ? null : id;
    }

    // ---- Pagination ----
    const PAGE_SIZE = 25;
    const _page = {};
    function initPagination(prefix, total) {
      _page[prefix] = 0;
      showPage(prefix, 0, total);
    }
    function showPage(prefix, page, total) {
      _page[prefix] = page;
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      document.querySelectorAll('[id^="' + prefix + '-row-"]').forEach(function(tr) {
        var idx = parseInt(tr.dataset.rowIdx);
        tr.style.display = (idx >= start && idx < end) ? '' : 'none';
      });
      document.querySelectorAll('[id^="' + prefix + '-detail-"]').forEach(function(tr) {
        var idx = parseInt(tr.dataset.rowIdx);
        if (idx < start || idx >= end) tr.style.display = 'none';
      });
      renderPageControls(prefix, page, total);
    }
    function pgGo(btn) {
      var pg = parseInt(btn.dataset.pg);
      var pf = btn.dataset.pf;
      var tot = parseInt(btn.dataset.tot);
      showPage(pf, pg, tot);
    }
    function renderPageControls(prefix, page, total) {
      const pages = Math.ceil(total / PAGE_SIZE);
      const el = document.getElementById(prefix + '-pagination');
      if (!el || pages <= 1) return;
      const start = page * PAGE_SIZE + 1;
      const end = Math.min((page + 1) * PAGE_SIZE, total);
      function btn(pg, label, disabled, active) {
        return '<button class="pg-btn' + (active?' active':'') + '" data-pf="' + prefix + '" data-pg="' + pg + '" data-tot="' + total + '" onclick="pgGo(this)"' + (disabled?' disabled':'') + '>' + label + '</button>';
      }
      let html = '<span class="pg-info">' + start + '–' + end + ' of ' + total + '</span>';
      html += btn(page-1, '‹', page===0, false);
      const maxBtns = 7;
      let pStart = Math.max(0, page - 3), pEnd = Math.min(pages, pStart + maxBtns);
      pStart = Math.max(0, pEnd - maxBtns);
      for (let i = pStart; i < pEnd; i++) { html += btn(i, i+1, false, i===page); }
      html += btn(page+1, '›', page>=pages-1, false);
      el.innerHTML = html;
    }
    document.addEventListener('DOMContentLoaded', () => {
      initPagination('p', ${pending.length});
      initPagination('rj', ${rejected.length});
      initPagination('a', ${all.length});
    });

    // ---- Column sort ----
    const _sortState = {};
    function sortTable(th) {
      const thead = th.closest('thead');
      const tbody = thead.closest('table').querySelector('tbody');
      const colIdx = Array.from(thead.querySelectorAll('th')).indexOf(th);
      const tableId = tbody.closest('.table-wrap')?.id || tbody.id || Math.random();
      const prev = _sortState[tableId];
      const asc = prev && prev.col === colIdx ? !prev.asc : true;
      _sortState[tableId] = { col: colIdx, asc };

      // Update header indicators
      thead.querySelectorAll('th').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(asc ? 'sort-asc' : 'sort-desc');

      // Collect signer-row + its detail-row pairs
      const rows = Array.from(tbody.querySelectorAll('tr.signer-row'));
      const statusOrder = { pending: 0, approved: 1, rejected: 2 };
      rows.sort((a, b) => {
        const aCell = a.querySelectorAll('td')[colIdx];
        const bCell = b.querySelectorAll('td')[colIdx];
        const aVal = (aCell?.querySelector('.badge')?.textContent || aCell?.textContent || '').trim().toLowerCase();
        const bVal = (bCell?.querySelector('.badge')?.textContent || bCell?.textContent || '').trim().toLowerCase();
        const aOrd = statusOrder[aVal] ?? 99;
        const bOrd = statusOrder[bVal] ?? 99;
        const cmp = aOrd !== bOrd ? aOrd - bOrd : aVal.localeCompare(bVal);
        return asc ? cmp : -cmp;
      });

      // Re-insert rows in sorted order, keeping detail rows paired
      rows.forEach((row, idx) => {
        row.dataset.rowIdx = idx;
        const id = row.id.replace(/^[^-]+-row-/, '');
        const prefix = row.id.split('-row-')[0];
        const detail = tbody.querySelector('#' + prefix + '-detail-' + id);
        if (detail) detail.dataset.rowIdx = idx;
        tbody.appendChild(row);
        if (detail) tbody.appendChild(detail);
      });

      // Re-run pagination with new order
      const prefix2 = rows[0]?.id.split('-row-')[0];
      if (prefix2 && _page[prefix2] !== undefined) {
        showPage(prefix2, 0, rows.length);
      }
    }

    // ---- Tab navigation ----
    let statsLoaded = false;
    let activationLoaded = false;
    function switchTab(name, btn) {
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + name).classList.add('active');
      btn.classList.add('active');
      localStorage.setItem('petition-active-tab', name);
      if (name === 'stats' && !statsLoaded) loadStats();
      if (name === 'activation' && !activationLoaded) loadActivation();
    }

    // Restore last active tab on page load
    const savedTab = localStorage.getItem('petition-active-tab');
    if (savedTab) {
      const savedBtn = Array.from(document.querySelectorAll('.tab-btn')).find(
        b => b.getAttribute('onclick')?.includes("'" + savedTab + "'")
      );
      if (savedBtn && document.getElementById('tab-' + savedTab)) {
        switchTab(savedTab, savedBtn);
      }
    }

    // ---- Stats loader ----
    async function loadStats() {
      statsLoaded = true;
      const data = await fetch('/api/petition/admin-stats').then(r => r.json());
      const approvalRate = data.by_status.approved > 0
        ? Math.round(data.by_status.approved / data.total * 100)
        : 0;
      const anonRate = data.by_status.approved > 0
        ? Math.round(data.anonymous_count / data.by_status.approved * 100)
        : 0;

      document.getElementById('stats-content').innerHTML = \`
        <div class="stat-cards">
          <div class="stat-card green"><div class="stat-card-number">\${data.by_status.approved}</div><div class="stat-card-label">Approved</div></div>
          <div class="stat-card gold"><div class="stat-card-number">\${data.by_status.pending}</div><div class="stat-card-label">Pending</div></div>
          <div class="stat-card"><div class="stat-card-number">\${data.by_status.rejected}</div><div class="stat-card-label">Rejected</div></div>
          <div class="stat-card"><div class="stat-card-number">\${approvalRate}%</div><div class="stat-card-label">Approval Rate</div></div>
          <div class="stat-card"><div class="stat-card-number">\${anonRate}%</div><div class="stat-card-label">Anonymous</div></div>
        </div>
        <div class="charts-grid">
          <div class="chart-card"><div class="chart-title">Signer Type</div><div class="chart-wrap"><canvas id="chart-type"></canvas></div></div>
          <div class="chart-card"><div class="chart-title">Top Industries</div><div class="chart-wrap"><canvas id="chart-industry"></canvas></div></div>
          <div class="chart-card" style="grid-column:1/-1"><div class="chart-title">Signups — Last 60 Days</div><div class="chart-wrap" style="height:180px"><canvas id="chart-timeline"></canvas></div></div>
        </div>
        <div class="chart-title" style="margin-bottom:12px">Geographic Distribution (Approved Signers)</div>
        <div id="map"></div>
        <div style="margin-top:16px;border:1px solid #eee;border-radius:8px;overflow:hidden">
          <table style="width:100%;border-collapse:collapse;font-size:0.875rem">
            <thead><tr style="background:#f8fafc">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;border-bottom:1px solid #eee">DISTRICT</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;border-bottom:1px solid #eee">COUNCIL MEMBER</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#94a3b8;font-weight:600;border-bottom:1px solid #eee">SIGNERS</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#94a3b8;font-weight:600;border-bottom:1px solid #eee">% OF TOTAL</th>
            </tr></thead>
            <tbody id="district-table-body"></tbody>
          </table>
        </div>
        <div class="charts-grid" style="margin-top:24px">
          <div class="chart-card"><div class="chart-title">Top Zip Codes</div><div class="chart-wrap"><canvas id="chart-zip"></canvas></div></div>
        </div>
      \`;

      // Load Chart.js then render
      loadScript('https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js', () => {
        renderBarChart('chart-type', data.by_signer_type.map(d => d.type.replace(/_/g,' ')), data.by_signer_type.map(d => d.count), '#6366f1');
        renderBarChart('chart-industry', data.by_industry.map(d => d.industry), data.by_industry.map(d => d.count), '#0ea5e9', true);
        renderBarChart('chart-zip', data.by_zip.slice(0,15).map(d => d.zip), data.by_zip.slice(0,15).map(d => d.count), '#10b981', true);
        renderTimeline(data.by_day);
      });

      // Load Leaflet then render map
      loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', () => renderMap(data.by_zip));
    }

    // ---- Activation tab loader ----
    async function loadActivation() {
      activationLoaded = true;
      let emails = [];
      try {
        const res = await fetch('/api/inbound-email?limit=200');
        if (!res.ok) throw new Error('Failed to load');
        emails = await res.json();
      } catch (e) {
        document.getElementById('activation-content').innerHTML =
          '<div class="stats-loading">Error loading emails — try refreshing.</div>';
        return;
      }
      if (!emails.length) {
        document.getElementById('activation-content').innerHTML =
          '<div class="table-wrap"><p class="empty-state">No inbound emails yet.</p></div>';
        return;
      }
      const rows = emails.map(e => {
        const d = new Date(e.received_at.endsWith('Z') ? e.received_at : e.received_at + 'Z');
        const tzOpts = { timeZone: 'America/New_York' };
        const dateStr = d.toLocaleDateString('en-US', { ...tzOpts, month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { ...tzOpts, hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
        const bodyText = (e.text_body || '').split(/\\r?\\n--[\\s]*\\r?\\n/)[0];
        const preview = bodyText.replace(/\\s+/g, ' ').trim().slice(0, 120);
        const status = e.status || 'pending';
        const statusOpts = ['pending','assigned','sent'].map(s =>
          \`<option value="\${s}"\${s === status ? ' selected' : ''}>\${s}</option>\`
        ).join('');
        return \`<tr>
          <td class="actions-cell"><select class="email-status-select status-\${status}" onchange="updateEmailStatus(\${e.id}, this)">\${statusOpts}</select></td>
          <td class="name-cell email-from">\${escHtml(e.from_addr || '—')}</td>
          <td>\${escHtml(e.subject || '—')}</td>
          <td class="muted-cell email-preview">\${escHtml(preview)}\${preview.length === 120 ? '…' : ''}</td>
          <td class="date-cell">\${dateStr}<br><span class="time-str">\${timeStr}</span></td>
        </tr>\`;
      }).join('');
      document.getElementById('activation-content').innerHTML = \`
        <div class="table-wrap">
          <table>
            <thead><tr><th>Status</th><th>From</th><th>Subject</th><th>Preview</th><th>Received</th></tr></thead>
            <tbody>\${rows}</tbody>
          </table>
        </div>\`;
    }

    async function updateEmailStatus(id, sel) {
      const status = sel.value;
      sel.className = 'email-status-select status-' + status;
      try {
        const res = await fetch('/api/inbound-email/' + id + '/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error();
      } catch {
        alert('Failed to update status');
      }
    }

    function escHtml(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function loadScript(src, cb) {
      if (document.querySelector('script[src="' + src + '"]')) { cb(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = cb;
      document.head.appendChild(s);
    }

    function renderBarChart(id, labels, values, color, horizontal = false) {
      const ctx = document.getElementById(id);
      if (!ctx) return;
      new Chart(ctx, {
        type: horizontal ? 'bar' : 'bar',
        data: { labels, datasets: [{ data: values, backgroundColor: color + '99', borderColor: color, borderWidth: 1, borderRadius: 4 }] },
        options: {
          indexAxis: horizontal ? 'y' : 'x',
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: !horizontal } }, y: { grid: { display: horizontal }, ticks: { font: { size: 11 } } } }
        }
      });
    }

    function renderTimeline(byDay) {
      if (!byDay.length) return;
      const ctx = document.getElementById('chart-timeline');
      if (!ctx) return;
      new Chart(ctx, {
        type: 'line',
        data: { labels: byDay.map(d => d.date), datasets: [{ data: byDay.map(d => d.count), borderColor: '#0f172a', backgroundColor: '#0f172a22', fill: true, tension: 0.3, pointRadius: 3 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { ticks: { maxTicksLimit: 10, font: { size: 10 } } }, y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }

    // PA zip code centroid lookup (Philadelphia + suburbs)
    const ZIP_CENTROIDS = {
      '19102':[39.9521,-75.1670],'19103':[39.9523,-75.1770],'19104':[39.9545,-75.1998],
      '19106':[39.9471,-75.1437],'19107':[39.9484,-75.1582],'19111':[40.0590,-75.0726],
      '19114':[40.0731,-75.0134],'19115':[40.0932,-75.0434],'19116':[40.1153,-75.0174],
      '19118':[40.0680,-75.2099],'19119':[40.0559,-75.1899],'19120':[40.0369,-75.1152],
      '19121':[39.9767,-75.1773],'19122':[39.9741,-75.1457],'19123':[39.9617,-75.1396],
      '19124':[40.0158,-75.0896],'19125':[39.9763,-75.1254],'19126':[40.0582,-75.1400],
      '19127':[40.0177,-75.2248],'19128':[40.0416,-75.2154],'19129':[40.0125,-75.1897],
      '19130':[39.9674,-75.1713],'19131':[39.9817,-75.2171],'19132':[39.9999,-75.1737],
      '19133':[39.9971,-75.1421],'19134':[39.9982,-75.1108],'19135':[40.0248,-75.0584],
      '19136':[40.0451,-75.0387],'19137':[39.9970,-75.0708],'19138':[40.0590,-75.1610],
      '19139':[39.9647,-75.2219],'19140':[40.0194,-75.1569],'19141':[40.0357,-75.1580],
      '19142':[39.9248,-75.2307],'19143':[39.9396,-75.2127],'19144':[40.0332,-75.1852],
      '19145':[39.9222,-75.1868],'19146':[39.9360,-75.1825],'19147':[39.9306,-75.1584],
      '19148':[39.9131,-75.1588],'19149':[40.0351,-75.0641],'19150':[40.0701,-75.1777],
      '19151':[39.9850,-75.2363],'19152':[40.0555,-75.0428],'19153':[39.8948,-75.2372],
      '19154':[40.1032,-75.0012],'19019':[40.0820,-75.1200],'19029':[39.8715,-75.2755],
      '19036':[39.8965,-75.2668],'19050':[39.9286,-75.2688],'19063':[39.8951,-75.3699],
      '19082':[39.9548,-75.2618],'19083':[39.9823,-75.3012],'19094':[39.8978,-75.2471],
    };

    // Zip → council district mapping (Philadelphia, post-2021 redistricting)
    const ZIP_TO_DISTRICT = {
      '19102':1,'19106':1,'19107':1,'19123':1,'19147':1,'19148':1,
      '19112':2,'19142':2,'19143':2,'19145':2,'19146':2,'19153':2,
      '19104':3,'19139':3,
      '19127':4,'19128':4,'19129':4,'19131':4,'19151':4,
      '19103':5,'19121':5,'19122':5,'19132':5,
      '19134':6,'19135':6,'19136':6,'19137':6,
      '19124':7,'19125':7,'19133':7,'19140':7,
      '19118':8,'19119':8,'19126':8,'19130':8,'19138':8,'19141':8,'19144':8,
      '19120':9,'19150':9,
      '19111':10,'19114':10,'19115':10,'19116':10,'19149':10,'19152':10,'19154':10,
    };

    const DISTRICT_MEMBERS = {
      1:'Mark Squilla',2:'Kenyatta Johnson',3:'Jamie Gauthier',4:'Curtis Jones Jr.',
      5:'Jeffery Young Jr.',6:'Michael Driscoll',7:'Quetcy Lozada',
      8:'Cindy Bass',9:'Anthony Phillips',10:"Brian O'Neill",
    };

    function renderMap(byZip) {
      const map = L.map('map').setView([39.9976, -75.1345], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 18
      }).addTo(map);

      // Build district → signer count
      const districtCounts = {};
      byZip.forEach(({ zip, count }) => {
        const d = ZIP_TO_DISTRICT[zip];
        if (d) districtCounts[d] = (districtCounts[d] || 0) + count;
      });
      const maxDistCount = Math.max(...Object.values(districtCounts), 1);

      // District polygon overlays from pre-simplified TypeScript data
      const districtPolygons = ${JSON.stringify(DISTRICT_POLYGONS)};
      Object.entries(districtPolygons).forEach(([d, rings]) => {
        d = parseInt(d);
        const count = districtCounts[d] || 0;
        const intensity = count / maxDistCount;
        const fillOpacity = count > 0 ? 0.12 + intensity * 0.35 : 0.03;
        const poly = L.polygon(rings, {
          color: '#0f172a', weight: 1.5, opacity: 0.6,
          fillColor: '#0f172a', fillOpacity,
        });
        poly.bindTooltip(
          \`<strong>District \${d}</strong>\${DISTRICT_MEMBERS[d] ? '<br>' + DISTRICT_MEMBERS[d] : ''}<br>\${count} signer\${count !== 1 ? 's' : ''}\`,
          { sticky: true }
        );
        poly.addTo(map);
      });

      // Council district breakdown table
      const districtRows = Object.entries(DISTRICT_MEMBERS)
        .map(([d, member]) => ({ d: parseInt(d), member, count: districtCounts[d] || 0 }))
        .sort((a, b) => b.count - a.count);
      const districtTotal = districtRows.reduce((sum, r) => sum + r.count, 0);
      const tableHtml = districtRows.map(({ d, member, count }) => {
        const pct = districtTotal > 0 ? ((count / districtTotal) * 100).toFixed(1) : '0.0';
        return \`<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:500">District \${d}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#64748b">\${member}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">\${count}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">\${pct}%</td></tr>\`;
      }).join('');
      document.getElementById('district-table-body').innerHTML = tableHtml;

      // Circle markers for zip-level detail
      const maxCount = Math.max(...byZip.map(d => d.count), 1);
      byZip.forEach(({ zip, count }) => {
        const coords = ZIP_CENTROIDS[zip];
        if (!coords) return;
        const r = 6 + Math.round((count / maxCount) * 16);
        L.circleMarker(coords, {
          radius: r, fillColor: '#0f172a', color: '#fbbf24',
          weight: 2, fillOpacity: 0.8
        }).addTo(map).bindPopup(\`<strong>\${zip}</strong><br>\${count} signer\${count !== 1 ? 's' : ''}\`);
      });
    }

    ${getSharedHeaderScript()}
  </script>
</body>
</html>`;
}
