import React, { useState } from 'react';
import './Login.css';

interface LoginProps {
  onShowRegister: () => void;
}

const API_URL = 'http://localhost:5000/api/auth/login';

const Login: React.FC<LoginProps> = ({ onShowRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('displayName', data.user.displayName);
        localStorage.setItem('userId', data.user._id);
        window.location.reload();
      } else {
        setError(data.message || 'Ошибка входа');
      }
    } catch {
      setError('Ошибка сети');
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>Добро пожаловать!</h2>
      <p className="subtitle">Мы рады видеть вас снова!</p>
      <label>ИМЯ ПОЛЬЗОВАТЕЛЯ (USERNAME)</label>
      <input
        type="text"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
        autoFocus
      />
      <label>ПАРОЛЬ (PASSWORD)</label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <div className="login-bottom">
        <a
          href="#"
          style={{ color: '#00aaff', fontSize: 13, textDecoration: 'underline' }}
        >Забыли свой пароль?</a>
      </div>
      <button type="submit" className="login-btn">
        Войти
      </button>
      <div className="register-link">
        Нужен аккаунт?{" "}
        <a href="#" onClick={e => { e.preventDefault(); onShowRegister(); }}>
          Зарегистрироваться
        </a>
      </div>
      {error && <div className="error">{error}</div>}
    </form>
  );
};

export default Login;