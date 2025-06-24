import React, { useState } from 'react';
import './Login.css';

const API_URL = 'http://localhost:5000/api/auth/register';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Register: React.FC<{ onShowLogin: () => void }> = ({ onShowLogin }) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [month, setMonth] = useState('January');
  const [day, setDay] = useState('1');
  const [year, setYear] = useState('2008');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!accepted) {
      setError('Вы должны согласиться с правилами.');
      return;
    }
    try {
      const dateOfBirth = new Date(`${year}-${months.indexOf(month)+1}-${day}`);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, username, email, password, dateOfBirth }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Регистрация успешна! Теперь войдите.');
        setTimeout(() => { onShowLogin(); }, 1200);
      } else {
        setError(data.message || 'Ошибка регистрации');
      }
    } catch (err) {
      setError('Ошибка сети');
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} style={{ animation: 'appear 0.4s' }}>
      <h2>Создать аккаунт</h2>
      <label>ЭЛЕКТРОННАЯ ПОЧТА (EMAIL)</label>
      <input type="email" value={email} required onChange={e => setEmail(e.target.value)} />
      <label>ОТОБРАЖАЕМОЕ ИМЯ (DISPLAY NAME)</label>
      <input type="text" value={displayName} required minLength={2} onChange={e => setDisplayName(e.target.value)} />
      <label>ИМЯ ПОЛЬЗОВАТЕЛЯ (USERNAME)</label>
      <input type="text" value={username} required minLength={3} onChange={e => setUsername(e.target.value)} />
      <label>ПАРОЛЬ (PASSWORD)</label>
      <input type="password" value={password} required minLength={6} onChange={e => setPassword(e.target.value)} />
      <label>ДАТА РОЖДЕНИЯ (DATE OF BIRTH)</label>
      <div style={{ display: 'flex', gap: 10 }}>
        <select value={month} onChange={e => setMonth(e.target.value)}>
          {months.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={day} onChange={e => setDay(e.target.value)}>
          {Array.from({length: 31}, (_, i) => <option key={i+1}>{i+1}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div style={{ margin: '13px 0' }}>
        <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} id="tos" />
        <label htmlFor="tos" style={{ color: '#dadada', marginLeft: 6, fontSize: 14 }}>
          Я согласен с правилами использования и обработкой данных
        </label>
      </div>
      <button type="submit" className="login-btn">Продолжить</button>
      <div className="register-link">
        Уже есть аккаунт? <a href="#" onClick={onShowLogin}>Войти</a>
      </div>
      {error && <div className="error">{error}</div>}
      {success && <div className="success" style={{ color: '#43b581' }}>{success}</div>}
    </form>
  );
};

export default Register;