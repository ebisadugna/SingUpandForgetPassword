// Google OAuth configuration helper
const validateGoogleOAuthConfig = () => {
  const requiredEnvVars = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]
  const missing = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    console.error("❌ Missing required Google OAuth environment variables:")
    missing.forEach((varName) => {
      console.error(`   - ${varName}`)
    })
    console.error("\n📝 Please check your .env file and Google Cloud Console setup")
    return false
  }

  console.log("✅ Google OAuth configuration validated")
  console.log(`   Client ID: ${process.env.GOOGLE_CLIENT_ID?.substring(0, 20)}...`)
  return true
}

const getGoogleOAuthUrls = (req) => {
  const baseUrl =
    process.env.NODE_ENV === "production" ? process.env.PRODUCTION_URL : `${req.protocol}://${req.get("host")}`

  return {
    redirectUri: `${baseUrl}/api/auth/google/callback`,
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  }
}

module.exports = {
  validateGoogleOAuthConfig,
  getGoogleOAuthUrls,
}
