const express = require("express");
require("dotenv").config();
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { connectDB } = require("./config/database");
const { userAuth } = require("./middlewears/auth");
const { User } = require("./models/user");
const { validateSignUpData } = require("./utils/validation");
const initializeSocket = require("./utils/socket");

// Routers
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestsRouter = require("./routes/requests");
const userRouter = require("./routes/userRoute");
const searchRouter = require("./routes/searchRoute");
const chatRouter = require("./routes/chats");

const app = express();

app.set('trust proxy', 1);

// --- CORS Setup ---
const allowedOrigins = [
  "http://localhost:5173",
  "https://devting-f.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));



// --- Middleware ---
app.use(express.json());
app.use(cookieParser());

// --- Routes ---
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestsRouter);
app.use("/", userRouter);
app.use("/", searchRouter);
app.use("/", chatRouter);

// --- Health Check Endpoint ---
app.get("/ping", (req, res) => {
  res.status(200).send("Backend is alive");
});

// --- Create HTTP Server for Socket.IO ---
const server = http.createServer(app);
initializeSocket(server);

// --- Start Server ---
const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    console.log("✅ Database connected successfully");
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
  });
