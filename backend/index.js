require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./db");
const { authMiddleware, register, login } = require("./auth");
const {
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
} = require("./quotations");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: true,
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  const row = db.prepare("SELECT 1 AS ok").get();
  return res.json({ status: "ok", db: !!row });
});

// Auth
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);

// Quotations (protected)
app.get("/api/quotations", authMiddleware, listQuotations);
app.get("/api/quotations/:id", authMiddleware, getQuotation);
app.post("/api/quotations", authMiddleware, createQuotation);
app.put("/api/quotations/:id", authMiddleware, updateQuotation);
app.delete("/api/quotations/:id", authMiddleware, deleteQuotation);

app.use((err, req, res, next) => {
  console.error("Unexpected error", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`);
});

