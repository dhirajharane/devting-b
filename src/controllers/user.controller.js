const userService = require("../services/user.service");

const getReceivedRequests = async (req, res) => {
  try {
    const connectionRequests = await userService.getReceivedRequests(
      req.user._id
    );
    res.json({
      message: "Here are your pending connection requests",
      connectionRequests,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getConnections = async (req, res) => {
  try {
    const connections = await userService.getConnections(req.user._id);
    res.json({
      message: "Here are your connections",
      data: connections,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getFeed = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const users = await userService.getFeed(req.user, page, limit);
    res.json({ users });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    res.json({ user });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = {
  getReceivedRequests,
  getConnections,
  getFeed,
  getUserById,
};