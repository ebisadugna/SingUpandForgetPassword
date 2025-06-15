const jwt = require("jsonwebtoken")

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" })
}

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
}

module.exports = { generateToken, verifyToken }
