const { Chat } = require("../models/chat.model");

const getChat = async (userId, targetId) => {
  let chat = await Chat.findOne({
    participants: { $all: [userId, targetId] },
  }).populate({
    path: "messages.senderId",
    select: "firstName lastName",
  });

  if (!chat) {
    chat = new Chat({
      participants: [userId, targetId],
      messages: [],
    });
    await chat.save();
  }

  return chat;
};

module.exports = {
  getChat,
};