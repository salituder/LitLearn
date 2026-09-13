const mongoose = require('mongoose');
const path = require('path');
const Book = require('../models/Book');
const steps = require('./addZherebenokActivities');

async function addUnity() {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lit_app', { serverSelectionTimeoutMS: 5000 });
    const book = await Book.findOne({ title: { $in: ['Жеребёнок', 'Жеребенок'] }, author: 'Михаил Александрович Шолохов' });
    if (!book) throw new Error('Книга не найдена');
    const scene = '/unity/scene1/index.html';
    if (book.steps.at(-1)?.unityScene === scene) {
      console.log('Unity уже является последним шагом.');
      return;
    }
    if (book.steps.length !== 9 || book.steps.some(step => step.unityScene === scene)) {
      throw new Error('Структура книги отличается от ожидаемой; обновление отменено.');
    }
    const result = await Book.updateOne(
      { _id: book._id, steps: { $size: 9 } },
      { $push: { steps: steps.at(-1) } },
      { runValidators: true }
    );
    if (result.modifiedCount !== 1) throw new Error('Книга изменена параллельно; обновление отменено.');
    // Прежний конец (currentStep = 9) теперь открывает финальную игру.
    console.log(JSON.stringify({ database: mongoose.connection.name, title: book.title, steps: 10, lastScene: scene }));
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  addUnity().catch(error => { console.error(error.message); process.exitCode = 1; });
}
