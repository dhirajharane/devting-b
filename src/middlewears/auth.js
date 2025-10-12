const jwt = require("jsonwebtoken");
const { User } = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).send("Please login first");
    }

    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedObj.id);

    if (!user) {
      return res.status(401).send("Invalid user");
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

module.exports = { userAuth };