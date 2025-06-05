const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../middlewears/auth");
const { validateEditProfileData } = require("../utils/validation");
const validator = require("validator");
const bcrypt = require("bcrypt");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid Update Fields");
    }
    const user = req.user;
    Object.keys(req.body).forEach((key) => (user[key] = req.body[key]));
    await user.save();

    res.json({
      message: `Hey ${user.firstName}, Your profile is updated successfully`,
      data: user,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
profileRouter.patch("/profile/forgotPassword", userAuth, async (req, res) => {
  try {
    const user = req.user;

    const oldPasswordHash = user.password;

    const newPassword = req.body.password;

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

    res.send(`Hey ${user.firstName}, Your password is updated successfully`);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = profileRouter;
