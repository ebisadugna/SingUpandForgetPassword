const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const JwtStrategy = require("passport-jwt").Strategy
const ExtractJwt = require("passport-jwt").ExtractJwt
const User = require("../models/User")

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || "your-secret-key",
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id)
        if (user) {
          return done(null, user)
        }
        return done(null, false)
      } catch (error) {
        return done(error, false)
      }
    },
  ),
)

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google OAuth Profile:", profile)

        // Check if user already exists with Google ID
        let user = await User.findOne({ googleId: profile.id })

        if (user) {
          console.log("Existing Google user found:", user.email)
          return done(null, user)
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value })

        if (user) {
          // Link Google account to existing user
          console.log("Linking Google account to existing user:", user.email)
          user.googleId = profile.id
          if (profile.photos && profile.photos.length > 0) {
            user.avatar = profile.photos[0].value
          }
          await user.save()
          return done(null, user)
        }

        // Check if this is the first user (should be admin)
        const userCount = await User.countDocuments()
        const role = userCount === 0 ? "admin" : "user"

        console.log("Creating new Google user. Total users:", userCount, "Role:", role)

        // Create new user
        user = new User({
          googleId: profile.id,
          name: profile.displayName || profile.name?.givenName + " " + profile.name?.familyName,
          email: profile.emails[0].value,
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "",
          role: role,
        })

        await user.save()
        console.log("New Google user created:", user.email)
        done(null, user)
      } catch (error) {
        console.error("Google OAuth error:", error)
        done(error, null)
      }
    },
  ),
)

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})

module.exports = passport
