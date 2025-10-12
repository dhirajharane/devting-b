const express = require("express");
const searchController = require("../controllers/search.controller");
const { userAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/search",userAuth, searchController.searchUsers);

module.exports = router;