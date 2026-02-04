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
   REGISTER
   ========================= */
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).send("Missing");

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

/* =========================
   LOGIN
   ========================= */
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (!user) return res.status(401).send("Invalid");

      if (user.banned) return res.status(403).send("Banned");

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).send("Invalid");

      req.session.userId = user.id;
      req.session.role = user.role;

      res.send("OK");
    }
  );
});

/* =========================
   WHO AM I
   ========================= */
app.get("/api/me", (req, res) => {
  if (!req.session.userId) return res.json(null);

  res.json({
    id: req.session.userId,
    role: req.session.role
  });
});

/* =========================
   SERVER
   ========================= */
app.listen(3000, () =>
  console.log("Access Point Server running on http://localhost:3000")
);
