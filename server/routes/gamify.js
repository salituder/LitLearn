const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const { calculateLevel } = require('../utils/xp');
const auth = require('../middleware/auth');

// Начислить XP пользователю
router.post('/xp', auth, async (req, res) => {
    const { amount, reason } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.xp = (user.xp || 0) + Math.max(0, amount);

    // нужно еще пересчитать уровень
    user.level = calculateLevel(user.xp);

    await user.save();
    res.json({ xp: user.xp, level: user.level });
});

// Получить свои достижения
router.get('/achievements', auth, async (req,res) => {
  const user = await User.findById(req.user.userId).populate('achievements');
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.achievements);
});

// Выдать ачивку пользователю
router.post('/achievement', auth, async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.user.userId);
  const achievement = await Achievement.findOne({ code });
  if (!user || !achievement) return res.status(404).json({ message: 'User or achievement not found' });
  if (user.achievements.includes(achievement._id)) {
    return res.status(400).json({ message: 'Achievement already earned' });
  }
  user.achievements.push(achievement._id);
  user.xp += achievement.xpReward || 0;
  user.level = calculateLevel(user.xp); // Пересчёт уровня
  await user.save();
  res.json({ achievements: user.achievements, xp: user.xp, level: user.level });
});

module.exports = router;  