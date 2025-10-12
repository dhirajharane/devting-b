const socket = require("socket.io");
const { Chat } = require("../models/chat.model");
const { ConnectionRequestModel } = require("../models/connectionRequest.model");
const { User } = require("../models/user.model");
const crypto = require("crypto");

const onlineUsers = new Map();

const initializeSocket = (server) => {
  function generateRoomId(userId, targetId) {
    const [id1, id2] = [userId, targetId].sort();
    const raw = `${id1}:${id2}`;
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    return `room_${hash.slice(0, 16)}`;
  }

  const io = socket(server, {
    cors: {
      origin: "https://devting-f.vercel.app",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    let currentUserId = null;

    socket.on("userOnline", async ({ userId }) => {
      currentUserId = userId;
      onlineUsers.set(userId, socket.id);
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("userStatus", { userId, isOnline: true });
    });

    socket.on("joinChat", ({ userId, targetId }) => {
      if (!userId || !targetId) return;
      const room = generateRoomId(userId, targetId);
      socket.join(room);
    });

    socket.on(
      "sendMessage",
      async ({ firstName, lastName, userId, targetId, text }) => {
        if (!userId || !targetId || !text) return;

        try {
          const isConnection = await ConnectionRequestModel.findOne({
            $or: [
              { fromUserId: userId, toUserId: targetId, status: "accepted" },
              { fromUserId: targetId, toUserId: userId, status: "accepted" },
            ],
          });
          if (!isConnection) {
            throw new Error("Only connections can send message");
          }

          const room = generateRoomId(userId, targetId);

          let chat = await Chat.findOne({
            participants: { $all: [userId, targetId] },
          });
          if (!chat) {
            chat = new Chat({
              participants: [userId, targetId],
              messages: [],
            });
          }

          const message = {
            senderId: userId,
            text,
            sentAt: new Date(),
            seen: false,
            seenAt: null,
          };

          chat.messages.push(message);
          await chat.save();

          io.to(room).emit("messageReceived", {
            firstName,
            lastName,
            text,
            sentAt: message.sentAt,
            senderId: userId,
          });
        } catch (err) {
          console.log(err.message);
        }
      }
    );

    socket.on(
      "messageSeen",
      async ({ chatId, messageId, userId, targetId }) => {
        const chat = await Chat.findById(chatId);
        if (!chat) return;
        const msg = chat.messages.id(messageId);
        if (msg && !msg.seen) {
          msg.seen = true;
          msg.seenAt = new Date();
          await chat.save();

          const room = generateRoomId(userId, targetId);
          io.to(room).emit("messageSeen", {
            messageId,
            seenAt: msg.seenAt,
          });
        }
      }
    );

    socket.on("disconnect", async () => {
      if (currentUserId) {
        onlineUsers.delete(currentUserId);
        await User.findByIdAndUpdate(currentUserId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        io.emit("userStatus", {
          userId: currentUserId,
          isOnline: false,
          lastSeen: new Date(),
        });
      }
    });
  });
};

module.exports = initializeSocket;