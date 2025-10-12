const profileService = require("../services/profile.service");

const viewProfile = (req, res) => {
  res.send(req.user);
};

const editProfile = async (req, res) => {
  try {
    const user = await profileService.editProfile(req.user, req.body);
    res.json({
      message: `Hey ${user.firstName}, Your profile is updated successfully`,
      data: user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const user = await profileService.forgotPassword(
      req.user,
      req.body.password
    );
    res.send(`Hey ${user.firstName}, Your password is updated successfully`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  viewProfile,
  editProfile,
  forgotPassword,
};