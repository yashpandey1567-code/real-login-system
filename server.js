const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Database(path.join(__dirname, "users.db"));

/* =========================
   DATABASE
========================= */

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`).run();

/* =========================
   MIDDLEWARE
========================= */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "my-super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(express.static(__dirname));
app.use("/public", express.static(path.join(__dirname, "public")));

// 🎵 Music files
app.use("/music", express.static(path.join(__dirname, "public", "music")));
/* =========================
   LOGIN PAGE
========================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================
   REGISTER
========================= */

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.send(`
        <h2>Username aur password required hai.</h2>
        <a href="/">Back</a>
      `);
    }

    const existingUser = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username);

    if (existingUser) {
      return res.send(`
        <h2>Username already registered hai.</h2>
        <a href="/">Back</a>
      `);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.prepare(
      "INSERT INTO users (username, password) VALUES (?, ?)"
    ).run(username, hashedPassword);

    res.send(`
      <div style="
        font-family:Arial;
        text-align:center;
        margin-top:100px;
      ">
        <h1>Registration Successful ✅</h1>
        <p>Ab login karo.</p>
        <a href="/">Go to Login</a>
      </div>
    `);
  } catch (error) {
    console.error(error);

    res.status(500).send(`
      <h2>Registration failed.</h2>
      <a href="/">Back</a>
    `);
  }
});

/* =========================
   LOGIN
========================= */

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username);

    if (!user) {
      return res.send(`
        <div style="
          font-family:Arial;
          text-align:center;
          margin-top:100px;
        ">
          <h2>Invalid username or password ❌</h2>
          <a href="/">Try Again</a>
        </div>
      `);
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.send(`
        <div style="
          font-family:Arial;
          text-align:center;
          margin-top:100px;
        ">
          <h2>Invalid username or password ❌</h2>
          <a href="/">Try Again</a>
        </div>
      `);
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);

    res.status(500).send(`
      <h2>Login failed.</h2>
      <a href="/">Back</a>
    `);
  }
});

/* =========================
   AUTH MIDDLEWARE
========================= */

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/");
  }

  next();
}

/* =========================
   DASHBOARD
========================= */

app.get("/dashboard", requireLogin, (req, res) => {
  const username = req.session.username;
  const userId = req.session.userId;

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
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background: #f4f7fb;
  color: #1f2937;
  min-height: 100vh;
  transition: 0.3s;
}

body.dark {
  background: #111827;
  color: #f9fafb;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 250px;
  height: 100vh;
  background: #111827;
  color: white;
  padding: 25px 18px;
}

.logo {
  font-size: 25px;
  font-weight: bold;
  margin-bottom: 35px;
  padding-left: 10px;
}

.menu a {
  display: block;
  color: #d1d5db;
  text-decoration: none;
  padding: 14px 15px;
  margin-bottom: 8px;
  border-radius: 10px;
  transition: 0.2s;
}

.menu a:hover {
  background: #374151;
  color: white;
}

.menu .active {
  background: #2563eb;
  color: white;
}

.main {
  margin-left: 250px;
  padding: 30px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.welcome h1 {
  font-size: 30px;
  margin-bottom: 6px;
}

.welcome p {
  color: #6b7280;
}

.dark .welcome p {
  color: #9ca3af;
}

.clock {
  background: white;
  padding: 12px 18px;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.07);
  font-weight: bold;
}

.dark .clock {
  background: #1f2937;
}

.hero {
  background: linear-gradient(
    135deg,
    #2563eb,
    #7c3aed
  );

  color: white;
  border-radius: 20px;
  padding: 35px;
  margin-bottom: 25px;

  box-shadow: 0 12px 30px rgba(37,99,235,0.25);
}

.hero h2 {
  font-size: 28px;
  margin-bottom: 10px;
}

.hero p {
  opacity: 0.9;
  font-size: 16px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 25px;
}

.card {
  background: white;
  padding: 22px;
  border-radius: 16px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.06);
}

.dark .card {
  background: #1f2937;
  color: white;
}

.stat-title {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 10px;
}

.dark .stat-title {
  color: #9ca3af;
}

.stat-value {
  font-size: 25px;
  font-weight: bold;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.card h3 {
  margin-bottom: 18px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 13px 0;
  border-bottom: 1px solid #e5e7eb;
}

.dark .info-row {
  border-color: #374151;
}

.info-row:last-child {
  border-bottom: none;
}

.green {
  color: #16a34a;
  font-weight: bold;
}

.actions {
  display: grid;
  gap: 12px;
}

.action {
  text-decoration: none;
  padding: 15px;
  background: #f3f4f6;
  border-radius: 10px;
  color: #111827;
  transition: 0.2s;
}

.action:hover {
  background: #e5e7eb;
}

.dark .action {
  background: #374151;
  color: white;
}

.logout {
  margin-top: 25px;
}

.logout a {
  display: inline-block;
  background: #dc2626;
  color: white;
  text-decoration: none;
  padding: 13px 22px;
  border-radius: 10px;
}

.logout a:hover {
  background: #b91c1c;
}

.theme {
  border: none;
  cursor: pointer;
  background: #2563eb;
  color: white;
  padding: 11px 15px;
  border-radius: 10px;
  margin-top: 20px;
  width: 100%;
}

@media (max-width: 900px) {

  .sidebar {
    width: 200px;
  }

  .main {
    margin-left: 200px;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 650px) {

  .sidebar {
    position: relative;
    width: 100%;
    height: auto;
  }

  .main {
    margin-left: 0;
    padding: 18px;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .stats {
    grid-template-columns: 1fr;
  }

}

</style>

</head>

<body>

<aside class="sidebar">

  <div class="logo">
    My Dashboard
  </div>

  <div class="menu">

    <a href="/dashboard" class="active">
      🏠 Dashboard
    </a>

    <a href="/profile.html">
      👤 Profile
    </a>

    <a href="/settings">
      ⚙️ Settings
    </a>

    <a href="/account">
      💳 My Account
    </a>

  </div>

  <button class="theme" onclick="toggleTheme()">
    🌙 Toggle Theme
  </button>

</aside>


<main class="main">

  <div class="topbar">

    <div class="welcome">

      <h1>
        Hello, ${username} 👋
      </h1>

      <p>
        Welcome back to your dashboard.
      </p>

    </div>

    <div class="clock" id="clock">
      Loading...
    </div>

  </div>


  <section class="hero">

    <h2>
      Welcome to your Dashboard 🚀
    </h2>

    <p>
      Your account is active and everything is ready to use.
    </p>

  </section>


  <section class="stats">

    <div class="card">

      <div class="stat-title">
        Account ID
      </div>

      <div class="stat-value">
        #${userId}
      </div>

    </div>


    <div class="card">

      <div class="stat-title">
        Status
      </div>

      <div class="stat-value green">
        Active
      </div>

    </div>


    <div class="card">

      <div class="stat-title">
        Security
      </div>

      <div class="stat-value">
        🔒 Secure
      </div>

    </div>


    <div class="card">

      <div class="stat-title">
        Session
      </div>

      <div class="stat-value">
        Online
      </div>

    </div>

  </section>


  <section class="content-grid">

    <div class="card">

      <h3>
        Account Overview
      </h3>

      <div class="info-row">
        <span>Username</span>
        <strong>${username}</strong>
      </div>

      <div class="info-row">
        <span>Account ID</span>
        <strong>#${userId}</strong>
      </div>

      <div class="info-row">
        <span>Password</span>
        <span class="green">Protected</span>
      </div>

      <div class="info-row">
        <span>Login Session</span>
        <span class="green">Active</span>
      </div>

    </div>


    <div class="card">

      <h3>
        Quick Actions
      </h3>

      <div class="actions">

        <a class="action" href="/profile.html">
          👤 View Profile
        </a>

        <a class="action" href="/settings">
          ⚙️ Account Settings
        </a>

        <a class="action" href="/account">
          💳 My Account
        </a>

      </div>

    </div>

  </section>


  <div class="logout">

    <a href="/logout">
      Logout
    </a>

  </div>

</main>


<script>

function updateClock() {

  const now = new Date();

  const time = now.toLocaleTimeString();

  document.getElementById("clock").textContent = time;

}

updateClock();

setInterval(updateClock, 1000);


function toggleTheme() {

  document.body.classList.toggle("dark");

  if (
    document.body.classList.contains("dark")
  ) {

    localStorage.setItem(
      "theme",
      "dark"
    );

  } else {

    localStorage.setItem(
      "theme",
      "light"
    );

  }

}


if (
  localStorage.getItem("theme") === "dark"
) {

  document.body.classList.add("dark");

}

</script>

</body>

</html>
  `);
});

/* =========================
   SETTINGS
========================= */

app.get("/settings", requireLogin, (req, res) => {
  const username = req.session.username;

  res.send(`
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>Settings</title>

<style>

body {
  font-family: Arial;
  background: #f4f7fb;
  padding: 40px;
}

.container {
  max-width: 600px;
  margin: auto;
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.08);
}

h1 {
  margin-bottom: 10px;
}

input {
  width: 100%;
  padding: 13px;
  margin: 8px 0 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

button {
  padding: 12px 18px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.back {
  display: inline-block;
  margin-bottom: 25px;
  text-decoration: none;
}

.section {
  margin-top: 30px;
}

</style>

</head>

<body>

<div class="container">

<a class="back" href="/dashboard">
← Back to Dashboard
</a>

<h1>Settings ⚙️</h1>

<p>Logged in as <strong>${username}</strong></p>


<div class="section">

<h2>Change Username</h2>

<form method="POST" action="/change-username">

<input
type="text"
name="newUsername"
placeholder="New username"
required
>

<button type="submit">
Change Username
</button>

</form>

</div>


<div class="section">

<h2>Change Password</h2>

<form method="POST" action="/change-password">

<input
type="password"
name="currentPassword"
placeholder="Current password"
required
>

<input
type="password"
name="newPassword"
placeholder="New password"
required
>

<button type="submit">
Change Password
</button>

</form>

</div>

</div>

</body>

</html>
  `);
});

/* =========================
   CHANGE USERNAME
========================= */

app.post("/change-username", requireLogin, (req, res) => {
  const { newUsername } = req.body;

  if (!newUsername) {
    return res.send("New username required.");
  }

  try {
    db.prepare(
      "UPDATE users SET username = ? WHERE id = ?"
    ).run(newUsername, req.session.userId);

    req.session.username = newUsername;

    res.redirect("/settings");
  } catch (error) {
    res.send(`
      <h2>Username already exists.</h2>
      <a href="/settings">Back</a>
    `);
  }
});

/* =========================
   CHANGE PASSWORD
========================= */

app.post("/change-password", requireLogin, async (req, res) => {
  try {

    const {
      currentPassword,
      newPassword
    } = req.body;

    const user = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.session.userId);

    const correct = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!correct) {
      return res.send(`
        <h2>Current password incorrect ❌</h2>
        <a href="/settings">Back</a>
      `);
    }

    const newHash = await bcrypt.hash(
      newPassword,
      10
    );

    db.prepare(
      "UPDATE users SET password = ? WHERE id = ?"
    ).run(newHash, req.session.userId);

    res.send(`
      <div style="
        font-family:Arial;
        text-align:center;
        margin-top:100px;
      ">

        <h1>Password Changed Successfully ✅</h1>

        <a href="/dashboard">
          Go to Dashboard
        </a>

      </div>
    `);

  } catch (error) {

    console.error(error);

    res.status(500).send(
      "Password change failed."
    );

  }
});

/* =========================
   ACCOUNT
========================= */

app.get("/account", requireLogin, (req, res) => {

  const user = db
    .prepare(
      "SELECT id, username FROM users WHERE id = ?"
    )
    .get(req.session.userId);

  res.send(`
<!DOCTYPE html>

<html>

<head>

<title>My Account</title>

<style>

body {
  font-family: Arial;
  background: #f4f7fb;
  padding: 40px;
}

.box {
  max-width: 600px;
  margin: auto;
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.08);
}

a {
  text-decoration: none;
}

.row {
  padding: 15px 0;
  border-bottom: 1px solid #ddd;
}

</style>

</head>

<body>

<div class="box">

<a href="/dashboard">
← Dashboard
</a>

<h1>My Account 💳</h1>

<div class="row">
<strong>Username:</strong>
${user.username}
</div>

<div class="row">
<strong>Account ID:</strong>
#${user.id}
</div>

<div class="row">
<strong>Status:</strong>
Active
</div>

<div class="row">
<strong>Security:</strong>
Password Protected
</div>

</div>

</body>

</html>
  `);
});

/* =========================
   PROFILE
========================= */
app.get("/profile.html", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});
app.get("/profile", requireLogin, (req, res) => {

  const user = db
    .prepare(
      "SELECT id, username FROM users WHERE id = ?"
    )
    .get(req.session.userId);

  res.send(`
<!DOCTYPE html>

<html>

<head>

<title>Profile</title>

<style>

body {
  font-family: Arial;
  background: #f4f7fb;
  padding: 40px;
}

.profile {
  max-width: 600px;
  margin: auto;
  background: white;
  padding: 35px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 5px 20px rgba(0,0,0,0.08);
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: auto;
  font-size: 40px;
}

a {
  display: inline-block;
  margin-top: 20px;
  text-decoration: none;
}

</style>

</head>

<body>

<div class="profile">

<div class="avatar">
${user.username.charAt(0).toUpperCase()}
</div>

<h1>${user.username}</h1>

<p>Account ID: #${user.id}</p>

<p>Account Status: Active</p>

<a href="/dashboard">
← Back to Dashboard
</a>

</div>

</body>

</html>
  `);
});

/* =========================
   LOGOUT
========================= */

app.get("/logout", (req, res) => {

  req.session.destroy((err) => {

    if (err) {
      return res.send("Logout failed.");
    }

    res.redirect("/");

  });

});

/* =========================
   404
========================= */

app.use((req, res) => {

  res.status(404).send(`
    <div style="
      font-family:Arial;
      text-align:center;
      margin-top:100px;
    ">

      <h1>404</h1>

      <p>Page not found.</p>

      <a href="/">
        Go Home
      </a>

    </div>
  `);

});

/* =========================
   SERVER START
========================= */

app.listen(PORT, () => {

  console.log(
    `Server running at http://localhost:${PORT}`
  );

});