const { User } = require("../models/user.model");

const safeData = [
  "firstName",
  "lastName",
  "photoURL",
  "age",
  "gender",
  "About",
  "Skills",
];

const searchUsers = async (q, page = 1, limit = 10) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);

  if (!q || typeof q !== "string" || !q.trim()) {
    throw new Error("Please provide a search query.");
  }

  const regex = new RegExp(q.trim(), "i");

  const users = await User.find({
    $or: [{ firstName: regex }, { lastName: regex }, { Skills: regex }],
  })
    .select(safeData)
    .skip(skip)
    .limit(Math.min(parseInt(limit), 50));

  return {
    users,
    page: parseInt(page),
    limit: parseInt(limit),
  };
};

module.exports = {
  searchUsers,
};