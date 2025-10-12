const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");
const { sendOtpEmail } = require("../utils/otp");
const { generateOtp, hashOtp, compareOtp } = require("../utils/otpHelper");

const createSafeUserObject = (user) => {
  if (!user) return null;
  return {
    _id: user._id,
    emailId: user.emailId,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
  };
};

const sendOtp = async (emailId, firstName, lastName, password) => {
  if (!emailId) {
    throw new Error("Email is required.");
  }

  const normalizedEmail = emailId.trim().toLowerCase();
  let user = await User.findOne({ emailId: normalizedEmail });

  if (user && user.isVerified) {
    throw new Error("Email already verified. Please log in.");
  }

  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  const hashedOtp = await hashOtp(otp);

  if (!user) {
    if (!firstName || !lastName || !password) {
      throw new Error("Missing required fields: firstName, lastName, password");
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
  await sendOtpEmail(normalizedEmail, otp);

  return {
    success: true,
    message: "OTP sent successfully",
    data: { emailId: normalizedEmail },
  };
};

const verifySignupOtp = async (emailId, otp, firstName, lastName) => {
  const normalizedEmail = emailId.trim().toLowerCase();
  const user = await User.findOne({
    emailId: normalizedEmail,
    otpExpires: { $gt: new Date() },
  });

  if (!user) throw new Error("Invalid or expired OTP.");
  if (user.isVerified) throw new Error("Email already registered.");

  const isOtpValid = await compareOtp(otp, user.otp);
  if (!isOtpValid) throw new Error("Invalid OTP.");

  user.firstName = firstName;
  user.lastName = lastName;
  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;

  await user.save();

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });

  return { user: createSafeUserObject(user), token };
};

const sendLoginOtp = async (emailId) => {
  const normalizedEmail = emailId.trim().toLowerCase();
  const user = await User.findOne({ emailId: normalizedEmail });

  if (!user) {
    throw new Error("No account found with this email. Please sign up first.");
  }
  if (!user.isVerified) {
    throw new Error(
      "Email not verified. Please complete signup verification first."
    );
  }

  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // valid 5 min

  user.otp = hashedOtp;
  user.otpExpires = otpExpires;
  await user.save();
  await sendOtpEmail(normalizedEmail, otp);

  return {
    success: true,
    message: "OTP sent successfully for login.",
    data: { emailId: normalizedEmail },
  };
};

const verifyLoginOtp = async (emailId, otp) => {
  const normalizedEmail = emailId.trim().toLowerCase();
  const user = await User.findOne({
    emailId: normalizedEmail,
    otpExpires: { $gt: new Date() },
  });

  if (!user || !user.isVerified)
    throw new Error("Invalid OTP or unverified user.");
  const isOtpValid = await compareOtp(otp, user.otp);
  if (!isOtpValid) throw new Error("Invalid OTP.");

  user.otp = null;
  user.otpExpires = null;
  await user.save();

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });

  return { user: createSafeUserObject(user), token };
};

const loginWithPassword = async (emailId, password) => {
  const user = await User.findOne({ emailId });
  if (!user) {
    throw new Error("Invalid Credentials");
  }

  const isPasswordValid = await user.validatePassword(password);
  if (!isPasswordValid) {
    throw new Error("Invalid Credentials");
  }

  const token = await user.getJWT();
  return { user, token };
};

module.exports = {
  sendOtp,
  verifySignupOtp,
  sendLoginOtp,
  verifyLoginOtp,
  loginWithPassword,
};