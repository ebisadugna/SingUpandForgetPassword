const express = require("express")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const { generateToken } = require("../utils/jwt")
const { auth } = require("../middleware/auth")
const { validateGoogleOAuthConfig, getGoogleOAuthUrls } = require("../config/google-oauth")

const router = express.Router()

const {
  forgotPassword,
  resetPassword,
  verifyResetPassword,
} = require("../controllers/authController");



// Validate Google OAuth config on startup
if (!validateGoogleOAuthConfig()) {
  console.error("⚠️  Google OAuth will not work without proper configuration")
}

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
  try {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("❌ Google OAuth not configured")
      return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=oauth_not_configured`)
    }

    const { redirectUri } = getGoogleOAuthUrls(req)

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    googleAuthUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID)
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri)
    googleAuthUrl.searchParams.set("response_type", "code")
    googleAuthUrl.searchParams.set("scope", "profile email")
    googleAuthUrl.searchParams.set("access_type", "offline")
    googleAuthUrl.searchParams.set("prompt", "consent")

    console.log("🔗 Google OAuth URL:", googleAuthUrl.toString())
    console.log("📍 Redirect URI:", redirectUri)

    res.redirect(googleAuthUrl.toString())
  } catch (error) {
    console.error("Google OAuth initiate error:", error)
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=oauth_error`)
  }
})

// Google OAuth callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code, error } = req.query
    const { redirectUri, clientUrl } = getGoogleOAuthUrls(req)

    if (error) {
      console.error("❌ Google OAuth error:", error)
      return res.redirect(`${clientUrl}/login?error=oauth_failed`)
    }

    if (!code) {
      console.error("❌ No authorization code received")
      return res.redirect(`${clientUrl}/login?error=oauth_failed`)
    }

    console.log("✅ Received authorization code, exchanging for tokens...")
    console.log("📍 Using redirect URI:", redirectUri)

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
        redirect_uri: redirectUri,
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok || !tokens.access_token) {
      console.error("❌ Failed to get access token:", tokens)
      return res.redirect(`${clientUrl}/login?error=oauth_failed`)
    }

    console.log("✅ Successfully obtained access token")

    // Get user info from Google
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`,
    )
    const googleUser = await userResponse.json()

    if (!userResponse.ok) {
      console.error("❌ Failed to get user info:", googleUser)
      return res.redirect(`${clientUrl}/login?error=oauth_failed`)
    }

    console.log("✅ Google user info received:", {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
    })

    // Check if user already exists with Google ID
    let user = await User.findOne({ googleId: googleUser.id })

    if (user) {
      console.log("✅ Existing Google user found:", user.email)
    } else {
      // Check if user exists with same email
      user = await User.findOne({ email: googleUser.email })

      if (user) {
        // Link Google account to existing user
        console.log("🔗 Linking Google account to existing user:", user.email)
        user.googleId = googleUser.id
        user.avatar = googleUser.picture || ""
        await user.save()
      } else {
        // Check if this is the first user (should be admin)
        const userCount = await User.countDocuments()
        const role = userCount === 0 ? "admin" : "user"

        console.log("👤 Creating new Google user. Total users:", userCount, "Role:", role)

        // Create new user
        user = new User({
          googleId: googleUser.id,
          name: googleUser.name,
          email: googleUser.email,
          avatar: googleUser.picture || "",
          role: role,
        })

        await user.save()
        console.log("✅ New Google user created:", user.email)
      }
    }

    // Generate token
    const token = generateToken(user._id)

    // Redirect to frontend with token
    const redirectUrl = `${clientUrl}/auth/callback?token=${token}`
    console.log("🔄 Redirecting to:", redirectUrl)

    res.redirect(redirectUrl)
  } catch (error) {
    console.error("❌ Google OAuth callback error:", error)
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

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/verify-reset-code", verifyResetPassword);

module.exports = router
