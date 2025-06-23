const express = require("express");
const Response = require("../models/Response");
const { auth, adminAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/responses (admin only)
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const responses = await Response.find()
      .populate("user", "name email")
      .populate("task", "originalName imageUrl");
    res.json({ responses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/responses/my - get responses for the current user
router.get("/my", auth, async (req, res) => {
  try {
    const responses = await Response.find({ user: req.user._id })
      .populate("user", "name email")
      .populate("task", "originalName imageUrl");
    res.json({ responses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/responses - user submits a response to a task
router.post("/", auth, async (req, res) => {
  try {
    const { taskId, response } = req.body;
    if (!taskId || !response) {
      return res.status(400).json({ message: "Task ID and response are required" });
    }
    const newResponse = new Response({
      user: req.user._id,
      task: taskId,
      response,
      status: "Pending",
    });
    await newResponse.save();
    res.status(201).json({ message: "Response submitted", response: newResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/responses/:id - admin updates response status
router.patch("/:id", auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const response = await Response.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email").populate("task", "originalName imageUrl");
    if (!response) {
      return res.status(404).json({ message: "Response not found" });
    }
    res.json({ message: "Status updated", response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router; 