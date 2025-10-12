const chatService = require("../services/chat.service");

const getChat = async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.user._id;
    const chat = await chatService.getChat(userId, targetId);
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chat" });
  }
};

module.exports = {
  getChat,
};