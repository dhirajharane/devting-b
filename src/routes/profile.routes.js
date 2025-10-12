const express = require("express");
const profileController = require("../controllers/profile.controller");
const { userAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(userAuth);

router.get("/profile/view", profileController.viewProfile);
router.patch("/profile/edit", profileController.editProfile);
router.patch("/profile/forgotPassword", profileController.forgotPassword);

module.exports = router;