const express = require("express");
const requestsRouter = express.Router();
const { userAuth } = require("../middlewears/auth");
const { User } = require("../models/user");
const { ConnectionRequestModel } = require("../models/connectionRequest");

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

      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(400).json({
          message: "Invalid User",
          toUser,
        });
      }

      //lets check if the req already exist or if the receiver has alreday sent us the request
      const existingRequest = await ConnectionRequestModel.findOne({
        $or: [
          { fromUserId: fromUserId, toUserId: toUserId }, // existing request
          { fromUserId: toUserId, toUserId: fromUserId }, // receiver has already sent us the req
        ],
      });
      if (existingRequest) {
        res.status(400).json({
          message: "You already have a connection request",
          existingRequest,
        });
      }

      const connectionRequest = new ConnectionRequestModel({
        // adding the req in db
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
        _id: requestId, //from whom the req has come
        toUserId: loggedInUser._id, // toUser should be loggedin user because he has to accept or reject the req
        status: "interested", // status should be interested because , ig ignored there is no such req
      });
      if (!connectionRequest) {
        return res.status(404).json({
          message: "Connection request not found", // there should be a connection req to accept or reject
        });
      }

      connectionRequest.status = status; // now we r safe to accept or reject

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
