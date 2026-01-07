import type { User } from '../db/client';

export function getAdminHtml(user?: Omit<User, 'password_hash'>): string {
  const userJson = user ? JSON.stringify(user) : 'null';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Management - LIFT Philly</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    :root {
      --gold: #fbbf24;
      --gold-light: #fef3c7;
      --dark: #0f172a;
      --gray: #64748b;
      --gray-light: #f1f5f9;
      --bg: #f8fafc;
      --white: #ffffff;
      --red: #ef4444;
      --red-light: #fee2e2;
      --green: #22c55e;
      --blue: #3b82f6;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--dark);
      line-height: 1.5;
    }

    .header {
      background: var(--dark);
      color: var(--white);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h1 {
      font-size: 20px;
      font-weight: 600;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-link {
      color: var(--gold);
      text-decoration: none;
      font-size: 14px;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-name {
      color: var(--gold);
      font-weight: 500;
    }

    .logout-btn {
      background: transparent;
      border: 1px solid var(--gray);
      color: var(--gray-light);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }

    .logout-btn:hover {
      border-color: var(--gold);
      color: var(--gold);
    }

    .container {
      max-width: 900px;
      margin: 24px auto;
      padding: 0 24px;
    }

    .card {
      background: var(--white);
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 24px;
      margin-bottom: 24px;
    }

    .card h2 {
      font-size: 18px;
      margin-bottom: 16px;
      color: var(--dark);
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }

    .btn-primary {
      background: var(--gold);
      color: var(--dark);
    }

    .btn-primary:hover {
      background: #f59e0b;
    }

    .btn-secondary {
      background: var(--gray-light);
      color: var(--dark);
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-danger {
      background: var(--red);
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-small {
      padding: 4px 10px;
      font-size: 12px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid var(--gray-light);
    }

    th {
      font-weight: 600;
      color: var(--gray);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .role-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .role-admin {
      background: var(--gold-light);
      color: #92400e;
    }

    .role-editor {
      background: #dbeafe;
      color: #1e40af;
    }

    .role-viewer {
      background: var(--gray-light);
      color: var(--gray);
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    /* Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 100;
    }

    .modal-overlay.open {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal {
      background: var(--white);
      border-radius: 8px;
      padding: 24px;
      width: 100%;
      max-width: 400px;
      margin: 16px;
    }

    .modal h3 {
      margin-bottom: 16px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 4px;
      color: var(--gray);
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--gold);
    }

    .modal-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .error-message {
      color: var(--red);
      font-size: 13px;
      margin-top: 8px;
    }

    .you-badge {
      background: var(--green);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      margin-left: 8px;
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>User Management</h1>
    <div class="header-right">
      <a href="/" class="back-link">&larr; Back to Coalition Tracker</a>
      <div class="user-info">
        <span class="user-name" id="user-name"></span>
        <button class="logout-btn" onclick="logout()">Logout</button>
      </div>
    </div>
  </div>

  <div class="container">
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2>Users</h2>
        <button class="btn btn-primary" onclick="openAddModal()">Add User</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="users-table">
          <tr><td colspan="4">Loading...</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Role Permissions</h2>
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>View Data</th>
            <th>Add/Edit</th>
            <th>Delete</th>
            <th>Manage Users</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="role-badge role-viewer">Viewer</span></td>
            <td>Yes</td>
            <td>No</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td><span class="role-badge role-editor">Editor</span></td>
            <td>Yes</td>
            <td>Yes</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td><span class="role-badge role-admin">Admin</span></td>
            <td>Yes</td>
            <td>Yes</td>
            <td>Yes</td>
            <td>Yes</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Add/Edit Modal -->
  <div class="modal-overlay" id="user-modal">
    <div class="modal">
      <h3 id="modal-title">Add User</h3>
      <form id="user-form" onsubmit="saveUser(event)">
        <input type="hidden" id="user-id">
        <div class="form-group">
          <label for="display_name">Display Name</label>
          <input type="text" id="display_name" required>
        </div>
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" required>
        </div>
        <div class="form-group">
          <label for="password">Password <span id="password-hint" style="font-weight: normal; color: var(--gray);">(leave blank to keep current)</span></label>
          <input type="password" id="password">
        </div>
        <div class="form-group">
          <label for="role">Role</label>
          <select id="role">
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="error-message" id="form-error"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const currentUser = ${userJson};
    let users = [];

    // Initialize
    document.getElementById('user-name').textContent = currentUser?.display_name || '';
    loadUsers();

    async function loadUsers() {
      try {
        const res = await fetch('/api/users');
        users = await res.json();
        renderUsers();
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    }

    function renderUsers() {
      const tbody = document.getElementById('users-table');
      tbody.innerHTML = users.map(u => \`
        <tr>
          <td>
            \${escapeHtml(u.display_name)}
            \${u.id === currentUser.id ? '<span class="you-badge">YOU</span>' : ''}
          </td>
          <td>\${escapeHtml(u.username)}</td>
          <td><span class="role-badge role-\${u.role}">\${u.role}</span></td>
          <td class="actions">
            <button class="btn btn-secondary btn-small" onclick="editUser(\${u.id})">Edit</button>
            \${u.id !== currentUser.id ? \`<button class="btn btn-danger btn-small" onclick="deleteUser(\${u.id})">Delete</button>\` : ''}
          </td>
        </tr>
      \`).join('');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function openAddModal() {
      document.getElementById('modal-title').textContent = 'Add User';
      document.getElementById('user-id').value = '';
      document.getElementById('display_name').value = '';
      document.getElementById('username').value = '';
      document.getElementById('username').disabled = false;
      document.getElementById('password').value = '';
      document.getElementById('password').required = true;
      document.getElementById('password-hint').style.display = 'none';
      document.getElementById('role').value = 'viewer';
      document.getElementById('form-error').textContent = '';
      document.getElementById('user-modal').classList.add('open');
    }

    function editUser(id) {
      const user = users.find(u => u.id === id);
      if (!user) return;

      document.getElementById('modal-title').textContent = 'Edit User';
      document.getElementById('user-id').value = user.id;
      document.getElementById('display_name').value = user.display_name;
      document.getElementById('username').value = user.username;
      document.getElementById('username').disabled = true;
      document.getElementById('password').value = '';
      document.getElementById('password').required = false;
      document.getElementById('password-hint').style.display = 'inline';
      document.getElementById('role').value = user.role;
      document.getElementById('form-error').textContent = '';
      document.getElementById('user-modal').classList.add('open');
    }

    function closeModal() {
      document.getElementById('user-modal').classList.remove('open');
    }

    async function saveUser(e) {
      e.preventDefault();
      const id = document.getElementById('user-id').value;
      const data = {
        display_name: document.getElementById('display_name').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
      };

      // Don't send empty password on edit
      if (id && !data.password) {
        delete data.password;
      }

      try {
        const url = id ? \`/api/users/\${id}\` : '/api/users';
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!res.ok) {
          const err = await res.json();
          document.getElementById('form-error').textContent = err.error || 'Failed to save user';
          return;
        }

        closeModal();
        loadUsers();
      } catch (err) {
        document.getElementById('form-error').textContent = 'Failed to save user';
      }
    }

    async function deleteUser(id) {
      const user = users.find(u => u.id === id);
      if (!confirm(\`Delete user "\${user?.display_name}"?\`)) return;

      try {
        const res = await fetch(\`/api/users/\${id}\`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Failed to delete user');
          return;
        }
        loadUsers();
      } catch (err) {
        alert('Failed to delete user');
      }
    }

    async function logout() {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    }
  </script>
</body>
</html>`;
}
