const express = require('express');
const router = express.Router();
const UserBookProgress = require('../models/UserBookProgress');
const Book = require('../models/Book');
const auth = require('../middleware/auth'); // если у тебя есть middleware для авторизации

// Получить прогресс пользователя по книге
router.get('/:bookId', auth, async (req, res) => {
  const progress = await UserBookProgress.findOne({
    user: req.user.id,
    book: req.params.bookId
  });
  res.json(progress || { currentStep: 0 });
});

// Обновить прогресс пользователя по книге
router.post('/:bookId', auth, async (req, res) => {
  const { currentStep } = req.body;
  let progress = await UserBookProgress.findOneAndUpdate(
    { user: req.user.id, book: req.params.bookId },
    { currentStep },
    { upsert: true, new: true }
  );
  res.json(progress);
});

// POST /api/progress/:bookId/quiz
router.post('/:bookId/quiz', auth, async (req, res) => {
  const { stepOrder, correct } = req.body;
  const userId = req.user.id;
  const bookId = req.params.bookId;

  let progress = await UserBookProgress.findOne({ user: userId, book: bookId });
  if (!progress) {
    progress = await UserBookProgress.create({ user: userId, book: bookId, currentStep: 0, quizzes: [] });
  }
  if (!progress.quizzes) progress.quizzes = [];

  // Проверяем, проходил ли уже этот квиз
  if (progress.quizzes.includes(stepOrder)) {
    return res.json({ alreadyPassed: true });
  }

  // Сохраняем, что квиз пройден
  progress.quizzes.push(stepOrder);
  await progress.save();

  // Начисляем XP (10 XP за каждый правильный ответ)
  const User = require('../models/User');
  const user = await User.findById(userId);
  user.xp = (user.xp || 0) + (correct * 10);
  await user.save();

  res.json({ alreadyPassed: false, xpAdded: correct * 10 });
});

module.exports = router;
