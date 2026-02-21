const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");
  if (!token) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function register(req, res) {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  const trimmedName = String(name).trim();
  if (!trimmedEmail || !trimmedName) {
    return res.status(400).json({ error: "Name and email must not be empty" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(trimmedEmail);
    if (existing) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const info = db
      .prepare(
        "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)"
      )
      .run(trimmedEmail, trimmedName, hash);

    const user = {
      id: info.lastInsertRowid,
      email: trimmedEmail,
      name: trimmedName,
    };
    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error("Register error", err);
    return res.status(500).json({ error: "Failed to register" });
  }
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const trimmedEmail = String(email).trim().toLowerCase();

  try {
    const row = db
      .prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?")
      .get(trimmedEmail);
    if (!row) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = { id: row.id, email: row.email, name: row.name };
    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({ error: "Failed to login" });
  }
}

module.exports = {
  authMiddleware,
  register,
  login,
};

