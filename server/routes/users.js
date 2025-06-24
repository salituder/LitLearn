const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const UserBookProgress = require('../models/UserBookProgress');

// Поиск по всем пользователям с ролью student
router.get('/search', auth, async (req, res) => {
  const q = req.query.q || "";
  const users = await User.find({
    $or: [
      { username: new RegExp(q, "i") },
      { displayName: new RegExp(q, "i") }
    ],
    role: 'student'
  }).limit(10).select('username displayName role');
  res.json(users);
});

router.get('/:id/progress', auth, async (req, res) => {
  const userId = req.params.id;
  const books = await UserBookProgress.find({ user: userId }).populate('book');
  const user = await User.findById(userId).populate('achievements');
  res.json({
    books,
    achievements: user.achievements
  });
});

module.exports = router;
