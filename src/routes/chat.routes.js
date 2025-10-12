const express = require("express");
const chatController = require("../controllers/chat.controller");
const { userAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/chat/:targetId", userAuth, chatController.getChat);

module.exports = router;