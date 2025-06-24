const mongoose = require('mongoose');

const UserBookProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  currentStep: { type: Number, default: 0 },
  quizzes: [Number]
});

UserBookProgressSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model('UserBookProgress', UserBookProgressSchema);
