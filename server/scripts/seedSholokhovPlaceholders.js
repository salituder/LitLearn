const mongoose = require('mongoose');
const path = require('path');
const Book = require('../models/Book');

const titles = [
  'Тихий Дон',
  'Судьба человека',
  'Поднятая целина',
  'Донские рассказы',
  'Они сражались за Родину',
  'Наука ненависти',
  'Нахалёнок',
  'Родинка',
  'Чужая кровь',
  'Алёшкино сердце',
  'Шибалково семя',
  'Продкомиссар',
  'Бахчевник',
  'Пастух'
];
const author = 'Михаил Александрович Шолохов';

async function seed() {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lit_app', { serverSelectionTimeoutMS: 5000 });
    const result = await Book.bulkWrite(titles.map(title => ({
      updateOne: {
        filter: { title, author },
        update: { $setOnInsert: { title, author, steps: [] } },
        upsert: true
      }
    })));
    const placeholders = await Book.find({ title: { $in: titles }, author }).lean();
    if (placeholders.length !== titles.length) throw new Error('Не все книги найдены после добавления');
    const readable = await Book.findOne({ title: { $in: ['Жеребёнок', 'Жеребенок'] }, author });
    console.log(JSON.stringify({ database: mongoose.connection.name, created: result.upsertedCount, existing: result.matchedCount, placeholders: placeholders.filter(book => book.steps.length === 0).length, zherebenokSteps: readable?.steps.length }));
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seed().catch(error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = titles;
