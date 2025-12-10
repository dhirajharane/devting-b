const { User } = require("../models/user.model");
const { ConnectionRequestModel } = require("../models/connectionRequest.model");
const { redisClient } = require("../config/redis");

const safeData = ["firstName", "lastName", "photoURL", "About", "Skills"];

const getReceivedRequests = async (userId) => {
  return await ConnectionRequestModel.find({
    toUserId: userId,
    status: "interested",
  }).populate("fromUserId", safeData);
};

const getConnections = async (userId) => {
  const connections = await ConnectionRequestModel.find({
    $or: [
      { fromUserId: userId, status: "accepted" },
      { toUserId: userId, status: "accepted" },
    ],
  })
    .populate("fromUserId", safeData)
    .populate("toUserId", safeData);

  return connections.map((row) => {
    if (row.fromUserId._id.equals(userId)) {
      return row.toUserId;
    } else {
      return row.fromUserId;
    }
  });
};

const getFeed = async (user, page = 1, limit = 10) => {
  const cacheKey = `feed:${user._id}:${page}:${limit}`;
  const cachedFeed = await redisClient.get(cacheKey);
  
  if (cachedFeed) {
    return JSON.parse(cachedFeed);
  }

  limit = limit > 50 ? 50 : limit;
  const skip = (page - 1) * limit;

  const allRequests = await ConnectionRequestModel.find({
    $or: [{ fromUserId: user._id }, { toUserId: user._id }],
  });

  const excludeUserIds = new Set();
  allRequests.forEach((req) => {
    excludeUserIds.add(req.fromUserId.toString());
    excludeUserIds.add(req.toUserId.toString());
  });
  excludeUserIds.add(user._id.toString());

  const users = await User.find({
    _id: { $nin: Array.from(excludeUserIds) },
  })
    .select(safeData)
    .skip(skip)
    .limit(limit);

  await redisClient.set(cacheKey, JSON.stringify(users), {
    EX: 60,
  });

  return users;
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select(safeData);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

module.exports = {
  getReceivedRequests,
  getConnections,
  getFeed,
  getUserById,
};