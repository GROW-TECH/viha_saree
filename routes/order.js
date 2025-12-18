import express from "express";
import { db } from "../db.js";
import { v4 as uuid } from "uuid";
import multer from "multer";
import QRCode from "qrcode";

const router = express.Router();

/* ---------- MULTER ---------- */
const storage = multer.diskStorage({
  destination: "uploads/orders",
  filename: (req, file, cb) => {
    cb(null, uuid() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

/* ================= GET ORDERS ================= */
router.get("/", async (req, res) => {
  const [orders] = await db.query(
    "SELECT * FROM orders ORDER BY created_at DESC"
  );

  for (const o of orders) {
    const [items] = await db.query(
      `SELECT 
        oi.item_id AS materialId,
        m.material_name AS materialName,
        oi.qty
       FROM order_items oi
       JOIN materials m ON m.id = oi.item_id
       WHERE oi.order_id=? AND oi.item_type='MATERIAL'`,
      [o.id]
    );
    o.items = items;
  }

  res.json(orders);
});

/* ================= CREATE ORDER ================= */
router.post("/", async (req, res) => {
  const { orderDate, customerName, salary, productQty, items } = req.body;
  const orderId = uuid();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // stock check
    for (const i of items) {
      const [[mat]] = await conn.query(
        "SELECT stock FROM materials WHERE id=? FOR UPDATE",
        [i.materialId]
      );
      if (!mat || mat.stock < i.qty) {
        throw new Error("Insufficient stock");
      }
    }

    // insert order
    await conn.query(
      `INSERT INTO orders 
       (id, order_date, customer_name, salary, product_qty, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [orderId, orderDate, customerName, salary || 0, productQty || 0]
    );

    // insert materials + deduct stock
    for (const i of items) {
      await conn.query(
        `INSERT INTO order_items
         (id, order_id, item_type, item_id, qty)
         VALUES (?, ?, 'MATERIAL', ?, ?)`,
        [uuid(), orderId, i.materialId, i.qty]
      );

      await conn.query(
        "UPDATE materials SET stock = stock - ? WHERE id=?",
        [i.qty, i.materialId]
      );
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
});

/* ================= UPDATE ORDER ================= */
router.put("/:id", async (req, res) => {
  const { orderDate, customerName, salary, productQty, items } = req.body;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // rollback old stock
    const [oldItems] = await conn.query(
      "SELECT item_id, qty FROM order_items WHERE order_id=?",
      [req.params.id]
    );

    for (const i of oldItems) {
      await conn.query(
        "UPDATE materials SET stock = stock + ? WHERE id=?",
        [i.qty, i.item_id]
      );
    }

    await conn.query("DELETE FROM order_items WHERE order_id=?", [
      req.params.id,
    ]);

    // stock check again
    for (const i of items) {
      const [[mat]] = await conn.query(
        "SELECT stock FROM materials WHERE id=? FOR UPDATE",
        [i.materialId]
      );
      if (!mat || mat.stock < i.qty) {
        throw new Error("Insufficient stock");
      }
    }

    // update order
    await conn.query(
      `UPDATE orders 
       SET order_date=?, customer_name=?, salary=?, product_qty=?
       WHERE id=?`,
      [orderDate, customerName, salary || 0, productQty || 0, req.params.id]
    );

    // insert new items
    for (const i of items) {
      await conn.query(
        `INSERT INTO order_items
         (id, order_id, item_type, item_id, qty)
         VALUES (?, ?, 'MATERIAL', ?, ?)`,
        [uuid(), req.params.id, i.materialId, i.qty]
      );

      await conn.query(
        "UPDATE materials SET stock = stock - ? WHERE id=?",
        [i.qty, i.materialId]
      );
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
});

/* ================= COMPLETE ORDER ================= */
router.post(
  "/:id/complete",
  upload.array("images"),
  async (req, res) => {
    const { items, productCount } = req.body;
    const parsedItems = JSON.parse(items);
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // material returns
      for (const i of parsedItems) {
        if (i.returnQty && i.returnQty > 0) {
          await conn.query(
            "UPDATE materials SET stock = stock + ? WHERE id=?",
            [i.returnQty, i.materialId]
          );
        }
      }

      await conn.query(
        `UPDATE orders
         SET status='COMPLETED', product_count=?
         WHERE id=?`,
        [productCount || 0, req.params.id]
      );

      await conn.commit();
      res.json({ success: true });
    } catch (err) {
      await conn.rollback();
      res.status(400).json({ error: err.message });
    } finally {
      conn.release();
    }
  }
);

/* ================= DELETE ORDER ================= */
router.delete("/:id", async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [items] = await conn.query(
      "SELECT item_id, qty FROM order_items WHERE order_id=?",
      [req.params.id]
    );

    for (const i of items) {
      await conn.query(
        "UPDATE materials SET stock = stock + ? WHERE id=?",
        [i.qty, i.item_id]
      );
    }

    await conn.query("DELETE FROM order_items WHERE order_id=?", [
      req.params.id,
    ]);
    await conn.query("DELETE FROM orders WHERE id=?", [req.params.id]);

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

/* ================= COMPLETED ORDERS ================= */
router.get("/completed", async (req, res) => {
  const [orders] = await db.query(
    "SELECT * FROM orders WHERE status='COMPLETED' ORDER BY created_at DESC"
  );

  for (const o of orders) {
    const [items] = await db.query(
      `SELECT 
        oi.item_id AS materialId,
        m.material_name AS materialName,
        oi.qty
       FROM order_items oi
       JOIN materials m ON m.id = oi.item_id
       WHERE oi.order_id=?`,
      [o.id]
    );
    o.items = items;
  }

  res.json(orders);
});

/* ================= ORDER QR ================= */
router.get("/:id/qr", async (req, res) => {
  const orderId = req.params.id;

  const qrData = JSON.stringify({
    orderId,
    type: "ORDER",
  });

  try {
    const qr = await QRCode.toDataURL(qrData);
    res.json({ qr });
  } catch {
    res.status(500).json({ error: "QR generation failed" });
  }
});

/* ================= BULK SAREE QR ================= */
router.get("/:id/saree-qr", async (req, res) => {
  const orderId = req.params.id;

  try {
    const [[order]] = await db.query(
      "SELECT customer_name, order_date, product_count FROM orders WHERE id=?",
      [orderId]
    );

    if (!order || !order.product_count) {
      return res.status(400).json({ error: "Invalid saree count" });
    }

    const qrs = [];

    for (let i = 1; i <= order.product_count; i++) {
      const qrData = JSON.stringify({
        orderId,
        sareeNo: i,
        total: order.product_count,
        customer: order.customer_name,
        date: order.order_date,
      });

      const qr = await QRCode.toDataURL(qrData);
      qrs.push(qr);
    }

    res.json({ qrs });
  } catch (err) {
    res.status(500).json({ error: "QR generation failed" });
  }
});

router.post("/orders/mark-delivered", async (req, res) => {
  const { orderId } = req.body; // Extract the order ID from the request body

  try {
    // Query your database to update the order status to "DELIVERED"
    const result = await db.query("UPDATE orders SET status = 'DELIVERED' WHERE id = ?", [orderId]);
    
    // If the order was successfully updated, return a success response
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      // If no rows were affected, return an error response
      res.status(400).json({ error: "Order not found or already delivered." });
    }
  } catch (err) {
    // Handle any errors that occur during the process
    res.status(500).json({ error: "Error updating the order status." });
  }
});


export default router;
