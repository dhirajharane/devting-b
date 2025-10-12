const bcrypt = require("bcrypt");
const validator = require("validator");
const { validateEditProfileData } = require("../utils/validation");

const editProfile = async (user, updates) => {
  if (!validateEditProfileData({ body: updates })) {
    throw new Error("Invalid Update Fields");
  }

  Object.keys(updates).forEach((key) => (user[key] = updates[key]));
  await user.save();
  return user;
};

const forgotPassword = async (user, newPassword) => {
  const oldPasswordHash = user.password;
  const isSame = await bcrypt.compare(newPassword, oldPasswordHash);
  if (isSame) {
    throw new Error("New password should not be same as old");
  }

  const isStrongPassword = validator.isStrongPassword(newPassword);
  if (!isStrongPassword) {
    throw new Error("Please enter a strong password");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return user;
};

module.exports = {
  editProfile,
  forgotPassword,
};