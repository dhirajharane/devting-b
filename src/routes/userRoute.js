const express = require("express");
const userRouter = express.Router();
const { userAuth } = require("../middlewears/auth");
const { User } = require("../models/user");
const { ConnectionRequestModel } = require("../models/connectionRequest");

const safeData = ["firstName", "lastName", "photoURL", "About", "Skills"];

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequestModel.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", safeData);

    res.json({
      message: "Here are your pending connection requests",
      connectionRequests,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connections = await ConnectionRequestModel.find({
      $or: [
        { fromUserId: loggedInUser._id, status: "accepted" },
        { toUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", safeData)
      .populate("toUserId", safeData);

    // Always return the "other" user's info
    const data = connections.map((row) => {
      if (row.fromUserId._id.equals(loggedInUser._id)) {
        return row.toUserId;
      } else {
        return row.fromUserId;
      }
    });

    res.json({
      message: "Here are your connections",
      data,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// FEED: Only show users with NO connection/request/ignore/self
userRouter.get("/feed", userAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  limit = limit > 50 ? 50 : limit;
  const skip = (page - 1) * limit;

  const loggedInUser = req.user;

  // Find all requests/connections/ignores involving the user
  const allRequests = await ConnectionRequestModel.find({
    $or: [
      { fromUserId: loggedInUser._id },
      { toUserId: loggedInUser._id },
    ],
  });

  // Build sets of userIds to exclude
  const excludeUserIds = new Set();
  allRequests.forEach((req) => {
    // Exclude all users with any request/connection
    excludeUserIds.add(req.fromUserId.toString());
    excludeUserIds.add(req.toUserId.toString());
    // If ignored, always exclude the ignored user from the feed
    if (
      req.fromUserId.equals(loggedInUser._id) &&
      req.status === "ignored"
    ) {
      excludeUserIds.add(req.toUserId.toString());
    }
    if (
      req.toUserId.equals(loggedInUser._id) &&
      req.status === "ignored"
    ) {
      excludeUserIds.add(req.fromUserId.toString());
    }
  });
  // Always exclude self
  excludeUserIds.add(loggedInUser._id.toString());

  const users = await User.find({
    _id: { $nin: Array.from(excludeUserIds) },
  })
    .select(safeData)
    .skip(skip)
    .limit(limit);

  // Always return users array (even if empty)
  res.json({
    users,
  });
});

module.exports = userRouter;

