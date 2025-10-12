const bcrypt = require("bcrypt");

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const hashOtp = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

const compareOtp = async (otp, hashedOtp) => {
  return bcrypt.compare(otp, hashedOtp);
};

module.exports = {
  generateOtp,
  hashOtp,
  compareOtp,
};