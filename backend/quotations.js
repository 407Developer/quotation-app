const db = require("./db");

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    dateISO: row.date_iso,
    items: JSON.parse(row.items_json),
    total: row.total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listQuotations(req, res) {
  const rows = db
    .prepare(
      "SELECT id, title, date_iso, items_json, total, created_at, updated_at FROM quotations WHERE user_id = ? ORDER BY created_at DESC"
    )
    .all(req.user.id);
  return res.json(rows.map(mapRow));
}

function getQuotation(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  const row = db
    .prepare(
      "SELECT id, title, date_iso, items_json, total, created_at, updated_at FROM quotations WHERE id = ? AND user_id = ?"
    )
    .get(id, req.user.id);
  if (!row) {
    return res.status(404).json({ error: "Quotation not found" });
  }
  return res.json(mapRow(row));
}

function createQuotation(req, res) {
  const { title, dateISO, items, total } = req.body || {};

  if (!title || !Array.isArray(items)) {
    return res.status(400).json({ error: "Title and items are required" });
  }

  const safeTitle = String(title).trim().slice(0, 200);
  const safeDate = dateISO ? String(dateISO) : new Date().toISOString();
  const numericTotal = Number.isFinite(Number(total)) ? Math.round(Number(total)) : 0;

  try {
    const info = db
      .prepare(
        "INSERT INTO quotations (user_id, title, date_iso, items_json, total, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
      )
      .run(
        req.user.id,
        safeTitle,
        safeDate,
        JSON.stringify(items),
        numericTotal
      );

    const row = db
      .prepare(
        "SELECT id, title, date_iso, items_json, total, created_at, updated_at FROM quotations WHERE id = ?"
      )
      .get(info.lastInsertRowid);

    return res.status(201).json(mapRow(row));
  } catch (err) {
    console.error("Create quotation error", err);
    return res.status(500).json({ error: "Failed to create quotation" });
  }
}

function updateQuotation(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const existing = db
    .prepare(
      "SELECT id FROM quotations WHERE id = ? AND user_id = ?"
    )
    .get(id, req.user.id);

  if (!existing) {
    return res.status(404).json({ error: "Quotation not found" });
  }

  const { title, dateISO, items, total } = req.body || {};

  if (!title || !Array.isArray(items)) {
    return res.status(400).json({ error: "Title and items are required" });
  }

  const safeTitle = String(title).trim().slice(0, 200);
  const safeDate = dateISO ? String(dateISO) : new Date().toISOString();
  const numericTotal = Number.isFinite(Number(total)) ? Math.round(Number(total)) : 0;

  try {
    db.prepare(
      "UPDATE quotations SET title = ?, date_iso = ?, items_json = ?, total = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
    ).run(
      safeTitle,
      safeDate,
      JSON.stringify(items),
      numericTotal,
      id,
      req.user.id
    );

    const row = db
      .prepare(
        "SELECT id, title, date_iso, items_json, total, created_at, updated_at FROM quotations WHERE id = ?"
      )
      .get(id);

    return res.json(mapRow(row));
  } catch (err) {
    console.error("Update quotation error", err);
    return res.status(500).json({ error: "Failed to update quotation" });
  }
}

function deleteQuotation(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const info = db
    .prepare("DELETE FROM quotations WHERE id = ? AND user_id = ?")
    .run(id, req.user.id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Quotation not found" });
  }

  return res.status(204).send();
}

module.exports = {
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
};

