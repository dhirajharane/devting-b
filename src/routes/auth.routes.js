const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: "Too many OTP requests. Please try again later.",
});

router.post(
  "/send-otp",
  otpLimiter,
  body("emailId").isEmail().withMessage("Valid email required"),
  authController.sendOtp
);
router.post(
  "/verify-otp/signup",
  body("emailId").isEmail(),
  body("otp").isLength({ min: 6, max: 6 }),
  body("firstName").notEmpty(),
  body("lastName").notEmpty(),
  authController.verifySignupOtp
);
router.post(
  "/login-otp",
  otpLimiter,
  body("emailId").isEmail().withMessage("Valid email required"),
  authController.sendLoginOtp
);
router.post(
  "/verify-otp/login",
  body("emailId").isEmail(),
  body("otp").isLength({ min: 6, max: 6 }),
  authController.verifyLoginOtp
);
router.post("/login/password", authController.loginWithPassword);
router.post("/logout", authController.logout);

module.exports = router;