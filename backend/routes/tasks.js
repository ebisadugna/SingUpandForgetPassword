const express = require("express");
const multer = require("multer");
const path = require("path");
const Task = require("../models/Task");
const { auth, adminAuth } = require("../middleware/auth");

const router = express.Router();

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// POST /api/tasks/upload (admin only)
router.post("/upload", auth, adminAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const task = new Task({
      imageUrl,
      originalName: req.file.originalname,
    });
    await task.save();
    res.status(201).json({ message: "Image uploaded", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/tasks - list all tasks (images)
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router; 