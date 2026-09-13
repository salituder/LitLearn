const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('../models/User');
const Book = require('../models/Book');

const names = [
  'Алексей Смирнов', 'Дмитрий Иванов', 'Иван Петров', 'Михаил Соколов',
  'Андрей Кузнецов', 'Сергей Попов', 'Никита Васильев', 'Анна Новикова',
  'Мария Морозова', 'Екатерина Волкова', 'Анастасия Павлова',
  'Елена Фёдорова', 'Ольга Михайлова', 'Дарья Орлова'
];

async function seed() {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  const password = process.env.DEMO_USER_PASSWORD || 'TestUser2026!';
  const shuffled = [...names];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const hash = await bcrypt.hash(password, 8);
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lit_app', { serverSelectionTimeoutMS: 5000 });
    await Book.updateOne({ title: 'Невский проспект', author: { $in: ['Н.В. Гоголь', 'Гоголь Николай Васильевич'] } }, { $set: { author: 'Николай Васильевич Гоголь' } });
    const result = await User.bulkWrite(shuffled.map((displayName, index) => {
      const suffix = String(index + 1).padStart(2, '0');
      const username = 'test_student_' + suffix;
      return { updateOne: {
        filter: { username },
        update: { $setOnInsert: {
          username, displayName, email: username + '@example.test', password: hash,
          dateOfBirth: new Date(Date.UTC(2008, index % 12, index + 1)), role: 'student'
        } },
        upsert: true
      } };
    }));
    const users = await User.find({ username: { $in: names.map((_, index) => 'test_student_' + String(index + 1).padStart(2, '0')) } }).select('username displayName role').lean();
    console.log(JSON.stringify({ database: mongoose.connection.name, created: result.upsertedCount, existing: result.matchedCount, users }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seed().catch(error => { console.error(error.message); process.exitCode = 1; });
}
