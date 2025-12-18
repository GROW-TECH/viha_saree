import express from "express";
import { db } from "../db.js";
import { v4 as uuid } from "uuid";

const router = express.Router();

/* GET ALL PURCHASES */
router.get("/", async (req, res) => {
  const [rows] = await db.query(`
    SELECT
      id,
      date,
      product_code AS productCode,
      product_name AS productName,
      quantity
    FROM purchases
    ORDER BY created_at DESC
  `);
  res.json(rows);
});

/* CREATE PURCHASE → ADD STOCK */
router.post("/", async (req, res) => {
  const { date, productCode, productName, quantity } = req.body;
  const qty = Number(quantity);

  await db.query(
    `INSERT INTO purchases
     (id, date, product_code, product_name, quantity)
     VALUES (?, ?, ?, ?, ?)`,
    [uuid(), date, productCode, productName, qty]
  );

  // ✅ ADD STOCK
  await db.query(
    "UPDATE materials SET stock = stock + ? WHERE material_code=?",
    [qty, productCode]
  );

  res.json({ success: true });
});

/* UPDATE PURCHASE → ADJUST STOCK */
router.put("/:id", async (req, res) => {
  const { date, productCode, productName, quantity } = req.body;
  const newQty = Number(quantity);

  // 🔹 GET OLD QUANTITY
  const [[oldPurchase]] = await db.query(
    "SELECT quantity FROM purchases WHERE id=?",
    [req.params.id]
  );

  const diff = newQty - oldPurchase.quantity;

  await db.query(
    `UPDATE purchases SET
      date=?,
      product_code=?,
      product_name=?,
      quantity=?
     WHERE id=?`,
    [date, productCode, productName, newQty, req.params.id]
  );

  // ✅ ADJUST STOCK
  await db.query(
    "UPDATE materials SET stock = stock + ? WHERE material_code=?",
    [diff, productCode]
  );

  res.json({ success: true });
});

/* DELETE PURCHASE → ROLLBACK STOCK */
router.delete("/:id", async (req, res) => {
  const [[row]] = await db.query(
    "SELECT quantity, product_code FROM purchases WHERE id=?",
    [req.params.id]
  );

  await db.query("DELETE FROM purchases WHERE id=?", [req.params.id]);

  // ✅ SUBTRACT STOCK
  await db.query(
    "UPDATE materials SET stock = stock - ? WHERE material_code=?",
    [row.quantity, row.product_code]
  );

  res.json({ success: true });
});

export default router;
