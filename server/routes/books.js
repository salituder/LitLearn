const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { resolveBookCover } = require('../services/bookCovers');

// Получить все книги
router.get('/', async (req, res) => {
  const books = await Book.find({}, 'title author cover steps');
  res.json(books);
});

// Получить одну книгу с шагами
router.get('/:id/cover', async (req, res) => {
  const book = await Book.findById(req.params.id).select('title author cover coverCheckedAt');
  if (!book) return res.status(404).json({ message: 'Book not found' });
  res.json({ cover: await resolveBookCover(book) });
});

router.get('/:id', async (req, res) => {
  const book = await Book.findById(req.params.id);
  res.json(book);
});


module.exports = router;
