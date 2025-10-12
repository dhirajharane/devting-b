const authService = require("../services/auth.service");

const sendOtp = async (req, res) => {
  try {
    const { emailId, firstName, lastName, password } = req.body;
    const result = await authService.sendOtp(
      emailId,
      firstName,
      lastName,
      password
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const verifySignupOtp = async (req, res) => {
  try {
    const { emailId, otp, firstName, lastName } = req.body;
    const { user, token } = await authService.verifySignupOtp(
      emailId,
      otp,
      firstName,
      lastName
    );
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 8 * 3600 * 1000,
      })
      .status(201)
      .json({ message: "Signup successful!", data: user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const sendLoginOtp = async (req, res) => {
  try {
    const { emailId } = req.body;
    const result = await authService.sendLoginOtp(emailId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const verifyLoginOtp = async (req, res) => {
  try {
    const { emailId, otp } = req.body;
    const { user, token } = await authService.verifyLoginOtp(emailId, otp);
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 8 * 3600 * 1000,
      })
      .json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const loginWithPassword = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const { user, token } = await authService.loginWithPassword(
      emailId,
      password
    );
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        expires: new Date(Date.now() + 8 * 3600000),
      })
      .send(user);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const logout = (req, res) => {
  res.cookie("token", "", { maxAge: 0, httpOnly: true });
  res.json({ message: "Logged out successfully." });
};

module.exports = {
  sendOtp,
  verifySignupOtp,
  sendLoginOtp,
  verifyLoginOtp,
  loginWithPassword,
  logout,
};