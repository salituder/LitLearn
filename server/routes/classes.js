const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const User = require('../models/User');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const UserBookProgress = require('../models/UserBookProgress');

// Получить все классы, которыми управляет учитель
router.get('/my', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
  const classes = await Class.find({ teacher: req.user.userId }).populate('students', 'username displayName').populate('books', 'title author');
  res.json(classes);
});

// Создать новый класс
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
  const { name } = req.body;
  const newClass = await Class.create({ name, teacher: req.user.userId, students: [], books: [] });
  res.json(newClass);
});

// Редактировать название класса
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
  const { name } = req.body;
  const updated = await Class.findOneAndUpdate(
    { _id: req.params.id, teacher: req.user.userId },
    { name },
    { new: true }
  );
  res.json(updated);
});

// Удалить свой класс
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
  const cls = await Class.findOneAndDelete({ _id: req.params.id, teacher: req.user.userId });
  if (!cls) return res.status(404).json({ message: 'Class not found' });
  await User.updateMany({ class: cls._id }, { $unset: { class: "" } });
  res.json({ success: true });
});

// Добавить/удалить ученика в класс
router.post('/:id/students', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
  const { studentId } = req.body;
  const classObj = await Class.findOne({ _id: req.params.id, teacher: req.user.userId });
  if (!classObj) return res.status(404).json({ message: 'Class not found' });

  // Добавить ученика
  if (!classObj.students.includes(studentId)) {
    classObj.students.push(studentId);
    await classObj.save();
    await User.findByIdAndUpdate(studentId, { class: classObj._id });
  }
  res.json(classObj);
});

router.delete('/:id/students/:studentId', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
  const classObj = await Class.findOne({ _id: req.params.id, teacher: req.user.userId });
  if (!classObj) return res.status(404).json({ message: 'Class not found' });

  classObj.students = classObj.students.filter(sid => sid.toString() !== req.params.studentId);
  await classObj.save();
  await User.updateOne({ _id: req.params.studentId, class: classObj._id }, { $unset: { class: "" } });
  res.json(classObj);
});

// Назначить книги классу
router.put('/:id/books', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
  const { books } = req.body; // массив id книг
  const updated = await Class.findOneAndUpdate(
    { _id: req.params.id, teacher: req.user.userId },
    { books },
    { new: true }
  ).populate('books', 'title author');
  res.json(updated);
});

// Получить книги, доступные ученику (по его классу)
router.get('/student/books', auth, async (req, res) => {
  const user = await User.findById(req.user.userId).populate({
    path: 'class',
    populate: { path: 'books', select: 'title author cover steps' }
  });
  if (!user.class) return res.json([]);
  res.json(user.class.books);
});

router.get('/:id/book-stats', auth, async (req, res) => {
  const classId = req.params.id;
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
  const cls = await Class.findOne({ _id: classId, teacher: req.user.userId }).populate('students').populate('books');
  if (!cls) return res.status(404).json({ message: 'Class not found' });
  const stats = {};
  for (const book of cls.books) {
    let started = 0, finished = 0;
    for (const student of cls.students) {
      const progress = await UserBookProgress.findOne({ user: student._id, book: book._id });
      if (progress) {
        started++;
        if (book.steps.length > 0 && progress.currentStep >= book.steps.length) finished++;
      }
    }
    stats[book._id.toString()] = { started, finished };
  }
  res.json(stats);
});

module.exports = router;
