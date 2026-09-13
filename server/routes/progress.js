const express = require('express');
const router = express.Router();
const UserBookProgress = require('../models/UserBookProgress');
const Book = require('../models/Book');
const { calculateLevel } = require('../utils/xp');
const auth = require('../middleware/auth'); // если у тебя есть middleware для авторизации

// Получить прогресс пользователя по книге
router.get('/:bookId', auth, async (req, res) => {
  const progress = await UserBookProgress.findOne({
    user: req.user.userId,
    book: req.params.bookId
  });
  res.json(progress || { currentStep: 0 });
});

// Обновить прогресс пользователя по книге
router.post('/:bookId', auth, async (req, res) => {
  const { currentStep } = req.body;
  const book = await Book.findById(req.params.bookId);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (!Number.isInteger(currentStep) || currentStep < 0 || currentStep > book.steps.length) {
    return res.status(400).json({ message: 'Invalid currentStep' });
  }
  let progress = await UserBookProgress.findOneAndUpdate(
    { user: req.user.userId, book: req.params.bookId },
    { currentStep },
    { upsert: true, new: true }
  );
  res.json(progress);
});

// POST /api/progress/:bookId/quiz
router.post('/:bookId/quiz', auth, async (req, res) => {
  const { stepOrder, correct } = req.body;
  const userId = req.user.userId;
  const bookId = req.params.bookId;
  const book = await Book.findById(bookId);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  const step = book.steps.find(step => step.order === stepOrder && step.type === 'quiz');
  const questionCount = step && (Array.isArray(step.quiz) ? step.quiz.length : step.quiz?.question ? 1 : 0);
  if (!questionCount || !Number.isInteger(correct) || correct < 0 || correct > questionCount) {
    return res.status(400).json({ message: 'Invalid quiz result' });
  }
  const User = require('../models/User');
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

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
  user.xp = (user.xp || 0) + (correct * 10);
  user.level = calculateLevel(user.xp);
  await user.save();

  res.json({ alreadyPassed: false, xpAdded: correct * 10 });
});

module.exports = router;
