const requestService = require("../services/request.service");

const sendRequest = async (req, res) => {
  try {
    const { toUserId, status } = req.params;
    const fromUserId = req.user._id;
    const data = await requestService.sendRequest(fromUserId, toUserId, status);
    res.json({
      message: `${req.user.firstName} is ${status} in ${data.toUser.firstName}`,
      data,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const reviewRequest = async (req, res) => {
  try {
    const { requestId, status } = req.params;
    const loggedInUser = req.user;
    const data = await requestService.reviewRequest(
      loggedInUser,
      requestId,
      status
    );
    res.json({ message: `Connection Request is ${status}`, data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  sendRequest,
  reviewRequest,
};