const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Получить все книги
router.get('/', async (req, res) => {
  const books = await Book.find({}, 'title author cover steps');
  res.json(books);
});

// Получить одну книгу с шагами
router.get('/:id', async (req, res) => {
  const book = await Book.findById(req.params.id);
  res.json(book);
});


module.exports = router;