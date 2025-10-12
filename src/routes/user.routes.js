const express = require("express");
const userController = require("../controllers/user.controller");
const { userAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(userAuth);

router.get("/user/requests/received", userController.getReceivedRequests);
router.get("/user/connections", userController.getConnections);
router.get("/feed", userController.getFeed);
router.get("/user/:userId", userController.getUserById);

module.exports = router;