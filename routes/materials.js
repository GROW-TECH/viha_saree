import express from "express";
import { db } from "../db.js";
import { v4 as uuid } from "uuid";

const router = express.Router();

/* GET all materials */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM materials ORDER BY created_at DESC"
    );
    console.log(rows);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/get-material", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM materials ORDER BY created_at DESC"
    );
    console.log(rows);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* CREATE material */
router.post("/", async (req, res) => {
  try {
    const { materialCode, materialName, description, color } = req.body;

    const id = uuid();
    await db.query(
      `INSERT INTO materials 
       (id, material_code, material_name, description, color) 
       VALUES (?,?,?,?,?)`,
      [id, materialCode, materialName, description, color]
    );

    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* UPDATE material */
router.put("/:id", async (req, res) => {
  try {
    const { materialName, description, color } = req.body;

    await db.query(
      `UPDATE materials 
       SET material_name=?, description=?, color=? 
       WHERE id=?`,
      [materialName, description, color, req.params.id]
    );

    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE material */
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM materials WHERE id=?", [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
