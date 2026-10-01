const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const db = new Database("users.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`);

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "my-secret-key",
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(__dirname));

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = db.prepare(
    "SELECT * FROM users WHERE username = ?"
  ).get(username);

  if (!user) {
    return res.send("Username or password is incorrect.");
  }

  const passwordCorrect = bcrypt.compareSync(
    password,
    user.password
  );

  if (!passwordCorrect) {
    return res.send("Username or password is incorrect.");
  }

  req.session.userId = user.id;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard</title>

      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }

        body {
          min-height: 100vh;
          background: #f3f4f6;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .sidebar {
          position: fixed;
          left: 20px;
          top: 20px;
          width: 200px;
          padding: 25px 18px;
          background: white;
          border-radius: 18px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.10);
          text-align: left;
        }
.sidebar:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.14);
  transition: 0.2s;
}
        .sidebar h2 {
          color: #111827;
          font-size: 18px;
          margin-bottom: 20px;
        }

        .sidebar p {
          padding: 12px 10px;
          margin-bottom: 6px;
          border-radius: 10px;
          color: #6b7280;
          font-size: 14px;
        }
.sidebar p:hover {
  background: #eef2ff;
  color: #667eea;
  cursor: pointer;
  transform: translateX(4px);
  transition: 0.2s;
}
        .sidebar p:first-of-type {
          background: #667eea;
          color: white;
        }

        .dashboard {
          width: 450px;
          background: white;
          padding: 40px;
          border-radius: 22px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
        }

        .icon {
          font-size: 50px;
          margin-bottom: 15px;
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          margin: 0 auto 18px;
          border-radius: 50%;
          background: #667eea;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
        }

        h1 {
          color: #111827;
          margin-bottom: 8px;
        }

        .welcome-text {
          font-size: 14px;
          color: #9ca3af;
          margin-bottom: 22px;
        }

        .message {
          color: #6b7280;
          margin-bottom: 22px;
          line-height: 1.6;
        }

        .username {
          color: #667eea;
          font-weight: bold;
        }

        .account-card {
          display: flex;
          align-items: center;
          gap: 15px;
          text-align: left;
          padding: 16px;
          margin-bottom: 25px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
        }

        .account-icon {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          background: #667eea;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 22px;
        }

        .account-card strong {
          color: #111827;
        }

        .account-card p {
          color: #22a06b;
          font-size: 13px;
          margin-top: 4px;
        }

        .account-info {
          text-align: left;
          margin-top: 20px;
          margin-bottom: 25px;
          padding: 18px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
        }

        .account-info h2 {
          font-size: 16px;
          color: #111827;
          margin-bottom: 15px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-row span {
          color: #6b7280;
        }

        .info-row strong {
          color: #111827;
        }

        .info-row .status {
          color: #22a06b;
        }

        .logout {
          display: inline-block;
          padding: 12px 25px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 10px;
          font-weight: bold;
        }

        .logout:hover {
          opacity: 0.9;
        }

        @media (max-width: 800px) {
          .sidebar {
            display: none;
          }
        }
      </style>
    </head>

    <body>

      <div class="sidebar">
        <h2>My Account</h2>
        <p>🏠 Dashboard</p>
        <a href="/profile">👤 Profile</a>
        <a href="/settings">⚙️ Settings</a>
      </div>

      <div class="dashboard">

        <div class="icon">🎉</div>

        <h1>Welcome!</h1>

        <div class="profile-avatar">👤</div>

        <p class="welcome-text">
          Your personal dashboard
        </p>

        <p class="message">
          Hello
          <span class="username">${username}</span>,
          you are successfully logged in.
        </p>

        <div class="account-card">
          <div class="account-icon">👤</div>

          <div>
            <strong>${username}</strong>
            <p>Account secured ✓</p>
          </div>
        </div>

        <div class="account-info">
          <h2>Account Information</h2>

          <div class="info-row">
            <span>Username</span>
            <strong>${username}</strong>
          </div>

          <div class="info-row">
            <span>Status</span>
            <strong class="status">Active ✓</strong>
          </div>
        </div>

        <a class="logout" href="/logout">
          Logout
        </a>

      </div>

    </body>
    </html>
  `);
});
app.get("/settings", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }

  const user = db.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).get(req.session.userId);

  if (!user) {
    return res.redirect("/");
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Settings</title>

      <style>
        body {
          min-height: 100vh;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f3f4f6;
          font-family: Arial, sans-serif;
        }

        .settings {
          width: 400px;
          padding: 35px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
        }

        h1 {
          color: #111827;
          margin-bottom: 25px;
        }

        .setting-box {
          padding: 16px;
          margin-bottom: 15px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .setting-box span {
          color: #6b7280;
          font-size: 13px;
        }

        .setting-box strong {
          display: block;
          margin-top: 5px;
          color: #111827;
        }

        .back {
          display: inline-block;
          margin-top: 10px;
          padding: 12px 22px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 10px;
          font-weight: bold;
        }
      </style>
    </head>

    <body>

      <div class="settings">

        <h1>⚙️ Settings</h1>

        <div class="setting-box">
          <span>Username</span>
          <strong>${user.username}</strong>
        </div>

        <div class="setting-box">
          <span>Account Status</span>
          <strong>Active ✓</strong>
        </div>
<h2 style="margin-top: 25px; margin-bottom: 15px; color: #111827;">
  Change Password
</h2>

<form action="/change-password" method="POST">

  <input
    type="password"
    name="currentPassword"
    placeholder="Current password"
    required
    style="width: 100%; padding: 12px; margin-bottom: 10px; box-sizing: border-box;"
  >

  <input
    type="password"
    name="newPassword"
    placeholder="New password"
    required
    style="width: 100%; padding: 12px; margin-bottom: 10px; box-sizing: border-box;"
  >

  <button
    type="submit"
    style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 10px; font-weight: bold;"
  >
    Change Password
  </button>

</form>
<h2 style="margin-top: 25px; margin-bottom: 15px; color: #111827;">
  Change Username
</h2>

<form action="/change-username" method="POST">

  <input
    type="text"
    name="newUsername"
    placeholder="New username"
    required
    style="width: 100%; padding: 12px; margin-bottom: 10px; box-sizing: border-box;"
  >

  <input
    type="password"
    name="password"
    placeholder="Current password"
    required
    style="width: 100%; padding: 12px; margin-bottom: 10px; box-sizing: border-box;"
  >

  <button
    type="submit"
    style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 10px; font-weight: bold;"
  >
    Change Username
  </button>

</form>
        <a class="back" href="/">
          Back to Dashboard
        </a>

      </div>

    </body>
    </html>
  `);
});
app.get("/profile", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }

  const user = db.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).get(req.session.userId);

  if (!user) {
    return res.redirect("/");
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Profile</title>

      <style>
        body {
          min-height: 100vh;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f3f4f6;
          font-family: Arial, sans-serif;
        }

        .profile {
          width: 400px;
          padding: 35px;
          background: white;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
        }

        .avatar {
          width: 90px;
          height: 90px;
          margin: 0 auto 20px;
          border-radius: 50%;
          background: #667eea;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 40px;
        }

        h1 {
          color: #111827;
          margin-bottom: 25px;
        }

        .info {
          padding: 15px;
          background: #f8fafc;
          border-radius: 12px;
          text-align: left;
        }

        .info p {
          margin: 10px 0;
          color: #6b7280;
        }

        .info strong {
          color: #111827;
        }

        .back {
          display: inline-block;
          margin-top: 25px;
          padding: 12px 22px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 10px;
          font-weight: bold;
        }
      </style>
    </head>

    <body>

      <div class="profile">

        <div class="avatar">👤</div>

        <h1>My Profile</h1>

        <div class="info">
          <p>
            Username:
            <strong>${user.username}</strong>
          </p>

          <p>
            Status:
            <strong>Active ✓</strong>
          </p>
        </div>

        <a class="back" href="/">
          Back to Dashboard
        </a>

      </div>

    </body>
    </html>
  `);
});
app.post("/change-username", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }

  const { newUsername, password } = req.body;

  const user = db.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).get(req.session.userId);

  if (!user) {
    return res.redirect("/");
  }

  const passwordCorrect = bcrypt.compareSync(
    password,
    user.password
  );

  if (!passwordCorrect) {
    return res.send("Current password is incorrect.");
  }

  try {
    db.prepare(
      "UPDATE users SET username = ? WHERE id = ?"
    ).run(newUsername, user.id);

    res.send("Username changed successfully!");
  } catch (error) {
    res.send("Username already exists.");
  }
});
app.post("/change-password", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }

  const { currentPassword, newPassword } = req.body;

  const user = db.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).get(req.session.userId);

  if (!user) {
    return res.redirect("/");
  }

  const passwordCorrect = bcrypt.compareSync(
    currentPassword,
    user.password
  );

  if (!passwordCorrect) {
    return res.send("Current password is incorrect.");
  }

  const newHashedPassword = bcrypt.hashSync(newPassword, 10);

  db.prepare(
    "UPDATE users SET password = ? WHERE id = ?"
  ).run(newHashedPassword, user.id);

  res.send("Password changed successfully!");
});
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const stmt = db.prepare(
      "INSERT INTO users (username, password) VALUES (?, ?)"
    );

    const hashedPassword = bcrypt.hashSync(password, 10);

    stmt.run(username, hashedPassword);

    res.send("Account created successfully!");
  } catch (error) {
    res.send("Username already exists.");
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});