export function getIndexHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LIFT Philly Coalition Tracker</title>
  <style>
    :root {
      --navy: #0f172a;
      --navy-light: #1e293b;
      --gold: #fbbf24;
      --gold-dark: #f59e0b;
      --text: #334155;
      --text-light: #64748b;
      --white: #ffffff;
      --bg: #f8fafc;
      --border: #e2e8f0;
      --success: #10b981;
      --warning: #f59e0b;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }

    .header {
      background: var(--navy);
      color: var(--white);
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h1 {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .header h1 span { color: var(--gold); }

    .stats {
      display: flex;
      gap: 24px;
      font-size: 0.9rem;
    }

    .stat { text-align: center; }
    .stat-number { font-size: 1.5rem; font-weight: 700; color: var(--gold); }
    .stat-label { color: rgba(255,255,255,0.7); }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .toolbar {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-btn {
      padding: 8px 16px;
      border: 1px solid var(--border);
      background: var(--white);
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }

    .filter-btn:hover { border-color: var(--navy); }
    .filter-btn.active { background: var(--navy); color: var(--white); border-color: var(--navy); }

    .add-btn {
      padding: 8px 16px;
      background: var(--gold);
      color: var(--navy);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      margin-left: auto;
    }

    .add-btn:hover { background: var(--gold-dark); }

    .search-input {
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.85rem;
      width: 200px;
    }

    .table-wrapper {
      background: var(--white);
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      background: var(--bg);
      font-weight: 600;
      color: var(--text-light);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      position: sticky;
      top: 0;
    }

    tr:hover { background: #f1f5f9; }

    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-active { background: #dcfce7; color: #166534; }
    .status-prospect { background: #fef3c7; color: #92400e; }
    .status-contacted { background: #dbeafe; color: #1e40af; }
    .status-inactive { background: #f1f5f9; color: #64748b; }

    .type-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.7rem;
      background: #f1f5f9;
      color: var(--text-light);
    }

    .editable {
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .editable:hover { background: #e2e8f0; }

    .editable:focus {
      outline: 2px solid var(--gold);
      background: var(--white);
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      padding: 4px 8px;
      border: none;
      background: none;
      cursor: pointer;
      color: var(--text-light);
      border-radius: 4px;
    }

    .action-btn:hover { background: #f1f5f9; color: var(--text); }
    .action-btn.delete:hover { background: #fee2e2; color: #dc2626; }

    .email-link {
      color: var(--navy);
      text-decoration: none;
    }

    .email-link:hover { text-decoration: underline; }

    .notes-cell {
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }

    .modal.open { display: flex; }

    .modal-content {
      background: var(--white);
      padding: 24px;
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal h2 {
      margin-bottom: 16px;
      color: var(--navy);
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
      font-size: 0.85rem;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .form-group textarea { resize: vertical; min-height: 80px; }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-primary { background: var(--navy); color: var(--white); }
    .btn-secondary { background: var(--bg); color: var(--text); }
  </style>
</head>
<body>
  <div class="header">
    <h1>LIFT <span>Philly</span> Coalition</h1>
    <div class="stats" id="stats">
      <div class="stat"><div class="stat-number" id="stat-total">-</div><div class="stat-label">Total</div></div>
      <div class="stat"><div class="stat-number" id="stat-active">-</div><div class="stat-label">Active</div></div>
      <div class="stat"><div class="stat-number" id="stat-prospect">-</div><div class="stat-label">Prospects</div></div>
    </div>
  </div>

  <div class="container">
    <div class="toolbar">
      <button class="filter-btn active" data-status="">All</button>
      <button class="filter-btn" data-status="active">Active</button>
      <button class="filter-btn" data-status="prospect">Prospects</button>
      <button class="filter-btn" data-status="contacted">Contacted</button>
      <button class="filter-btn" data-status="inactive">Inactive</button>
      <input type="text" class="search-input" id="search" placeholder="Search...">
      <button class="add-btn" id="add-btn">+ Add Member</button>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Organization</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Type</th>
            <th>Connected Via</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="table-body"></tbody>
      </table>
    </div>
  </div>

  <div class="modal" id="modal">
    <div class="modal-content">
      <h2 id="modal-title">Add Member</h2>
      <form id="member-form">
        <input type="hidden" id="member-id">
        <div class="form-group">
          <label>Organization/Name *</label>
          <input type="text" id="name" required>
        </div>
        <div class="form-group">
          <label>Contact Name</label>
          <input type="text" id="contact_name">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="contact_email">
        </div>
        <div class="form-group">
          <label>Type</label>
          <select id="type">
            <option value="">Select...</option>
            <option value="organization">Organization</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
            <option value="elected_official">Elected Official</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="status">
            <option value="prospect">Prospect</option>
            <option value="contacted">Contacted</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="form-group">
          <label>Connected Via</label>
          <input type="text" id="connected_via">
        </div>
        <div class="form-group">
          <label>Website</label>
          <input type="url" id="website">
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="notes"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let members = [];
    let currentFilter = '';
    let searchTerm = '';

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
    }

    function renderTable() {
      const tbody = document.getElementById('table-body');
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
          (m.notes || '').toLowerCase().includes(term)
        );
      }

      tbody.innerHTML = filtered.map(m => \`
        <tr data-id="\${m.id}">
          <td>
            <select class="status-select" data-id="\${m.id}" onchange="updateStatus(\${m.id}, this.value)">
              <option value="prospect" \${m.status === 'prospect' ? 'selected' : ''}>Prospect</option>
              <option value="contacted" \${m.status === 'contacted' ? 'selected' : ''}>Contacted</option>
              <option value="active" \${m.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="inactive" \${m.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </td>
          <td><strong>\${m.name || '-'}</strong></td>
          <td>\${m.contact_name || '-'}</td>
          <td>\${m.contact_email ? \`<a href="mailto:\${m.contact_email}" class="email-link">\${m.contact_email}</a>\` : '-'}</td>
          <td>\${m.type ? \`<span class="type-badge">\${m.type}</span>\` : '-'}</td>
          <td>\${m.connected_via || '-'}</td>
          <td class="notes-cell" title="\${m.notes || ''}">\${m.notes || '-'}</td>
          <td class="actions">
            <button class="action-btn" onclick="editMember(\${m.id})">Edit</button>
            <button class="action-btn delete" onclick="deleteMember(\${m.id})">Delete</button>
          </td>
        </tr>
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

    function editMember(id) {
      const member = members.find(m => m.id === id);
      if (!member) return;

      document.getElementById('modal-title').textContent = 'Edit Member';
      document.getElementById('member-id').value = id;
      document.getElementById('name').value = member.name || '';
      document.getElementById('contact_name').value = member.contact_name || '';
      document.getElementById('contact_email').value = member.contact_email || '';
      document.getElementById('type').value = member.type || '';
      document.getElementById('status').value = member.status || 'prospect';
      document.getElementById('connected_via').value = member.connected_via || '';
      document.getElementById('website').value = member.website || '';
      document.getElementById('notes').value = member.notes || '';

      document.getElementById('modal').classList.add('open');
    }

    async function deleteMember(id) {
      if (!confirm('Delete this member?')) return;
      await fetch(\`/api/members/\${id}\`, { method: 'DELETE' });
      loadMembers();
      loadStats();
    }

    // Event listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.status;
        renderTable();
      });
    });

    document.getElementById('search').addEventListener('input', (e) => {
      searchTerm = e.target.value;
      renderTable();
    });

    document.getElementById('add-btn').addEventListener('click', () => {
      document.getElementById('modal-title').textContent = 'Add Member';
      document.getElementById('member-form').reset();
      document.getElementById('member-id').value = '';
      document.getElementById('modal').classList.add('open');
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
      document.getElementById('modal').classList.remove('open');
    });

    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        e.currentTarget.classList.remove('open');
      }
    });

    document.getElementById('member-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('member-id').value;
      const data = {
        name: document.getElementById('name').value,
        contact_name: document.getElementById('contact_name').value || null,
        contact_email: document.getElementById('contact_email').value || null,
        type: document.getElementById('type').value || null,
        status: document.getElementById('status').value,
        connected_via: document.getElementById('connected_via').value || null,
        website: document.getElementById('website').value || null,
        notes: document.getElementById('notes').value || null
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

      document.getElementById('modal').classList.remove('open');
      loadMembers();
      loadStats();
    });

    // Initial load
    loadStats();
    loadMembers();
  </script>
</body>
</html>`;
}
