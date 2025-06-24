import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import TeacherDashboard from './components/TeacherDashboard';
import './components/Login.css';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { socket } from "./socket";
import { useCurrentUser } from './hooks/useCurrentUser';
import MatchGameNevsky from "./components/MatchGameNevsky";

const isLoggedIn = !!localStorage.getItem('token');

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const { user, loading } = useCurrentUser();
  const [showNevskyGame, setShowNevskyGame] = useState(false);

  useEffect(() => {
    // Разрешить воспроизведение аудио после первого клика (без звука)
    const unlockAudio = () => {
      const audio = document.getElementById('global-audio') as HTMLAudioElement;
      if (audio) {
        audio.load();
        setAudioUnlocked(true);
        window.removeEventListener('click', unlockAudio);
      }
    };
    window.addEventListener('click', unlockAudio);
    return () => window.removeEventListener('click', unlockAudio);
  }, []);

  useEffect(() => {
    const myUsername = localStorage.getItem("username");
    const userId = localStorage.getItem("userId");
    if (userId) {
      socket.emit('register', userId);
    }
    socket.on('new_message', (data) => {
      if (data.sender.username !== myUsername) {
        toast.info(`Новое сообщение от ${data.sender.displayName || data.sender.username}: ${data.content}`);
        // Воспроизводить звук только если пользователь уже кликал по странице
        if (audioUnlocked) {
          const audio = document.getElementById('global-audio') as HTMLAudioElement;
          if (audio) audio.play().catch(() => {});
        }
      }
    });
    return () => {
      socket.off('new_message');
    };
  }, [audioUnlocked]);

  if (loading) return <div>Загрузка...</div>;

  if (!user) {
    return (
      <div className="login-bg">
        <div className="login-card" style={{ minHeight: 550 }}>
          {showRegister ? (
            <Register onShowLogin={() => setShowRegister(false)} />
          ) : (
            <Login onShowRegister={() => setShowRegister(true)} />
          )}
        </div>
      </div>
    );
  }

  // Проверка роли
  if (user.role === "teacher") {
    return <TeacherDashboard />;
  }

  // По умолчанию — ученик
  if (showNevskyGame) {
    return <MatchGameNevsky onBack={() => setShowNevskyGame(false)} />;
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <audio id="global-audio" src="/notify.mp3" preload="auto" />
      <Dashboard onShowNevskyGame={setShowNevskyGame} />
      <ToastContainer position="bottom-right" autoClose={4000} />
    </div>
  );
}

export default App;