const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieParser = require("cookie-parser")
require("dotenv").config()

// Import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")

const app = express()

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
)

app.use(express.json())
app.use(cookieParser())

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/auth-app")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)


// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Server is running!",
    googleOAuth: {
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : "Not set",
    },
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something went wrong!" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📍 Google OAuth callback URL: http://localhost:${PORT}/api/auth/google/callback`)
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`)

  // Validate environment
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("\n⚠️  Google OAuth not configured!")
    console.log("   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file")
    console.log("   See setup instructions below...\n")
  }
})
