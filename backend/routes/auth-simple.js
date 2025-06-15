const express = require("express")
const { body, validationResult } = require("express-validator")
const passport = require("passport")
const User = require("../models/User")
const { generateToken } = require("../utils/jwt")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Register
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { name, email, password } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
      }

      // Check if this is the first user (should be admin)
      const userCount = await User.countDocuments()
      const role = userCount === 0 ? "admin" : "user"

      // Create user
      const user = new User({
        name,
        email,
        password,
        role,
      })

      await user.save()

      // Generate token
      const token = generateToken(user._id)

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password } = req.body

      // Find user
      const user = await User.findOne({ email }).select("+password")
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" })
      }

      // Check password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" })
      }

      if (!user.isActive) {
        return res.status(400).json({ message: "Account is deactivated" })
      }

      // Generate token
      const token = generateToken(user._id)

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Google OAuth initiate
router.get("/google", (req, res) => {
  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get("host")}/api/auth/google/callback`)}&` +
    `response_type=code&` +
    `scope=profile email&` +
    `access_type=offline&` +
    `prompt=consent`

  console.log("Redirecting to Google OAuth:", googleAuthUrl)
  res.redirect(googleAuthUrl)
})

// Google OAuth callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query

    if (!code) {
      console.error("No authorization code received")
      return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=oauth_failed`)
    }

    console.log("Received authorization code, exchanging for tokens...")

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${req.protocol}://${req.get("host")}/api/auth/google/callback`,
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      console.error("Failed to get access token:", tokens)
      return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=oauth_failed`)
    }

    // Get user info from Google
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`,
    )
    const googleUser = await userResponse.json()

    console.log("Google user info:", googleUser)

    // Check if user already exists with Google ID
    let user = await User.findOne({ googleId: googleUser.id })

    if (user) {
      console.log("Existing Google user found:", user.email)
    } else {
      // Check if user exists with same email
      user = await User.findOne({ email: googleUser.email })

      if (user) {
        // Link Google account to existing user
        console.log("Linking Google account to existing user:", user.email)
        user.googleId = googleUser.id
        user.avatar = googleUser.picture || ""
        await user.save()
      } else {
        // Check if this is the first user (should be admin)
        const userCount = await User.countDocuments()
        const role = userCount === 0 ? "admin" : "user"

        console.log("Creating new Google user. Total users:", userCount, "Role:", role)

        // Create new user
        user = new User({
          googleId: googleUser.id,
          name: googleUser.name,
          email: googleUser.email,
          avatar: googleUser.picture || "",
          role: role,
        })

        await user.save()
        console.log("New Google user created:", user.email)
      }
    }

    // Generate token
    const token = generateToken(user._id)

    // Redirect to frontend with token
    const redirectUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/auth/callback?token=${token}`
    console.log("Redirecting to:", redirectUrl)

    res.redirect(redirectUrl)
  } catch (error) {
    console.error("Google OAuth callback error:", error)
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=oauth_error`)
  }
})

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Logout
router.post("/logout", auth, (req, res) => {
  res.json({ message: "Logged out successfully" })
})

module.exports = router
