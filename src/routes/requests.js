const express = require("express");
const requestsRouter = express.Router();
const { userAuth } = require("../middlewears/auth");
const { User } = require("../models/user");
const { ConnectionRequestModel } = require("../models/connectionRequest");

// Send request (interested/ignored)
requestsRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      const allowedStatus = ["interested", "ignored"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          message: "Not Valid Status",
          status,
        });
      }

      if (fromUserId.equals(toUserId)) {
        return res.status(400).json({
          message: "You can't send request to yourself",
        });
      }

      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(400).json({
          message: "Invalid User",
        });
      }

      // Prevent duplicate requests in any direction
      const existingRequest = await ConnectionRequestModel.findOne({
        $or: [
          { fromUserId: fromUserId, toUserId: toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingRequest) {
        return res.status(400).json({
          message: "A connection request already exists between these users",
        });
      }

      // Prevent sending request to already connected user
      const existingConnection = await ConnectionRequestModel.findOne({
        $or: [
          { fromUserId: fromUserId, toUserId: toUserId, status: "accepted" },
          { fromUserId: toUserId, toUserId: fromUserId, status: "accepted" },
        ],
      });
      if (existingConnection) {
        return res.status(400).json({
          message: "You are already connected with this user",
        });
      }

      const connectionRequest = new ConnectionRequestModel({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();

      res.json({
        message:
          status === "interested"
            ? `${req.user.firstName} is interested in ${toUser.firstName}`
            : `You ignored ${toUser.firstName}`,
        data,
      });
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
);

// Review request (accept/reject)
requestsRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;

      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          message: "Not Valid Status",
          status,
        });
      }

      const connectionRequest = await ConnectionRequestModel.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });
      if (!connectionRequest) {
        return res.status(404).json({
          message: "Connection request not found",
        });
      }

      connectionRequest.status = status;
      const data = await connectionRequest.save();

      res.json({
        message: `Connection Request is ${status}`,
        data,
      });
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
);

module.exports = requestsRouter;