const searchService = require("../services/search.service");

const searchUsers = async (req, res) => {
  try {
    const { q, page, limit } = req.query;
    const result = await searchService.searchUsers(q, page, limit);
    res.json({
      message: "Here are the matching users",
      ...result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  searchUsers,
};