const express = require("express");
const searchRouter = express.Router();
const { userAuth } = require("../middlewears/auth");
const { User } = require("../models/user");

// Only return safe fields
const safeData = ["firstName", "lastName", "photoURL","age","gender", "About", "Skills"];

searchRouter.get("/search", userAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!q || typeof q !== "string" || !q.trim()) {
      return res.status(400).json({ message: "Please provide a search query." });
    }

    // Build a case-insensitive regex for partial matching
    const regex = new RegExp(q.trim(), "i");

    // Search by firstName, lastName, or any skill
    const users = await User.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { Skills: regex }
      ]
    })
      .select(safeData)
      .skip(skip)
      .limit(Math.min(parseInt(limit), 50)); // limit max 50 per page

    res.json({
      message: "Here are the matching users",
      users,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = searchRouter;