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
  const books = await UserBookProgress.find({ user: userId }).populate('book').lean();
  const user = await User.findById(userId).populate('achievements');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({
    books: books.filter(item => item.book).map(item => {
      const total = item.book.steps.length;
      return {
        ...item,
        finished: total > 0 && item.currentStep >= total,
        progress: total > 0 ? Math.min(100, Math.round(item.currentStep / total * 100)) : 0
      };
    }),
    achievements: user.achievements
  });
});

module.exports = router;
