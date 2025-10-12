const express = require("express");
const authRouter = require("./auth.routes");
const profileRouter = require("./profile.routes");
const userRouter = require("./user.routes");
const requestsRouter = require("./request.routes");
const searchRouter = require("./search.routes");
const chatRouter = require("./chat.routes");

const router = express.Router();

router.use("/", authRouter);
router.use("/", profileRouter);
router.use("/", userRouter);
router.use("/", requestsRouter);
router.use("/", searchRouter);
router.use("/", chatRouter);

module.exports = router;