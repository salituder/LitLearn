require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const auth = require('./middleware/auth');
const User = require('./models/User');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: "*" }
});
const PORT = process.env.PORT || 5000;

// Настройки CORS + JSON
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lit_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.log('MongoDB connection error:', err);
});

// Простейший тестовый маршрут
app.get('/', (req, res) => {
  res.send('API is working!');
});

app.get('/api/me', auth, async (req, res) => {
  const user = await User.findById(req.user.userId)
    .populate('achievements');
  if (!user) return res.status(400).json({ message: 'Not found' });
  res.json({
    user: {
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      xp: user.xp,
      level: user.level,
      achievements: user.achievements,
      role: user.role
    }
  });
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const booksRouter = require('./routes/books');
app.use('/api/books', booksRouter);

const leaderboardRoutes = require('./routes/leaderboard');
app.use('/api/leaderboard', leaderboardRoutes);

const gamifyRoutes = require('./routes/gamify');
const Achievement = require('./models/Achievement');
app.use('/api/gamify', gamifyRoutes);

const friendsRoutes = require('./routes/friends');
app.use('/api/friends', friendsRoutes);

const progressRouter = require('./routes/progress');
app.use('/api/progress', progressRouter);

const classRoutes = require('./routes/classes');
app.use('/api/classes', classRoutes);

const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);

const userSockets = new Map();

io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
  });

  socket.on('disconnect', () => {
    for (const [userId, sockId] of userSockets.entries()) {
      if (sockId === socket.id) userSockets.delete(userId);
    }
  });
});

const messagesRoutes = require('./routes/messages')(io, userSockets);
app.use('/api/messages', messagesRoutes);

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

module.exports = { io, userSockets };