const mongoose = require('mongoose');
const path = require('path');
const Book = require('../models/Book');
const Progress = require('../models/UserBookProgress');
const original = require('./seedZherebenok');

const quiz = (title, question, options, answer) => ({ type: 'quiz', title, quiz: { question, options, answer } });
const steps = [
  original.steps[0],
  quiz('Квиз: рождение жеребёнка', 'Какое чувство жеребёнок испытал первым?',
    ['Радость', 'Любопытство', 'Ужас', 'Спокойствие'], 2),
  original.steps[1],
  quiz('Квиз: приказ командира', 'Что обнаружил эскадронный, проверяя винтовку Трофима?',
    ['Сломанный затвор', 'Отсутствие патронов', 'Погнутый ствол', 'Сломанный приклад'], 1),
  { type: 'unity', title: 'Мини-игра: кто есть кто?', unityScene: '/games/zherebenok/index.html' },
  original.steps[2],
  quiz('Квиз: человечность на войне', 'Почему вид жеребёнка мешал эскадронному во время боя?',
    ['Напоминал о доме и пробуждал сочувствие', 'Жеребёнок закрывал ему обзор', 'Он боялся лошадей', 'Он хотел продать жеребёнка'], 0),
  original.steps[3],
  quiz('Итоговый квиз: поступок Трофима', 'Как Трофим поступил, когда жеребёнок начал тонуть?',
    ['Продолжил переправу, оставив его', 'Бросился спасать жеребёнка', 'Приказал стрелять в жеребёнка', 'Повернул эскадрон назад'], 1),
  { type: 'unity', title: 'Финальная игра', unityScene: '/unity/scene1/index.html' }
].map((step, index) => ({ ...step, order: index + 1 }));

async function addActivities() {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lit_app', { serverSelectionTimeoutMS: 5000 });
    const book = await Book.findOne({ title: { $in: ['Жеребёнок', 'Жеребенок'] }, author: original.author });
    if (!book) throw new Error('Сначала добавьте книгу через seedZherebenok.js');
    if (book.steps.some(step => step.unityScene === '/games/zherebenok/index.html')) {
      console.log('Интерактив уже добавлен; книга и прогресс не изменены.');
      return;
    }
    if (book.steps.length !== 4 || book.steps.some((step, index) => step.type !== 'text' || step.text !== original.steps[index].text)) {
      throw new Error('Текст или структура книги изменены; автоматическое обновление отменено.');
    }
    // Сначала фиксируем список прогресса; новые записи не затрагиваем.
    const progress = await Progress.find({ book: book._id }).lean();
    const positions = [0, 2, 5, 7, 9];
    if (progress.some(item => !Number.isInteger(item.currentStep) || item.currentStep < 0 || item.currentStep > 4)) {
      throw new Error('Обнаружен нестандартный прогресс; автоматическое обновление отменено.');
    }
    book.steps = steps;
    await book.save();
    for (const item of progress) {
      await Progress.updateOne({ _id: item._id, currentStep: item.currentStep }, { currentStep: positions[item.currentStep] });
    }
    console.log(JSON.stringify({ database: mongoose.connection.name, title: book.title, steps: steps.length, quizzes: 4, games: 2, migratedProgress: progress.length }));
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  addActivities().catch(error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = steps;
