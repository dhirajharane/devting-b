const express = require("express");
const requestController = require("../controllers/request.controller");
const { userAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(userAuth);

router.post("/request/send/:status/:toUserId", requestController.sendRequest);
router.post("/request/review/:status/:requestId", requestController.reviewRequest);

module.exports = router;