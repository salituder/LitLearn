const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

module.exports = (io, userSockets) => {
  const router = express.Router();

  // Получить переписку с другом
  router.get('/:username', auth, async (req, res) => {
    const friend = await User.findOne({ username: req.params.username });
    if (!friend) return res.status(404).json({ message: 'User not found' });

    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, receiver: friend._id },
        { sender: friend._id, receiver: req.user.userId }
      ]
    })
      .sort({ sentAt: 1 })
      .populate('sender', 'username displayName')
      .populate('receiver', 'username displayName');

    res.json(messages);
  });

  // Отправить сообщение
  router.post('/:username', auth, async (req, res) => {
    const friend = await User.findOne({ username: req.params.username });
    if (!friend) return res.status(404).json({ message: 'User not found' });

    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const message = await Message.create({
      sender: req.user.userId,
      receiver: friend._id,
      content
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username displayName')
      .populate('receiver', 'username displayName');

    const receiverSocketId = userSockets.get(friend._id.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new_message', populatedMessage);
    }

    res.json(populatedMessage);
  });

  // Получить список чатов с последним сообщением и количеством непрочитанных
  router.get('/', auth, async (req, res) => {
    const userId = req.user.userId;
    // Найти все сообщения, где пользователь — отправитель или получатель
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .sort({ sentAt: 1 })
      .populate('sender', 'username displayName')
      .populate('receiver', 'username displayName');

    // Группируем по собеседнику
    const chats = {};
    messages.forEach(msg => {
      const other = msg.sender._id.equals(userId) ? msg.receiver : msg.sender;
      if (!chats[other.username]) {
        chats[other.username] = {
          user: other,
          lastMessage: msg,
          unread: 0
        };
      }
      // Если сообщение не прочитано и адресовано текущему пользователю
      if (!msg.read && msg.receiver._id.equals(userId)) {
        chats[other.username].unread += 1;
      }
      // Обновляем последнее сообщение
      if (msg.sentAt > chats[other.username].lastMessage.sentAt) {
        chats[other.username].lastMessage = msg;
      }
    });

    res.json(Object.values(chats));
  });

  // Отметить сообщения как прочитанные
  router.post('/:username/read', auth, async (req, res) => {
    const friend = await User.findOne({ username: req.params.username });
    if (!friend) return res.status(404).json({ message: 'User not found' });

    await Message.updateMany(
      { sender: friend._id, receiver: req.user.userId, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  });

  return router;
};
