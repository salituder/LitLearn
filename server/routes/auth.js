const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Логин
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Пользователь не найден' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Неверный пароль' });

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );
    res.json({ 
      token, 
      user: { 
        _id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role, 
        displayName: user.displayName 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Регистрация
router.post('/register', async (req, res) => {
    try {
      let { username, displayName, email, password, dateOfBirth, role } = req.body;
      dateOfBirth = new Date(dateOfBirth);
      if (!displayName || !dateOfBirth || isNaN(dateOfBirth.getTime())) {
        return res.status(400).json({ message: 'Поля displayName и dateOfBirth обязательны и корректны!' });
      }
      let candidate = await User.findOne({$or:[{username},{email}]});
      if (candidate) return res.status(400).json({message:'Пользователь уже существует'});
      const hash = await bcrypt.hash(password, 8);
      const user = await User.create({
        username,
        displayName,
        email,
        password: hash,
        dateOfBirth,
        role
      });
      res.json({ message: 'Регистрация успешна', user: { username, email, role, displayName } });
    } catch (err) {
      console.error('Ошибка при регистрации:', err);
      res.status(500).json({ message: 'Ошибка сервера', error: String(err) });
    }
  });

module.exports = router;