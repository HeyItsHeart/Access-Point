import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { db } from "./db.js";

const app = express();

app.use(express.json());

app.use(session({
  secret: "change-this-later",
  resave: false,
  saveUninitialized: false
}));

/* =========================
   AUTH ROUTES
   ========================= */

// Register
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).send("Missing fields");

  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hash],
    err => {
      if (err) return res.status(400).send("User exists");
      res.send("OK");
    }
  );
});

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (!user) return res.status(401).send("Invalid");

      if (user.banned)
        return res.status(403).send("Banned");

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).send("Invalid");

      req.session.userId = user.id;
      req.session.role = user.role;

      res.send("OK");
    }
  );
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.send("OK"));
});

// Me
app.get("/api/me", (req, res) => {
  if (!req.session.userId) return res.json(null);
  res.json({
    id: req.session.userId,
    role: req.session.role
  });
});

/* =========================
   SERVER START
   ========================= */

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`Access Point server running on port ${PORT}`)
);
