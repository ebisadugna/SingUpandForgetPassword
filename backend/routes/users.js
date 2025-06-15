const express = require("express")
const User = require("../models/User")
const { auth, adminAuth } = require("../middleware/auth")

const router = express.Router()

// Get all users (Admin only)
router.get("/", adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 })
    res.json({ users })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Update user role (Admin only)
router.put("/:id/role", adminAuth, async (req, res) => {
  try {
    const { role } = req.body
    const userId = req.params.id

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" })
    }

    // Prevent admin from demoting themselves
    if (userId === req.user._id.toString() && role === "user") {
      return res.status(400).json({ message: "Cannot demote yourself" })
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ message: "User role updated", user })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Toggle user active status (Admin only)
router.put("/:id/status", adminAuth, async (req, res) => {
  try {
    const userId = req.params.id

    // Prevent admin from deactivating themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot deactivate yourself" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.isActive = !user.isActive
    await user.save()

    res.json({ message: "User status updated", user })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Delete user (Admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const userId = req.params.id

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete yourself" })
    }

    const user = await User.findByIdAndDelete(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
