const mongoose = require('mongoose');
const Book = require('../models/Book');

mongoose.connect('mongodb://localhost:27017/literalearn');

const steps = [
  {
    order: 1,
    type: 'text',
    title: 'Вступление. Общее описание Невского проспекта',
    text: `Нет ничего лучше Невского проспекта, по крайней мере в Петербурге; для него он составляет все. ... `
  },
  {
    order: 2,
    type: 'quiz',
    title: 'Квиз по вступлению',
    quiz: {
      question: 'Что, по мнению автора, является главным местом для прогулок в Петербурге?',
      options: ['Гороховая улица', 'Невский проспект', 'Морская улица', 'Литейная улица'],
      answer: 1
    }
  },
];

const book = new Book({
  title: 'Невский проспект',
  author: 'Н.В. Гоголь',
  steps
});

book.save().then(() => {
  console.log('Книга добавлена!');
  mongoose.disconnect();
});
