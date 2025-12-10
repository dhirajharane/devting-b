const { User } = require("../models/user.model");
const { ConnectionRequestModel } = require("../models/connectionRequest.model");
const { redisClient } = require("../config/redis");

const sendRequest = async (fromUserId, toUserId, status) => {
  const allowedStatus = ["interested", "ignored"];
  if (!allowedStatus.includes(status)) {
    throw new Error("Not Valid Status");
  }

  if (fromUserId.equals(toUserId)) {
    throw new Error("You can't send request to yourself");
  }

  const toUser = await User.findById(toUserId);
  if (!toUser) {
    throw new Error("Invalid User");
  }

  const existingRequest = await ConnectionRequestModel.findOne({
    $or: [
      { fromUserId, toUserId },
      { fromUserId: toUserId, toUserId: fromUserId },
    ],
  });

  if (existingRequest) {
    throw new Error("A connection request already exists between these users");
  }

  const connectionRequest = new ConnectionRequestModel({
    fromUserId,
    toUserId,
    status,
  });

  const savedRequest = await connectionRequest.save();

  await redisClient.del(`feed:${fromUserId}:1:10`);

  return savedRequest;
};

const reviewRequest = async (loggedInUser, requestId, status) => {
  const allowedStatus = ["accepted", "rejected"];
  if (!allowedStatus.includes(status)) {
    throw new Error("Not Valid Status");
  }

  const connectionRequest = await ConnectionRequestModel.findOne({
    _id: requestId,
    toUserId: loggedInUser._id,
    status: "interested",
  });

  if (!connectionRequest) {
    throw new Error("Connection request not found");
  }

  connectionRequest.status = status;
  return await connectionRequest.save();
};

module.exports = {
  sendRequest,
  reviewRequest,
};