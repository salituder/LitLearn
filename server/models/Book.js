const mongoose = require('mongoose');

const BookStepSchema = new mongoose.Schema({
  order: Number, // порядок шага
  type: { type: String, enum: ['text', 'quiz', 'unity'], required: true },
  title: String,
  text: String, // для текстовых шагов
  quiz: {
    question: String,
    options: [String],
    answer: Number // индекс правильного ответа
  },
  unityScene: String // имя/ссылка на сцену, если type === 'unity'
});

const BookSchema = new mongoose.Schema({
  title: String,
  author: String,
  steps: [BookStepSchema]
});

module.exports = mongoose.model('Book', BookSchema);