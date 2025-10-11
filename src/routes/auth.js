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
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

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
        return res.status(400).json({ errors: errors.array() });
      }

      const { emailId } = req.body;
      let user = await User.findOne({ emailId });

      const otp = generateOtp();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      const hashedOtp = await hashOtp(otp);

      if (!user) {
        user = new User({ emailId, otp: hashedOtp, otpExpires, isVerified: false });
      } else {
        user.otp = hashedOtp;
        user.otpExpires = otpExpires;
      }

      await user.save();
      await sendOtpEmail(emailId, otp);

      res.json({ message: "OTP sent to your email." });
    } catch (err) {
      console.error("Error sending OTP:", err);
      res.status(500).send("Failed to send OTP.");
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
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { emailId, otp, firstName, lastName } = req.body;
      // Compare otpExpires as Date against current Date
      const user = await User.findOne({ emailId, otpExpires: { $gt: new Date() } });

      if (!user) return res.status(400).send("Invalid or expired OTP.");
      if (user.isVerified) return res.status(400).send("Email already registered.");

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
        secure: process.env.NODE_ENV === "production", // set secure only in production
        sameSite: "none",
        maxAge: 8 * 3600 * 1000,
      });

      // Return user data inside data (frontend expects res.data.data for signup)
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
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { emailId, otp } = req.body;
      const user = await User.findOne({ emailId, otpExpires: { $gt: new Date() } });

      if (!user || !user.isVerified) return res.status(400).send("Invalid OTP or unverified user.");
      const isOtpValid = await compareOtp(otp, user.otp);
      if (!isOtpValid) return res.status(400).send("Invalid OTP.");

      user.otp = null;
      user.otpExpires = null;
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "8h" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 8 * 3600 * 1000,
      });

      // Return user object directly for login (frontend expects res.data to be user for login)
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
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { emailId, password } = req.body;
      const user = await User.findOne({ emailId });

      if (!user || !user.password) {
        return res.status(401).send("Invalid credentials.");
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) return res.status(401).send("Invalid credentials.");

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "8h" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 8 * 3600 * 1000,
      });

      // Return user object so frontend can dispatch addUser(res.data)
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
