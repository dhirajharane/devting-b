const socket = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { Chat } = require("../models/chat.model");
const { ConnectionRequestModel } = require("../models/connectionRequest.model");
const { User } = require("../models/user.model");
const { redisClient } = require("../config/redis");
const crypto = require("crypto");

const initializeSocket = (server) => {
  function generateRoomId(userId, targetId) {
    const [id1, id2] = [userId, targetId].sort();
    const raw = `${id1}:${id2}`;
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    return `room_${hash.slice(0, 16)}`;
  }

  const io = socket(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://devting-f.vercel.app"
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
  });

  io.on("connection", (socket) => {
    socket.on("userOnline", async ({ userId }) => {
      await redisClient.sAdd("online_users", userId);
      await redisClient.set(`socket_user:${socket.id}`, userId);
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
      const userId = await redisClient.get(`socket_user:${socket.id}`);
      
      if (userId) {
        await redisClient.sRem("online_users", userId);
        await redisClient.del(`socket_user:${socket.id}`);
        
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        io.emit("userStatus", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });
      }
    });
  });
};

module.exports = initializeSocket;