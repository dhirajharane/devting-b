const express = require("express");
require("dotenv").config();
const { connectDB } = require("./config/database");
const { User } = require("./models/user");
const { validateSignUpData } = require("./utils/validation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { userAuth } = require("./middlewears/auth");
const cors = require("cors");
const http=require("http");


const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestsRouter = require("./routes/requests");
const userRouter = require("./routes/userRoute");
const searchRouter = require("./routes/searchRoute");
const initializeSocket = require("./utils/socket");
const chatRouter = require("./routes/chats");

const app = express();

app.use(
  cors({
    origin: true, //whitelisting thiss domain name so that browser can store cookies
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestsRouter);
app.use("/", userRouter);
app.use("/",searchRouter);
app.use("/",chatRouter);

const server=http.createServer(app);
initializeSocket(server);
const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    console.log("Success");
    server.listen(PORT, () => {
      console.log("Server is listening on PORT 3000");
    });
  })
  .catch((err) => {
    console.error("not connected", err);
  });
