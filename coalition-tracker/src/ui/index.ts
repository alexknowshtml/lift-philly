import { User } from '../db/client';

export function getIndexHtml(user?: Omit<User, 'password_hash'>): string {
  const userJson = user ? JSON.stringify(user) : 'null';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LIFT Philly Coalition Tracker</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #0f172a;
      --navy-light: #1e293b;
      --navy-muted: #334155;
      --gold: #fbbf24;
      --gold-dark: #f59e0b;
      --gold-light: #fef3c7;
      --text: #1e293b;
      --text-muted: #64748b;
      --white: #ffffff;
      --bg: #f8fafc;
      --bg-warm: #fafaf9;
      --border: #e2e8f0;
      --border-strong: #cbd5e1;
      --success: #059669;
      --success-bg: #d1fae5;
      --warning: #d97706;
      --warning-bg: #fef3c7;
      --info: #2563eb;
      --info-bg: #dbeafe;
      --muted-bg: #f1f5f9;

      --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

      --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
      --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
      --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
      --shadow-lg: 0 8px 24px rgba(15, 23, 42, 0.12);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--font-body);
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    /* Header */
    .header {
      background: var(--navy);
      color: var(--white);
      padding: 0;
    }

    .header-inner {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .logo h1 {
      font-family: var(--font-body);
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .logo h1 span {
      color: var(--gold);
    }

    .logo-tag {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255,255,255,0.5);
      font-weight: 500;
    }

    .stats {
      display: flex;
      gap: 32px;
    }

    .stat {
      text-align: center;
      position: relative;
    }

    .stat::after {
      content: '';
      position: absolute;
      right: -16px;
      top: 50%;
      transform: translateY(-50%);
      width: 1px;
      height: 32px;
      background: rgba(255,255,255,0.15);
    }

    .stat:last-child::after { display: none; }

    .stat-number {
      font-family: var(--font-body);
      font-size: 2rem;
      font-weight: 800;
      color: var(--gold);
      line-height: 1;
    }

    .stat-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255,255,255,0.6);
      margin-top: 4px;
    }

    .user-info {
      display: flex;
      align-items: center;
      padding-left: 24px;
      border-left: 1px solid rgba(255,255,255,0.15);
      margin-left: 8px;
    }

    .user-menu {
      position: relative;
    }

    .user-menu-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      color: var(--white);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .user-menu-btn:hover {
      background: rgba(255,255,255,0.2);
    }

    .user-menu-btn svg {
      width: 12px;
      height: 12px;
      transition: transform 0.15s;
    }

    .user-menu.open .user-menu-btn svg {
      transform: rotate(180deg);
    }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--white);
      border-radius: 8px;
      box-shadow: var(--shadow-lg);
      min-width: 160px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: all 0.15s;
      z-index: 100;
      overflow: hidden;
    }

    .user-menu.open .user-dropdown {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .user-dropdown a,
    .user-dropdown button {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px 16px;
      background: none;
      border: none;
      color: var(--text);
      font-size: 0.875rem;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.1s;
      text-align: left;
    }

    .user-dropdown a:hover,
    .user-dropdown button:hover {
      background: var(--bg);
    }

    .user-dropdown svg {
      width: 16px;
      height: 16px;
      color: var(--text-muted);
    }

    .user-dropdown .divider {
      height: 1px;
      background: var(--border);
      margin: 4px 0;
    }

    /* Container */
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-group {
      display: flex;
      gap: 4px;
      background: var(--white);
      padding: 4px;
      border-radius: 10px;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border);
    }

    .filter-btn {
      padding: 8px 14px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-muted);
      transition: all 0.2s var(--ease-out);
      font-family: var(--font-body);
    }

    .filter-btn:hover {
      color: var(--text);
      background: var(--bg);
    }

    .filter-btn.active {
      background: var(--navy);
      color: var(--white);
      box-shadow: var(--shadow-sm);
    }

    .search-wrapper {
      position: relative;
      flex: 1;
      max-width: 280px;
    }

    .search-input {
      width: 100%;
      padding: 10px 12px 10px 36px;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 0.875rem;
      font-family: var(--font-body);
      background: var(--white) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E") no-repeat 12px center;
      transition: all 0.2s var(--ease-out);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--gold);
      box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.15);
    }

    .search-input::placeholder {
      color: var(--text-muted);
    }

    .add-btn {
      padding: 10px 20px;
      background: var(--gold);
      color: var(--navy);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      font-family: var(--font-body);
      margin-left: auto;
      transition: all 0.2s var(--ease-out);
      box-shadow: var(--shadow-sm);
    }

    .add-btn:hover {
      background: var(--gold-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    /* Table - Desktop */
    .table-wrapper {
      background: var(--white);
      border-radius: 16px;
      box-shadow: var(--shadow-md);
      overflow-x: auto;
      border: 1px solid var(--border);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      min-width: 900px;
    }

    th, td {
      padding: 12px 10px;
      text-align: left;
    }

    th {
      background: var(--bg);
      font-weight: 600;
      color: var(--navy-muted);
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.06em;
      border-bottom: 1px solid var(--border);
    }

    td {
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
      white-space: nowrap;
    }

    tr:last-child td { border-bottom: none; }
    tr.has-edit-panel td { border-bottom: none; }

    tr.clickable-row {
      cursor: pointer;
    }

    tr:hover:not(.edit-panel-row) td {
      background: var(--bg-warm);
    }

    tr.editing td,
    tr.edit-panel-row td {
      background: var(--bg);
    }

    tr.edit-panel-row:hover td {
      background: var(--bg);
    }

    /* Status Dropdown */
    .status-select {
      padding: 6px 28px 6px 10px;
      border-radius: 6px;
      border: none;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      transition: all 0.15s var(--ease-out);
    }

    .status-select:focus {
      outline: 2px solid var(--gold);
      outline-offset: 1px;
    }

    .status-active {
      background-color: var(--success-bg);
      color: var(--success);
    }

    .status-prospect {
      background-color: var(--warning-bg);
      color: var(--warning);
    }

    .status-contacted {
      background-color: var(--info-bg);
      color: var(--info);
    }

    .status-inactive {
      background-color: var(--muted-bg);
      color: var(--text-muted);
    }

    /* Organization Name */
    .org-name {
      color: var(--text-muted);
    }

    /* Contact Name */
    .contact-name {
      color: var(--navy);
    }

    /* Type Badge */
    .type-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 500;
      background: var(--muted-bg);
      color: var(--text-muted);
      text-transform: capitalize;
    }

    /* Email */
    .email-link {
      color: var(--navy);
      text-decoration: none;
      font-size: 0.8rem;
    }

    .email-link:hover {
      color: var(--gold-dark);
      text-decoration: underline;
    }

    /* Connected Via */
    .connected-via {
      font-size: 0.8rem;
      color: var(--text-muted);
      display: block;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Searchable Combobox */
    .combobox {
      position: relative;
    }

    .combobox-input {
      width: 100%;
      padding: 10px 36px 10px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.9rem;
      background: var(--white);
      cursor: text;
    }

    .combobox-input:focus {
      outline: none;
      border-color: var(--navy);
      box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
    }

    .combobox-clear {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      border: none;
      background: none;
      color: var(--text-muted);
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .combobox-clear:hover {
      background: var(--bg);
      color: var(--text);
    }

    .combobox.has-value .combobox-clear {
      display: flex;
    }

    .combobox-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: var(--shadow-lg);
      max-height: 200px;
      overflow-y: auto;
      z-index: 100;
      display: none;
    }

    .combobox.open .combobox-dropdown {
      display: block;
    }

    .combobox-option {
      padding: 10px 12px;
      cursor: pointer;
      font-size: 0.9rem;
      border-bottom: 1px solid var(--border);
    }

    .combobox-option:last-child {
      border-bottom: none;
    }

    .combobox-option:hover,
    .combobox-option.highlighted {
      background: var(--bg);
    }

    .combobox-option.selected {
      background: rgba(15, 23, 42, 0.05);
      font-weight: 500;
    }

    .combobox-option-name {
      color: var(--text);
    }

    .combobox-option-org {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .combobox-empty {
      padding: 12px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .combobox-add-new {
      padding: 10px 12px;
      cursor: pointer;
      font-size: 0.9rem;
      border-top: 1px solid var(--border);
      color: var(--navy);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .combobox-add-new:hover,
    .combobox-add-new.highlighted {
      background: var(--bg);
    }

    .combobox-add-new svg {
      width: 16px;
      height: 16px;
    }

    /* Notes */
    .notes-cell {
      max-width: 150px;
      font-size: 0.8rem;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Actions */
    .actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .action-btn {
      padding: 6px 10px;
      border: none;
      background: var(--muted-bg);
      cursor: pointer;
      color: var(--text-muted);
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
      font-family: var(--font-body);
      transition: all 0.15s var(--ease-out);
    }

    .action-btn:hover {
      background: var(--border);
      color: var(--text);
    }

    .action-btn.delete:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Inline Edit Panel */
    .edit-panel-row td {
      padding: 0;
      background: var(--bg);
    }

    .edit-panel {
      padding: 16px 20px;
      animation: slideDown 0.2s var(--ease-out);
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
    }

    .edit-panel-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .edit-panel .form-group {
      margin: 0;
    }

    .edit-panel .form-group.span-2 {
      grid-column: span 2;
    }

    .edit-panel label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
      font-size: 0.7rem;
      color: var(--navy-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .edit-panel input,
    .edit-panel select,
    .edit-panel textarea {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: var(--font-body);
      background: var(--white);
      transition: all 0.15s var(--ease-out);
    }

    .edit-panel select {
      appearance: none;
      padding-right: 32px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231e293b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      cursor: pointer;
    }

    .edit-panel input:focus,
    .edit-panel select:focus,
    .edit-panel textarea:focus {
      outline: none;
      border-color: var(--gold);
      box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.2);
    }

    .edit-panel textarea {
      resize: vertical;
      min-height: 60px;
    }

    .edit-panel-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(251, 191, 36, 0.3);
    }

    .edit-panel .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8rem;
      font-family: var(--font-body);
      transition: all 0.15s var(--ease-out);
    }

    .edit-panel .btn-primary {
      background: var(--navy);
      color: var(--white);
    }

    .edit-panel .btn-primary:hover {
      background: var(--navy-light);
    }

    .edit-panel .btn-secondary {
      background: var(--white);
      color: var(--text);
      border: 1px solid var(--border);
    }

    .edit-panel .btn-secondary:hover {
      background: var(--bg);
    }

    .edit-panel .btn-danger,
    .drawer .btn-danger {
      background: #dc2626;
      color: white;
    }

    .edit-panel .btn-danger:hover,
    .drawer .btn-danger:hover {
      background: #b91c1c;
    }

    /* Cards - Mobile */
    .cards-view {
      display: none;
    }

    .member-card {
      background: var(--white);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .card-org {
      font-weight: 600;
      font-size: 1rem;
      color: var(--navy);
      line-height: 1.3;
    }

    .card-contact {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .card-status {
      flex-shrink: 0;
    }

    .card-body {
      display: grid;
      gap: 8px;
    }

    .card-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .card-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      min-width: 70px;
    }

    .card-value {
      font-size: 0.85rem;
      color: var(--text);
      flex: 1;
    }

    .card-value a {
      color: var(--navy);
      text-decoration: none;
    }

    .card-value a:hover {
      text-decoration: underline;
    }

    .card-notes {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--border);
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .card-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }

    .card-actions .action-btn {
      flex: 1;
      padding: 10px;
      text-align: center;
    }

    /* Drawer - slides up from bottom on mobile, centered modal on desktop */
    .drawer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      opacity: 0;
      visibility: hidden;
      z-index: -1;
      transition: opacity 0.2s, visibility 0.2s;
    }

    .drawer-overlay.open {
      opacity: 1;
      visibility: visible;
      z-index: 1000;
    }

    .drawer {
      position: fixed;
      background: var(--white);
      z-index: -1;
      overflow-y: auto;
      transform: translateY(100%);
      transition: transform 0.3s var(--ease-out);
      pointer-events: none;
    }

    .drawer.open {
      transform: translateY(0);
      z-index: 1001;
      pointer-events: auto;
    }

    /* Desktop: centered modal style */
    @media (min-width: 901px) {
      .drawer {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.95);
        opacity: 0;
        width: 100%;
        max-width: 480px;
        max-height: 90vh;
        border-radius: 16px;
        padding: 28px;
        box-shadow: var(--shadow-lg);
      }

      .drawer.open {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
    }

    /* Mobile: bottom drawer */
    @media (max-width: 900px) {
      .drawer {
        bottom: 0;
        left: 0;
        right: 0;
        max-height: 85vh;
        border-radius: 20px 20px 0 0;
        padding: 20px;
        padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
      }

      .drawer::before {
        content: '';
        display: block;
        width: 40px;
        height: 4px;
        background: var(--border-strong);
        border-radius: 2px;
        margin: 0 auto 16px;
      }
    }

    .drawer h2 {
      font-family: var(--font-body);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 20px;
    }

    .drawer .form-group {
      margin-bottom: 14px;
    }

    .drawer .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      font-size: 0.75rem;
      color: var(--navy-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .drawer .form-group input,
    .drawer .form-group select,
    .drawer .form-group textarea {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 16px; /* Prevents iOS zoom */
      font-family: var(--font-body);
      transition: all 0.15s var(--ease-out);
      background: var(--white);
    }

    .drawer .form-group select {
      appearance: none;
      padding-right: 40px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%231e293b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      cursor: pointer;
    }

    .drawer .form-group input:focus,
    .drawer .form-group select:focus,
    .drawer .form-group textarea:focus {
      outline: none;
      border-color: var(--gold);
      box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.15);
    }

    .drawer .form-group textarea {
      resize: vertical;
      min-height: 70px;
    }

    .drawer .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    @media (max-width: 400px) {
      .drawer .form-row {
        grid-template-columns: 1fr;
      }
    }

    .drawer-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .drawer .btn {
      flex: 1;
      padding: 14px 20px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      font-family: var(--font-body);
      transition: all 0.15s var(--ease-out);
    }

    .drawer .btn-primary {
      background: var(--navy);
      color: var(--white);
    }

    .drawer .btn-primary:hover {
      background: var(--navy-light);
    }

    .drawer .btn-secondary {
      background: var(--muted-bg);
      color: var(--text);
    }

    .drawer .btn-secondary:hover {
      background: var(--border);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--text-muted);
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .empty-state-text {
      font-size: 0.9rem;
    }

    /* History Modal */
    .history-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      z-index: 2000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s;
    }

    .history-overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .history-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.95);
      background: var(--white);
      border-radius: 16px;
      box-shadow: var(--shadow-lg);
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      z-index: 2001;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s var(--ease-out);
    }

    .history-modal.open {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, -50%) scale(1);
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }

    .history-header h3 {
      font-size: 1rem;
      font-weight: 600;
    }

    .history-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
      line-height: 1;
    }

    .history-close:hover {
      color: var(--text);
    }

    .history-content {
      padding: 16px 20px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .history-item {
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
    }

    .history-item:last-child {
      border-bottom: none;
    }

    .history-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .history-action {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .history-action.create {
      background: var(--success-bg);
      color: var(--success);
    }

    .history-action.update {
      background: var(--info-bg);
      color: var(--info);
    }

    .history-action.delete {
      background: #fee2e2;
      color: #dc2626;
    }

    .history-user {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .history-time {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .history-changes {
      margin-top: 8px;
      font-size: 0.8rem;
    }

    .history-change {
      display: flex;
      gap: 8px;
      padding: 4px 0;
    }

    .history-field {
      font-weight: 500;
      color: var(--navy-muted);
      min-width: 80px;
    }

    .history-old {
      color: #dc2626;
      text-decoration: line-through;
    }

    .history-new {
      color: var(--success);
    }

    .btn-history {
      background: var(--muted-bg);
      color: var(--text-muted);
      border: 1px solid var(--border);
      padding: 6px 12px;
      font-size: 0.75rem;
    }

    .btn-history:hover {
      background: var(--border);
      color: var(--text);
    }

    /* Responsive */
    @media (max-width: 900px) {
      .header-inner {
        flex-direction: column;
        gap: 12px;
        text-align: center;
        padding: 16px;
      }

      .logo {
        flex-direction: column;
        gap: 4px;
      }

      .stats {
        flex-wrap: wrap;
        justify-content: center;
        gap: 20px;
        row-gap: 12px;
      }

      .stat::after {
        right: -10px;
        height: 24px;
      }

      .user-info {
        width: 100%;
        justify-content: center;
        border-left: none;
        border-top: 1px solid rgba(255,255,255,0.15);
        padding-left: 0;
        padding-top: 12px;
        margin-left: 0;
        margin-top: 4px;
      }

      .toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-group {
        justify-content: center;
      }

      .search-wrapper {
        max-width: none;
      }

      .add-btn {
        margin-left: 0;
        width: 100%;
      }

      /* Hide table, show cards */
      .table-wrapper {
        display: none;
      }

      .cards-view {
        display: block;
      }
    }

    @media (max-width: 480px) {
      .container {
        padding: 16px;
      }

      .header-inner {
        padding: 14px 16px;
      }

      .logo h1 {
        font-size: 1.4rem;
      }

      .logo-tag {
        font-size: 0.65rem;
      }

      .stats {
        gap: 16px;
      }

      .stat-number {
        font-size: 1.4rem;
      }

      .stat-label {
        font-size: 0.6rem;
      }

      .stat::after {
        right: -8px;
        height: 20px;
      }

      .user-info {
        gap: 10px;
        font-size: 0.85rem;
      }

      .logout-btn {
        padding: 6px 12px;
        font-size: 0.7rem;
      }

      .filter-group {
        flex-wrap: wrap;
      }

      .filter-btn {
        padding: 8px 12px;
        font-size: 0.75rem;
      }

      .modal .form-row {
        grid-template-columns: 1fr;
      }

      .modal-content {
        padding: 20px;
      }
    }

    /* Toast notifications */
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .toast {
      background: var(--navy);
      color: var(--white);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 8px;
      animation: toast-in 0.3s var(--ease-out);
    }

    .toast.success {
      background: var(--success);
    }

    .toast.hiding {
      animation: toast-out 0.2s var(--ease-out) forwards;
    }

    .toast-check {
      width: 16px;
      height: 16px;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes toast-out {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-8px);
      }
    }

    /* Button spinner */
    .btn-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .action-btn.saving {
      pointer-events: none;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <div class="logo">
        <h1>LIFT <span>Philly</span></h1>
        <span class="logo-tag">Coalition Tracker</span>
      </div>
      <div class="stats" id="stats">
        <div class="stat">
          <div class="stat-number" id="stat-total">-</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat">
          <div class="stat-number" id="stat-active">-</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat">
          <div class="stat-number" id="stat-prospect">-</div>
          <div class="stat-label">Prospects</div>
        </div>
        <div class="user-info">
          <div class="user-menu" id="user-menu">
            <button class="user-menu-btn" onclick="toggleUserMenu(event)">
              <span id="user-name"></span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div class="user-dropdown">
              <a href="/admin" id="admin-link" style="display: none;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
                </svg>
                Admin Panel
              </a>
              <div class="divider" id="admin-divider" style="display: none;"></div>
              <button onclick="logout()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <div class="container">
    <div class="toolbar">
      <div class="filter-group">
        <button class="filter-btn active" data-status="">All</button>
        <button class="filter-btn" data-status="active">Active</button>
        <button class="filter-btn" data-status="prospect">Prospects</button>
        <button class="filter-btn" data-status="contacted">Contacted</button>
        <button class="filter-btn" data-status="inactive">Inactive</button>
      </div>
      <div class="search-wrapper">
        <input type="text" class="search-input" id="search" placeholder="Search members...">
      </div>
      <button class="add-btn" id="add-btn">+ Add Member</button>
    </div>

    <!-- Desktop Table View -->
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Contact</th>
            <th>Organization</th>
            <th>Type</th>
            <th>Connected Via</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="table-body"></tbody>
      </table>
    </div>

    <!-- Mobile Cards View -->
    <div class="cards-view" id="cards-view"></div>
  </div>

  <!-- Toast container -->
  <div class="toast-container" id="toast-container"></div>

  <!-- Drawer for add/edit -->
  <div class="drawer-overlay" id="drawer-overlay"></div>
  <div class="drawer" id="drawer">
    <h2 id="drawer-title">Add Member</h2>
    <form id="drawer-form">
      <input type="hidden" id="drawer-member-id">
      <div class="form-group">
        <label>Organization / Name *</label>
        <input type="text" id="drawer-name" required placeholder="Enter name">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Contact Name</label>
          <input type="text" id="drawer-contact_name" placeholder="Primary contact">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="drawer-contact_email" placeholder="email@example.com">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Type</label>
          <select id="drawer-type">
            <option value="">Select type...</option>
            <option value="organization">Organization</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
            <option value="elected_official">Elected Official</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="drawer-status">
            <option value="prospect">Prospect</option>
            <option value="contacted">Contacted</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Connected Via</label>
        <div class="combobox" id="drawer-connected-via-combobox">
          <input type="text" class="combobox-input" id="drawer-connected_via_search" placeholder="Search members..." autocomplete="off">
          <input type="hidden" id="drawer-connected_via_id">
          <button type="button" class="combobox-clear" onclick="clearDrawerConnectedVia()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div class="combobox-dropdown" id="drawer-connected_via_dropdown"></div>
        </div>
      </div>
      <div class="form-group">
        <label>Connection Notes</label>
        <input type="text" id="drawer-connected_via_notes" placeholder="How you know them...">
      </div>
      <div class="form-group">
        <label>Website</label>
        <input type="url" id="drawer-website" placeholder="https://...">
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea id="drawer-notes" placeholder="Additional context..."></textarea>
      </div>
      <div class="drawer-actions">
        <button type="button" class="btn btn-danger" id="drawer-delete-btn" style="display: none;" onclick="deleteFromDrawer()">Delete</button>
        <button type="button" class="btn btn-history" id="drawer-history-btn" style="display: none;" onclick="showHistoryFromDrawer()">History</button>
        <div style="flex: 1;"></div>
        <button type="button" class="btn btn-secondary" id="drawer-cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>
  </div>

  <!-- History Modal -->
  <div class="history-overlay" id="history-overlay" onclick="closeHistory()"></div>
  <div class="history-modal" id="history-modal">
    <div class="history-header">
      <h3>Change History</h3>
      <button class="history-close" onclick="closeHistory()">&times;</button>
    </div>
    <div class="history-content" id="history-content">
      Loading...
    </div>
  </div>

  <script>
    const currentUser = ${userJson};
    let members = [];
    let currentFilter = '';
    let searchTerm = '';
    let editingId = null;

    // Toast notifications
    function showToast(message, type = 'success') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = \`toast \${type}\`;
      toast.innerHTML = \`
        <svg class="toast-check" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        \${message}
      \`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 200);
      }, 1500);
    }

    // Permission helpers
    const canEdit = currentUser && (currentUser.role === 'editor' || currentUser.role === 'admin');
    const canDelete = currentUser && currentUser.role === 'admin';
    const isAdmin = currentUser && currentUser.role === 'admin';

    // Initialize user display
    if (currentUser) {
      document.getElementById('user-name').textContent = currentUser.display_name;
      if (isAdmin) {
        document.getElementById('admin-link').style.display = 'flex';
        document.getElementById('admin-divider').style.display = 'block';
      }
      if (!canEdit) {
        document.getElementById('add-btn').style.display = 'none';
      }
    }

    function toggleUserMenu(e) {
      e.stopPropagation();
      document.getElementById('user-menu').classList.toggle('open');
    }

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      const menu = document.getElementById('user-menu');
      if (!menu.contains(e.target)) {
        menu.classList.remove('open');
      }
    });

    async function logout() {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    }

    async function loadStats() {
      const res = await fetch('/api/stats');
      const stats = await res.json();
      document.getElementById('stat-total').textContent = stats.total;
      document.getElementById('stat-active').textContent = stats.active;
      document.getElementById('stat-prospect').textContent = stats.prospect;
    }

    async function loadMembers() {
      const res = await fetch('/api/members');
      members = await res.json();
      renderTable();
      renderCards();
    }

    function getStatusClass(status) {
      return {
        'active': 'status-active',
        'prospect': 'status-prospect',
        'contacted': 'status-contacted',
        'inactive': 'status-inactive'
      }[status] || 'status-prospect';
    }

    function getFilteredMembers() {
      let filtered = members;

      if (currentFilter) {
        filtered = filtered.filter(m => m.status === currentFilter);
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(m =>
          (m.name || '').toLowerCase().includes(term) ||
          (m.contact_name || '').toLowerCase().includes(term) ||
          (m.contact_email || '').toLowerCase().includes(term) ||
          (m.notes || '').toLowerCase().includes(term) ||
          (m.connected_via_name || '').toLowerCase().includes(term) ||
          (m.connected_via_notes || '').toLowerCase().includes(term)
        );
      }

      return filtered;
    }

    function renderEditPanel(m) {
      return \`
        <tr class="edit-panel-row" data-edit-id="\${m.id}">
          <td colspan="6">
            <div class="edit-panel">
              <form onsubmit="saveInlineEdit(event, \${m.id})">
                <div class="edit-panel-grid">
                  <div class="form-group">
                    <label>Organization / Name</label>
                    <input type="text" id="edit-name-\${m.id}" value="\${(m.name || '').replace(/"/g, '&quot;')}" required>
                  </div>
                  <div class="form-group">
                    <label>Contact Name</label>
                    <input type="text" id="edit-contact_name-\${m.id}" value="\${(m.contact_name || '').replace(/"/g, '&quot;')}">
                  </div>
                  <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="edit-contact_email-\${m.id}" value="\${(m.contact_email || '').replace(/"/g, '&quot;')}">
                  </div>
                  <div class="form-group">
                    <label>Type</label>
                    <select id="edit-type-\${m.id}">
                      <option value="">Select...</option>
                      <option value="organization" \${m.type === 'organization' ? 'selected' : ''}>Organization</option>
                      <option value="individual" \${m.type === 'individual' ? 'selected' : ''}>Individual</option>
                      <option value="business" \${m.type === 'business' ? 'selected' : ''}>Business</option>
                      <option value="elected_official" \${m.type === 'elected_official' ? 'selected' : ''}>Elected Official</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Status</label>
                    <select id="edit-status-\${m.id}">
                      <option value="prospect" \${m.status === 'prospect' ? 'selected' : ''}>Prospect</option>
                      <option value="contacted" \${m.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                      <option value="active" \${m.status === 'active' ? 'selected' : ''}>Active</option>
                      <option value="inactive" \${m.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Connected Via</label>
                    <div class="combobox" id="edit-connected-via-combobox-\${m.id}">
                      <input type="text" class="combobox-input" id="edit-connected_via_search-\${m.id}" placeholder="Search members..." autocomplete="off" value="\${m.connected_via_name || ''}" data-member-id="\${m.id}">
                      <input type="hidden" id="edit-connected_via_id-\${m.id}" value="\${m.connected_via_id || ''}">
                      <button type="button" class="combobox-clear" onclick="clearEditConnectedVia(\${m.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                      <div class="combobox-dropdown" id="edit-connected_via_dropdown-\${m.id}"></div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Connection Notes</label>
                    <input type="text" id="edit-connected_via_notes-\${m.id}" value="\${(m.connected_via_notes || '').replace(/"/g, '&quot;')}">
                  </div>
                  <div class="form-group">
                    <label>Website</label>
                    <input type="url" id="edit-website-\${m.id}" value="\${(m.website || '').replace(/"/g, '&quot;')}">
                  </div>
                  <div class="form-group">
                    <label>Notes</label>
                    <textarea id="edit-notes-\${m.id}">\${m.notes || ''}</textarea>
                  </div>
                </div>
                <div class="edit-panel-actions">
                  \${canDelete ? \`<button type="button" class="btn btn-danger" onclick="deleteMember(\${m.id})">Delete</button>\` : ''}
                  <button type="button" class="btn btn-history" onclick="showHistory(\${m.id})">History</button>
                  <div style="flex: 1;"></div>
                  <button type="button" class="btn btn-secondary" onclick="closeEditPanel()">Cancel</button>
                  <button type="submit" class="btn btn-primary" id="save-btn-\${m.id}">Save Changes</button>
                </div>
              </form>
            </div>
          </td>
        </tr>
      \`;
    }

    function renderTable() {
      const tbody = document.getElementById('table-body');
      const filtered = getFilteredMembers();

      if (filtered.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="6">
              <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">No members found</div>
              </div>
            </td>
          </tr>
        \`;
        return;
      }

      tbody.innerHTML = filtered.map(m => {
        const isEditing = editingId === m.id;
        const rowClass = isEditing ? 'editing has-edit-panel' : '';

        let html = \`
          <tr data-id="\${m.id}" class="\${rowClass} clickable-row" onclick="handleRowClick(event, \${m.id})">
            <td>
              \${canEdit ? \`
                <select class="status-select \${getStatusClass(m.status)}" onchange="updateStatus(\${m.id}, this.value)" onclick="event.stopPropagation()">
                  <option value="prospect" \${m.status === 'prospect' ? 'selected' : ''}>Prospect</option>
                  <option value="contacted" \${m.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                  <option value="active" \${m.status === 'active' ? 'selected' : ''}>Active</option>
                  <option value="inactive" \${m.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
              \` : \`
                <span class="status-select \${getStatusClass(m.status)}" style="cursor: default;">\${m.status}</span>
              \`}
            </td>
            <td><span class="contact-name">\${m.contact_name || '-'}</span></td>
            <td><span class="org-name">\${m.name || '-'}</span></td>
            <td>\${m.type ? \`<span class="type-badge">\${m.type.replace('_', ' ')}</span>\` : '-'}</td>
            <td><span class="connected-via">\${m.connected_via_name || m.connected_via_notes || '-'}</span></td>
            <td>
              \${canEdit ? \`<button class="action-btn" id="action-btn-\${m.id}" onclick="event.stopPropagation(); toggleEditPanel(\${m.id}, this)">\${isEditing ? 'Close' : 'Open'}</button>\` : ''}
            </td>
          </tr>
        \`;

        if (isEditing && canEdit) {
          html += renderEditPanel(m);
        }

        return html;
      }).join('');
    }

    function renderCards() {
      const container = document.getElementById('cards-view');
      const filtered = getFilteredMembers();

      if (filtered.length === 0) {
        container.innerHTML = \`
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-text">No members found</div>
          </div>
        \`;
        return;
      }

      container.innerHTML = filtered.map(m => \`
        <div class="member-card" data-id="\${m.id}">
          <div class="card-header">
            <div>
              <div class="card-org">\${m.name || 'Unnamed'}</div>
              \${m.contact_name ? \`<div class="card-contact">\${m.contact_name}</div>\` : ''}
            </div>
            <div class="card-status">
              \${canEdit ? \`
                <select class="status-select \${getStatusClass(m.status)}" onchange="updateStatus(\${m.id}, this.value)">
                  <option value="prospect" \${m.status === 'prospect' ? 'selected' : ''}>Prospect</option>
                  <option value="contacted" \${m.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                  <option value="active" \${m.status === 'active' ? 'selected' : ''}>Active</option>
                  <option value="inactive" \${m.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
              \` : \`
                <span class="status-select \${getStatusClass(m.status)}" style="cursor: default;">\${m.status}</span>
              \`}
            </div>
          </div>
          <div class="card-body">
            \${m.contact_email ? \`
              <div class="card-row">
                <span class="card-label">Email</span>
                <span class="card-value"><a href="mailto:\${m.contact_email}">\${m.contact_email}</a></span>
              </div>
            \` : ''}
            \${m.type ? \`
              <div class="card-row">
                <span class="card-label">Type</span>
                <span class="card-value"><span class="type-badge">\${m.type.replace('_', ' ')}</span></span>
              </div>
            \` : ''}
            \${(m.connected_via_name || m.connected_via_notes) ? \`
              <div class="card-row">
                <span class="card-label">Via</span>
                <span class="card-value">\${m.connected_via_name || m.connected_via_notes}</span>
              </div>
            \` : ''}
          </div>
          \${m.notes ? \`<div class="card-notes">\${m.notes}</div>\` : ''}
          \${canEdit ? \`
            <div class="card-actions">
              <button class="action-btn" onclick="editMemberMobile(\${m.id})">Edit</button>
              \${canDelete ? \`<button class="action-btn delete" onclick="deleteMember(\${m.id})">Delete</button>\` : ''}
            </div>
          \` : ''}
        </div>
      \`).join('');
    }

    async function updateStatus(id, status) {
      await fetch(\`/api/members/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadMembers();
      loadStats();
    }

    async function toggleEditPanel(id, btn) {
      // Get button reference if not passed
      if (!btn) btn = document.getElementById(\`action-btn-\${id}\`);

      // Save current panel if switching to a different one
      if (editingId && editingId !== id) {
        await saveEditData(editingId);
      }

      if (editingId === id) {
        // Closing current panel - show spinner and save
        if (btn) {
          const originalText = btn.textContent;
          btn.innerHTML = '<span class="btn-spinner"></span>';
          btn.classList.add('saving');
        }
        await saveEditData(id);
        editingId = null;
        loadMembers();
        loadStats();
      } else {
        editingId = id;
        renderTable();
        // Initialize combobox for the edit panel
        setTimeout(() => initEditCombobox(editingId), 0);
      }
    }

    function handleRowClick(event, id) {
      toggleEditPanel(id);
    }

    async function closeEditPanel() {
      if (editingId) {
        await saveEditData(editingId);
      }
      editingId = null;
      loadMembers();
      loadStats();
    }

    async function saveEditData(id) {
      const connectedViaIdVal = document.getElementById(\`edit-connected_via_id-\${id}\`)?.value;
      const nameEl = document.getElementById(\`edit-name-\${id}\`);
      if (!nameEl) return; // Panel already closed

      const data = {
        name: nameEl.value,
        contact_name: document.getElementById(\`edit-contact_name-\${id}\`).value || null,
        contact_email: document.getElementById(\`edit-contact_email-\${id}\`).value || null,
        type: document.getElementById(\`edit-type-\${id}\`).value || null,
        status: document.getElementById(\`edit-status-\${id}\`).value,
        connected_via_id: connectedViaIdVal ? parseInt(connectedViaIdVal, 10) : null,
        connected_via_notes: document.getElementById(\`edit-connected_via_notes-\${id}\`).value || null,
        website: document.getElementById(\`edit-website-\${id}\`).value || null,
        notes: document.getElementById(\`edit-notes-\${id}\`).value || null
      };

      await fetch(\`/api/members/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      showToast('Saved');
    }

    async function saveInlineEdit(event, id) {
      event.preventDefault();
      const btn = document.getElementById(\`save-btn-\${id}\`);
      if (btn) {
        btn.innerHTML = '<span class="btn-spinner"></span> Saving';
        btn.disabled = true;
      }
      await saveEditData(id);
      editingId = null;
      loadMembers();
      loadStats();
    }

    // Drawer functions
    function openDrawer() {
      document.getElementById('drawer-overlay').classList.add('open');
      document.getElementById('drawer').classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      document.getElementById('drawer-overlay').classList.remove('open');
      document.getElementById('drawer').classList.remove('open');
      document.body.style.overflow = '';
    }

    // Combobox for connected via - shared logic
    let activeCombobox = null;
    let highlightedIndex = 0;

    function renderComboboxOptions(dropdown, filteredMembers, selectedId, excludeId, highlightFirst = true, searchQuery = '') {
      const filtered = filteredMembers.filter(m => !excludeId || m.id !== parseInt(excludeId, 10));
      const addNewIndex = filtered.length;

      // Reset highlight to first item when rendering
      if (highlightFirst) {
        highlightedIndex = filtered.length > 0 ? 0 : addNewIndex;
      }

      let html = '';

      if (filtered.length === 0) {
        html += '<div class="combobox-empty">No matching members</div>';
      } else {
        html += filtered.map((m, idx) => \`
          <div class="combobox-option \${m.id === selectedId ? 'selected' : ''} \${idx === highlightedIndex ? 'highlighted' : ''}" data-id="\${m.id}" data-name="\${(m.contact_name || m.name).replace(/"/g, '&quot;')}" data-index="\${idx}">
            <div class="combobox-option-name">\${m.contact_name || m.name}</div>
            \${m.name && m.contact_name ? \`<div class="combobox-option-org">\${m.name}</div>\` : ''}
          </div>
        \`).join('');
      }

      // Always show "Add new" option
      html += \`
        <div class="combobox-add-new \${highlightedIndex === addNewIndex ? 'highlighted' : ''}" data-action="add-new" data-index="\${addNewIndex}" data-prefill="\${searchQuery.replace(/"/g, '&quot;')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add new member\${searchQuery ? \`: "\${searchQuery}"\` : '...'}
        </div>
      \`;

      dropdown.innerHTML = html;
    }

    function updateHighlight(dropdown, newIndex) {
      const options = dropdown.querySelectorAll('.combobox-option, .combobox-add-new');
      if (options.length === 0) return;

      // Clamp index
      highlightedIndex = Math.max(0, Math.min(newIndex, options.length - 1));

      // Update classes
      options.forEach((opt, idx) => {
        opt.classList.toggle('highlighted', idx === highlightedIndex);
      });

      // Scroll into view
      options[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }

    function selectHighlighted(dropdown, hidden, input, combobox) {
      // Check for highlighted member option
      const highlighted = dropdown.querySelector('.combobox-option.highlighted');
      if (highlighted) {
        hidden.value = highlighted.dataset.id;
        input.value = highlighted.dataset.name;
        combobox.classList.remove('open');
        combobox.classList.add('has-value');
        activeCombobox = null;
        return 'selected';
      }

      // Check for highlighted "add new" option
      const addNew = dropdown.querySelector('.combobox-add-new.highlighted');
      if (addNew) {
        combobox.classList.remove('open');
        activeCombobox = null;
        return { action: 'add-new', prefill: addNew.dataset.prefill || '' };
      }

      return false;
    }

    function handleAddNew(prefill) {
      // Open drawer with prefilled contact name
      document.getElementById('drawer-title').textContent = 'Add Member';
      document.getElementById('drawer-form').reset();
      document.getElementById('drawer-member-id').value = '';
      document.getElementById('drawer-contact_name').value = prefill;
      clearDrawerConnectedVia();
      initDrawerCombobox();
      document.getElementById('drawer-delete-btn').style.display = 'none';
      document.getElementById('drawer-history-btn').style.display = 'none';
      openDrawer();
      // Focus on the org name field since we prefilled contact
      if (prefill) {
        setTimeout(() => document.getElementById('drawer-name').focus(), 100);
      }
    }

    function filterMembers(query, excludeId = null) {
      const term = query.toLowerCase();
      return members
        .filter(m => !excludeId || m.id !== parseInt(excludeId, 10))
        .filter(m =>
          (m.contact_name || '').toLowerCase().includes(term) ||
          (m.name || '').toLowerCase().includes(term)
        )
        .sort((a, b) => (a.contact_name || a.name).localeCompare(b.contact_name || b.name));
    }

    function setupCombobox(inputId, hiddenId, dropdownId, comboboxId, excludeId = null) {
      const input = document.getElementById(inputId);
      const hidden = document.getElementById(hiddenId);
      const dropdown = document.getElementById(dropdownId);
      const combobox = document.getElementById(comboboxId);

      if (!input || !dropdown || !combobox) return;

      // Update has-value class
      if (hidden.value) {
        combobox.classList.add('has-value');
      } else {
        combobox.classList.remove('has-value');
      }

      // Show dropdown on focus
      input.addEventListener('focus', () => {
        activeCombobox = comboboxId;
        combobox.classList.add('open');
        highlightedIndex = 0;
        const filtered = filterMembers(input.value, excludeId);
        renderComboboxOptions(dropdown, filtered, parseInt(hidden.value, 10) || null, excludeId, true, input.value);
      });

      // Filter on input
      input.addEventListener('input', () => {
        highlightedIndex = 0;
        const filtered = filterMembers(input.value, excludeId);
        renderComboboxOptions(dropdown, filtered, parseInt(hidden.value, 10) || null, excludeId, true, input.value);
      });

      // Keyboard navigation
      input.addEventListener('keydown', (e) => {
        if (!combobox.classList.contains('open')) {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            combobox.classList.add('open');
            const filtered = filterMembers(input.value, excludeId);
            renderComboboxOptions(dropdown, filtered, parseInt(hidden.value, 10) || null, excludeId, true, input.value);
          }
          return;
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            updateHighlight(dropdown, highlightedIndex + 1);
            break;
          case 'ArrowUp':
            e.preventDefault();
            updateHighlight(dropdown, highlightedIndex - 1);
            break;
          case 'Enter':
            e.preventDefault();
            const result = selectHighlighted(dropdown, hidden, input, combobox);
            if (result && result.action === 'add-new') {
              handleAddNew(result.prefill);
            }
            break;
          case 'Escape':
            e.preventDefault();
            combobox.classList.remove('open');
            activeCombobox = null;
            break;
          case 'Tab':
            // Select on tab if there's a highlighted option
            if (selectHighlighted(dropdown, hidden, input, combobox)) {
              // Let tab continue to next field
            }
            break;
        }
      });

      // Handle option click
      dropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.combobox-option');
        if (option) {
          hidden.value = option.dataset.id;
          input.value = option.dataset.name;
          combobox.classList.remove('open');
          combobox.classList.add('has-value');
          activeCombobox = null;
          return;
        }

        // Handle "add new" click
        const addNew = e.target.closest('.combobox-add-new');
        if (addNew) {
          combobox.classList.remove('open');
          activeCombobox = null;
          handleAddNew(addNew.dataset.prefill || '');
        }
      });

      // Hover to highlight
      dropdown.addEventListener('mouseover', (e) => {
        const option = e.target.closest('.combobox-option, .combobox-add-new');
        if (option && option.dataset.index !== undefined) {
          updateHighlight(dropdown, parseInt(option.dataset.index, 10));
        }
      });
    }

    // Close any open combobox when clicking outside
    document.addEventListener('click', (e) => {
      if (activeCombobox) {
        const combobox = document.getElementById(activeCombobox);
        if (combobox && !combobox.contains(e.target)) {
          combobox.classList.remove('open');
          activeCombobox = null;
        }
      }
    });

    function clearDrawerConnectedVia() {
      document.getElementById('drawer-connected_via_id').value = '';
      document.getElementById('drawer-connected_via_search').value = '';
      document.getElementById('drawer-connected-via-combobox').classList.remove('has-value');
    }

    function clearEditConnectedVia(memberId) {
      document.getElementById(\`edit-connected_via_id-\${memberId}\`).value = '';
      document.getElementById(\`edit-connected_via_search-\${memberId}\`).value = '';
      document.getElementById(\`edit-connected-via-combobox-\${memberId}\`).classList.remove('has-value');
    }

    function initDrawerCombobox(excludeId = null) {
      setupCombobox(
        'drawer-connected_via_search',
        'drawer-connected_via_id',
        'drawer-connected_via_dropdown',
        'drawer-connected-via-combobox',
        excludeId
      );
    }

    function initEditCombobox(memberId) {
      setupCombobox(
        \`edit-connected_via_search-\${memberId}\`,
        \`edit-connected_via_id-\${memberId}\`,
        \`edit-connected_via_dropdown-\${memberId}\`,
        \`edit-connected-via-combobox-\${memberId}\`,
        memberId
      );
    }

    // Mobile edit uses drawer
    function editMemberMobile(id) {
      const member = members.find(m => m.id === id);
      if (!member) return;

      document.getElementById('drawer-title').textContent = 'Edit Member';
      document.getElementById('drawer-member-id').value = id;
      document.getElementById('drawer-name').value = member.name || '';
      document.getElementById('drawer-contact_name').value = member.contact_name || '';
      document.getElementById('drawer-contact_email').value = member.contact_email || '';
      document.getElementById('drawer-type').value = member.type || '';
      document.getElementById('drawer-status').value = member.status || 'prospect';
      document.getElementById('drawer-connected_via_id').value = member.connected_via_id || '';
      document.getElementById('drawer-connected_via_search').value = member.connected_via_name || '';
      document.getElementById('drawer-connected_via_notes').value = member.connected_via_notes || '';
      document.getElementById('drawer-website').value = member.website || '';
      document.getElementById('drawer-notes').value = member.notes || '';

      // Update combobox has-value class
      const combobox = document.getElementById('drawer-connected-via-combobox');
      if (member.connected_via_id) {
        combobox.classList.add('has-value');
      } else {
        combobox.classList.remove('has-value');
      }

      // Initialize combobox
      initDrawerCombobox(id);

      // Show delete (admin only) and history buttons when editing
      document.getElementById('drawer-delete-btn').style.display = canDelete ? 'block' : 'none';
      document.getElementById('drawer-history-btn').style.display = 'block';

      openDrawer();
    }

    async function deleteFromDrawer() {
      const id = document.getElementById('drawer-member-id').value;
      if (!id) return;
      if (!confirm('Delete this member?')) return;
      await fetch(\`/api/members/\${id}\`, { method: 'DELETE' });
      closeDrawer();
      loadMembers();
      loadStats();
    }

    function showHistoryFromDrawer() {
      const id = document.getElementById('drawer-member-id').value;
      if (!id) return;
      showHistory(parseInt(id, 10));
    }

    async function deleteMember(id) {
      if (!confirm('Delete this member?')) return;
      await fetch(\`/api/members/\${id}\`, { method: 'DELETE' });
      if (editingId === id) editingId = null;
      loadMembers();
      loadStats();
    }

    // Event listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.status;
        editingId = null;
        renderTable();
        renderCards();
      });
    });

    document.getElementById('search').addEventListener('input', (e) => {
      searchTerm = e.target.value;
      editingId = null;
      renderTable();
      renderCards();
    });

    document.getElementById('add-btn').addEventListener('click', () => {
      document.getElementById('drawer-title').textContent = 'Add Member';
      document.getElementById('drawer-form').reset();
      document.getElementById('drawer-member-id').value = '';
      // Clear combobox
      clearDrawerConnectedVia();
      // Initialize combobox
      initDrawerCombobox();
      // Hide delete and history buttons when adding new
      document.getElementById('drawer-delete-btn').style.display = 'none';
      document.getElementById('drawer-history-btn').style.display = 'none';
      openDrawer();
    });

    document.getElementById('drawer-cancel-btn').addEventListener('click', closeDrawer);
    document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);

    document.getElementById('drawer-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('drawer-member-id').value;
      const connectedViaIdVal = document.getElementById('drawer-connected_via_id').value;
      const data = {
        name: document.getElementById('drawer-name').value,
        contact_name: document.getElementById('drawer-contact_name').value || null,
        contact_email: document.getElementById('drawer-contact_email').value || null,
        type: document.getElementById('drawer-type').value || null,
        status: document.getElementById('drawer-status').value,
        connected_via_id: connectedViaIdVal ? parseInt(connectedViaIdVal, 10) : null,
        connected_via_notes: document.getElementById('drawer-connected_via_notes').value || null,
        website: document.getElementById('drawer-website').value || null,
        notes: document.getElementById('drawer-notes').value || null
      };

      if (id) {
        await fetch(\`/api/members/\${id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }

      closeDrawer();
      loadMembers();
      loadStats();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDrawer();
        if (editingId) {
          editingId = null;
          renderTable();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search').focus();
      }
    });

    // History functions
    async function showHistory(memberId) {
      const modal = document.getElementById('history-modal');
      const overlay = document.getElementById('history-overlay');
      const content = document.getElementById('history-content');

      content.innerHTML = 'Loading...';
      overlay.classList.add('open');
      modal.classList.add('open');

      try {
        const res = await fetch(\`/api/members/\${memberId}/history\`);
        const history = await res.json();

        if (history.length === 0) {
          content.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No changes recorded yet.</p>';
          return;
        }

        content.innerHTML = history.map(entry => {
          const date = new Date(entry.timestamp);
          const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
                         ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

          let changesHtml = '';
          if (entry.changes && entry.action === 'update') {
            const changes = JSON.parse(entry.changes);
            changesHtml = '<div class="history-changes">' +
              Object.entries(changes).map(([field, vals]) => \`
                <div class="history-change">
                  <span class="history-field">\${field}:</span>
                  <span class="history-old">\${vals.old || '(empty)'}</span>
                  <span>→</span>
                  <span class="history-new">\${vals.new || '(empty)'}</span>
                </div>
              \`).join('') +
              '</div>';
          }

          return \`
            <div class="history-item">
              <div class="history-meta">
                <div>
                  <span class="history-action \${entry.action}">\${entry.action}</span>
                  <span class="history-user">by \${entry.user_display_name}</span>
                </div>
                <span class="history-time">\${timeStr}</span>
              </div>
              \${changesHtml}
            </div>
          \`;
        }).join('');
      } catch (err) {
        content.innerHTML = '<p style="color: var(--error);">Failed to load history.</p>';
      }
    }

    function closeHistory() {
      document.getElementById('history-modal').classList.remove('open');
      document.getElementById('history-overlay').classList.remove('open');
    }

    // Initial load
    loadStats();
    loadMembers();
  </script>
</body>
</html>`;
}
