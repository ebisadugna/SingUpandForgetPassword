const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User"); // Adjust path as needed

// REGISTER USER
const register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// LOGIN USER
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        res.status(200).json({ token, user: { id: user._id, email: user.email, name: user.name } });
    } catch (err) {
        res.status(500).json({ message: "Login error" });
    }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log("Forgot password request for email:", email);

    try {
        const user = await User.findOne({ email });
        console.log("User found:", user);
        if (!user)
            return res.status(404).json({ message: "User with this email does not exist" });

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: "15m",
        });

        console.log("Generated token:", token);

        const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

        console.log("Reset link:", resetLink);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: user.email,
            subject: "Password Reset",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>`,
        });

        res.status(200).json({ message: "Password reset link sent to your email" });
    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ message: "Error sending reset link" });
    }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        res.status(200).json({ message: "Password has been reset successfully" });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(400).json({ message: "Invalid or expired token" });
    }
};

const verifyResetPassword = async (req, res) => {
  const { token } = req.body;
  console.log("Verifying reset token:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    if (!decoded || !decoded.email) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    res.status(200).json({ email: decoded.email });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.error("Token has expired.");
      return res.status(400).json({ message: "Reset token has expired. Please request a new one." });
    }

    console.error("Token verification failed:", err.message);
    return res.status(400).json({ message: "Invalid reset token" });
  }
};


module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    verifyResetPassword
};
