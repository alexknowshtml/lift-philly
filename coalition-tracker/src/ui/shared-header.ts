export type AdminPage = 'tracker' | 'users' | 'petition';

export function getSharedHeaderCss(): string {
  return `
    .header {
      background: #0f172a;
      color: #fff;
      padding: 0;
    }
    .header-inner {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
    }
    .logo {
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-shrink: 0;
    }
    .logo h1 {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .logo h1 a {
      color: #fff;
      text-decoration: none;
    }
    .logo h1 span { color: #fbbf24; }
    .logo-tag {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255,255,255,0.5);
      font-weight: 500;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-menu { position: relative; }
    .user-menu-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      color: #fff;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }
    .user-menu-btn:hover { background: rgba(255,255,255,0.2); }
    .user-menu-btn svg {
      width: 12px;
      height: 12px;
      transition: transform 0.15s;
    }
    .user-menu.open .user-menu-btn svg { transform: rotate(180deg); }
    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      min-width: 190px;
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
      padding: 11px 16px;
      background: none;
      border: none;
      color: #334155;
      font-size: 0.875rem;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.1s;
      text-align: left;
      font-family: inherit;
    }
    .user-dropdown a:hover,
    .user-dropdown button:hover { background: #f1f5f9; }
    .user-dropdown a.active {
      font-weight: 600;
      color: #0f172a;
      background: #f8fafc;
    }
    .user-dropdown svg {
      width: 16px;
      height: 16px;
      color: #64748b;
      flex-shrink: 0;
    }
    .user-dropdown .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 4px 0;
    }
  `;
}

const ICONS = {
  tracker: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  petition: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
};

const PAGE_LABELS: Record<AdminPage, string> = {
  tracker: 'Coalition Tracker',
  users: 'User Management',
  petition: 'Petition Mod',
};

export function getSharedHeader(username: string, currentPage: AdminPage, extraHtml = ''): string {
  const a = (page: AdminPage, href: string, label: string) =>
    `<a href="${href}"${currentPage === page ? ' class="active"' : ''}>${ICONS[page]}${label}</a>`;

  return `
  <header class="header">
    <div class="header-inner">
      <div class="logo">
        <h1><a href="/admin">LIFT <span>Philly</span></a></h1>
        <span class="logo-tag">${PAGE_LABELS[currentPage]}</span>
      </div>
      ${extraHtml}
      <div class="header-right">
        <div class="user-menu" id="user-menu">
          <button class="user-menu-btn" onclick="toggleUserMenu(event)">
            <span>${username}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="user-dropdown">
            ${a('tracker', '/admin', 'Tracker')}
            ${a('petition', '/admin/petition', 'Mod')}
            ${a('users', '/admin/users', 'Manage Users')}
            <div class="divider"></div>
            <button onclick="logout()">${ICONS.logout}Logout</button>
          </div>
        </div>
      </div>
    </div>
  </header>`;
}

export function getSharedHeaderScript(): string {
  return `
    function toggleUserMenu(event) {
      event.stopPropagation();
      document.getElementById('user-menu').classList.toggle('open');
    }
    document.addEventListener('click', function(e) {
      const menu = document.getElementById('user-menu');
      if (menu && !menu.contains(e.target)) menu.classList.remove('open');
    });
    async function logout() {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    }
  `;
}
