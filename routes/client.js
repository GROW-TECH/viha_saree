import express from "express";
import { db } from "../db.js";
import { v4 as uuid } from "uuid";

const router = express.Router();

/* GET all clients */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM clients ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

/* CREATE client */
router.post("/", async (req, res) => {
  try {
    const { customerCode, customerName, phoneNumber, place } = req.body;

    const id = uuid();
    await db.query(
      "INSERT INTO clients (id, customer_code, customer_name, phone_number, place) VALUES (?,?,?,?,?)",
      [id, customerCode, customerName, phoneNumber, place]
    );

    console.log(customerCode, customerName, phoneNumber, place);
    res.status(201).json({ id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

/* UPDATE client */
router.put("/:id", async (req, res) => {
  try {
    const { customerName, phoneNumber, place } = req.body;

    await db.query(
      "UPDATE clients SET customer_name=?, phone_number=?, place=? WHERE id=?",
      [customerName, phoneNumber, place, req.params.id]
    );

    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE client */
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM clients WHERE id=?", [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
