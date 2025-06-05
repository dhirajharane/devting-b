const express = require("express");
const userRouter = express.Router();
const { userAuth } = require("../middlewears/auth");
const { User } = require("../models/user");
const { ConnectionRequestModel } = require("../models/connectionRequest");

const safeData = ["firstName", "lastName", "photoURL", "About","Skills"];

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

userRouter.get("/feed", userAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  limit = limit > 50 ? 50 : limit;
  const skip = (page - 1) * limit;33

  const loggedInUser = req.user;

  const connectionRequests = await ConnectionRequestModel.find({
    //the feed should not show user's connections of any type
    $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
  });

  const hideUsersFromFeed = new Set(); // to get unique connections

  connectionRequests.forEach((req) => {
    hideUsersFromFeed.add(req.fromUserId.toString());
    hideUsersFromFeed.add(req.toUserId.toString());
  });

  const users = await User.find({
    $and: [
      { _id: { $nin: Array.from(hideUsersFromFeed) } }, // users which are not in that set
      { _id: { $ne: loggedInUser._id.toString() } }, // own profile should not be in feed
    ],
  })
    .select(safeData)
    .skip(skip)
    .limit(limit);

  res.json({
    users,
  });
});
module.exports = userRouter;
