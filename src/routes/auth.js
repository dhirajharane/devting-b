const express = require("express");
const authRouter = express.Router();
const { User } = require("../models/user");
const { sendOtpEmail } = require("../utils/otp");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

// --- Rate limiter to prevent OTP spam ---
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // max 3 requests per 5 minutes per IP
  message: "Too many OTP requests. Please try again later.",
});

// --- OTP Helpers ---
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const hashOtp = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

const compareOtp = async (otp, hashedOtp) => {
  return bcrypt.compare(otp, hashedOtp);
};

const createSafeUserObject = (user) => {
  if (!user) return null;
  return {
    id: user._id,
    emailId: user.emailId,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
  };
};

// --- 1. Send OTP ---
authRouter.post(
  "/send-otp",
  otpLimiter,
  body("emailId").isEmail().withMessage("Valid email required"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      let { emailId, firstName, lastName, password } = req.body;
      if (!emailId) {
        return res.status(400).json({
          success: false,
          message: "Email is required.",
        });
      }
      const normalizedEmail = emailId.trim().toLowerCase();

      let user = await User.findOne({ emailId: normalizedEmail });

      if (user && user.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Email already verified. Please log in.",
        });
      }

      const otp = generateOtp();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
      const hashedOtp = await hashOtp(otp);

      if (!user) {
        if (!firstName || !lastName || !password) {
          return res.status(400).json({
            success: false,
            message: "Missing required fields: firstName, lastName, password",
          });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({
          emailId: normalizedEmail,
          firstName,
          lastName,
          password: hashedPassword,
          otp: hashedOtp,
          otpExpires,
          isVerified: false,
        });
      } else {
        user.otp = hashedOtp;
        user.otpExpires = otpExpires;
        if (!user.firstName && firstName) user.firstName = firstName;
        if (!user.lastName && lastName) user.lastName = lastName;
      }

      await user.save();

      // Send OTP email with specific error handling
      try {
        await sendOtpEmail(normalizedEmail, otp);
      } catch (emailError) {
        // This will catch the "Failed to send OTP email" error from the utility
        console.error("Error sending OTP email:", emailError);
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email.",
          error: emailError.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: { emailId: normalizedEmail },
      });
    } catch (err) {
      console.error("Server error in /send-otp:", err);
      return res.status(500).json({
        success: false,
        message: "Server error while sending OTP",
        error: err.message,
      });
    }
  }
);

// --- 2. Verify OTP for Signup ---
authRouter.post(
  "/verify-otp/signup",
  body("emailId").isEmail(),
  body("otp").isLength({ min: 6, max: 6 }),
  body("firstName").notEmpty(),
  body("lastName").notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { emailId, otp, firstName, lastName } = req.body;
      const normalizedEmail = emailId.trim().toLowerCase();
      const user = await User.findOne({
        emailId: normalizedEmail,
        otpExpires: { $gt: new Date() },
      });

      if (!user) return res.status(400).send("Invalid or expired OTP.");
      if (user.isVerified)
        return res.status(400).send("Email already registered.");

      const isOtpValid = await compareOtp(otp, user.otp);
      if (!isOtpValid) return res.status(400).send("Invalid OTP.");

      user.firstName = firstName;
      user.lastName = lastName;
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;

      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "8h",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 8 * 3600 * 1000,
      });

      res.status(201).json({
        message: "Signup successful!",
        data: createSafeUserObject(user),
      });
    } catch (err) {
      console.error("Error verifying signup OTP:", err);
      res.status(500).send("Verification failed.");
    }
  }
);

// --- 3. Verify OTP for Login ---
authRouter.post(
  "/verify-otp/login",
  body("emailId").isEmail(),
  body("otp").isLength({ min: 6, max: 6 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { emailId, otp } = req.body;
      const normalizedEmail = emailId.trim().toLowerCase();
      const user = await User.findOne({
        emailId: normalizedEmail,
        otpExpires: { $gt: new Date() },
      });

      if (!user || !user.isVerified)
        return res.status(400).send("Invalid OTP or unverified user.");
      const isOtpValid = await compareOtp(otp, user.otp);
      if (!isOtpValid) return res.status(400).send("Invalid OTP.");

      user.otp = null;
      user.otpExpires = null;
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "8h",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 8 * 3600 * 1000,
      });

      res.json(createSafeUserObject(user));
    } catch (err) {
      console.error("Error verifying login OTP:", err);
      res.status(500).send("Login failed.");
    }
  }
);

// --- 4. Password Login ---
authRouter.post(
  "/login/password",
  body("emailId").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { emailId, password } = req.body;
      const normalizedEmail = emailId.trim().toLowerCase();
      const user = await User.findOne({ emailId: normalizedEmail });

      if (!user || !user.password) {
        return res.status(401).send("Invalid credentials.");
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) return res.status(401).send("Invalid credentials.");

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "8h",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 8 * 3600 * 1000,
      });

      res.json(createSafeUserObject(user));
    } catch (err) {
      console.error("Password login error:", err);
      res.status(500).send("Login failed.");
    }
  }
);

// --- 5. Logout ---
authRouter.post("/logout", (req, res) => {
  res.cookie("token", "", { maxAge: 0, httpOnly: true });
  res.json({ message: "Logged out successfully." });
});

module.exports = authRouter;