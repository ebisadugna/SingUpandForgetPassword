const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema); 