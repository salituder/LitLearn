const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Поиск пользователей по подстроке (логин или имя)
router.get('/search', auth, async (req, res) => {
  const q = req.query.q || "";
  const users = await User.find({
    $or: [
      { username: new RegExp(q, "i") },
      { displayName: new RegExp(q, "i") }
    ]
  }).limit(10).select('username displayName');
  res.json(users);
});

// Получить список друзей текущего пользователя
router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user.userId).populate('friends', 'username displayName');
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user.friends);
});

// Добавить друга по username
router.post('/add', auth, async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: 'username is required' });
  const you = await User.findById(req.user.userId);
  const friend = await User.findOne({ username });
  if (!friend) return res.status(404).json({ message: 'User not found' });
  if (you.friends.includes(friend._id)) return res.status(400).json({ message: 'Already friends' });
  you.friends.push(friend._id);
  await you.save();
  res.json({ success: true });
});

// Удалить друга (по username)
router.post('/remove', auth, async (req, res) => {
  const { username } = req.body;
  const you = await User.findById(req.user.userId);
  const friend = await User.findOne({ username });
  you.friends = you.friends.filter(fid => fid.toString() !== (friend?._id.toString() || ""));
  await you.save();
  res.json({ success: true });
});

module.exports = router;