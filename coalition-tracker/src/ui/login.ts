export function getLoginHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - LIFT Philly Coalition Tracker</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #1e293b;
      --gold: #fbbf24;
      --gold-dark: #d97706;
      --white: #ffffff;
      --bg: #f8fafc;
      --text: #1e293b;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --error: #dc2626;
      --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--font-body);
      background: var(--bg);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .login-container {
      background: var(--white);
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }

    .logo {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 4px;
    }

    .logo p {
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
    }

    .form-group input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      font-family: var(--font-body);
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--gold);
      box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.15);
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: var(--error);
      padding: 12px;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 20px;
      display: none;
    }

    .error-message.show {
      display: block;
    }

    .btn {
      width: 100%;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-primary {
      background: var(--gold);
      color: var(--navy);
    }

    .btn-primary:hover {
      background: var(--gold-dark);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="logo">
      <h1>LIFT Philly</h1>
      <p>Coalition Tracker</p>
    </div>

    <div class="error-message" id="error-message"></div>

    <form id="login-form">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autocomplete="username" autofocus>
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="current-password">
      </div>

      <button type="submit" class="btn btn-primary" id="submit-btn">Sign In</button>
    </form>
  </div>

  <script>
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('error-message');
    const submitBtn = document.getElementById('submit-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      errorDiv.classList.remove('show');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
          window.location.href = '/';
        } else {
          errorDiv.textContent = data.error || 'Login failed';
          errorDiv.classList.add('show');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      } catch (err) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  </script>
</body>
</html>`;
}
