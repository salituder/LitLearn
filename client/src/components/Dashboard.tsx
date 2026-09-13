import React, { useState, useEffect, useCallback } from 'react';
import './Achievements.css';
import './Dashboard.css';
import Leaderboard from './Leaderboard';
import Friends from './Friends';
import ChatList from './ChatList';
import Chat from './Chat';
import { socket } from "../socket";
import BookReader from './BookReader';

const API_URL = 'http://localhost:5000/api/books';

function Dashboard() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [user, setUser] = useState<{ displayName: string; username: string; xp?: number; level?: number; achievements?: any[] } | null>(null);
  const [achieveOpen, setAchieveOpen] = useState(false);
  const [toast, setToast] = useState<{ title: string; text: string } | null>(null);
  const [mainView, setMainView] = useState<'books' | 'achievements' | 'friends' | 'leaderboard' | 'chats'>('books');
  const [sideTab, setSideTab] = useState<'chats' | 'friends'>('chats');
  const [chatFriend, setChatFriend] = useState<any | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chats, setChats] = useState<any[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  // Цвета и стили
  const COLOR_BG_MAIN = "#382c23";
  const COLOR_BG_PANEL = "#564433";
  const COLOR_ACCENT = "#826753e3";
  const COLOR_ACCENT_HOVER = "#a7866b";
  const COLOR_CARD = "#f6eee8";
  const COLOR_TEXT = "#f8ece2";
  const COLOR_TEXT_DARK = "#33271f";
  const COLOR_GREEN = "#7fc68e";

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setBooks(data));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch("http://localhost:5000/api/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data.user));
  }, []);

  useEffect(() => {
    // Подписка на новые сообщения для обновления счетчика и списка чатов
    const handler = () => {
      updateChatsAndUnread();
    };
    socket.on('new_message', handler);

    // При монтировании сразу обновить
    updateChatsAndUnread();

    return () => {
      socket.off('new_message', handler);
    };
  }, []);

  const currentBook = books.find(b => b._id === selectedBook);

  function showToast(title: string, text: string) {
    setToast({ title, text });
    setTimeout(() => setToast(null), 3400);
  }

  // Получение достижения за первое прочтение первой главы!
  async function handleCompleteChapter() {
    if (
      user &&
      user.achievements &&
      !user.achievements.some((a: any) => a.code === 'first_chapter') &&
      selectedChapter === 0
    ) {
      const token = localStorage.getItem('token');
      const resp = await fetch('http://localhost:5000/api/gamify/achievement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: 'first_chapter' })
      });
      fetch("http://localhost:5000/api/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setUser(data.user);
          if (resp.ok) {
            showToast('Достижение!', 'Вы получили достижение: "Первое погружение" 🎉');
          }
        });
    }
  }

  // Функция для обновления счетчика
  const updateChatsAndUnread = useCallback(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/messages", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setChats(data);
        const totalUnread = data.reduce((sum: number, chat: any) => sum + (chat.unread || 0), 0);
        setUnreadCount(totalUnread);
      })
      .catch(err => {
        console.error("Ошибка при обновлении чатов:", err);
      });
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: "100vh",
      minHeight: 0,
      flexShrink: 0,
      overflow: "hidden",
      background: `linear-gradient(135deg, ${COLOR_ACCENT} 42%, ${COLOR_BG_MAIN} 100%)`
    }}>
      {/* Всплывающее уведомление */}
      {toast && (
        <div className="toast-appear" style={{
          position: "fixed", bottom: 30, right: 30, minWidth: 320,
          background: COLOR_ACCENT,
          color: COLOR_TEXT,
          padding: "18px 36px 18px 18px",
          borderRadius: 11, boxShadow: "0 8px 30px #2227", zIndex: 2000,
          fontSize: 18, display: "flex", alignItems: "center", gap: 14
        }}>
          <span role="img" aria-label="award" style={{ fontSize: 36 }}>🏆</span>
          <div>
            <b>{toast.title}</b><br />
            <span style={{ fontSize: 16 }}>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Модальное окно достижений */}
      {achieveOpen && (
        <div
          style={{
            position: "fixed", left: 0, top: 0, zIndex: 999, width: "100vw", height: "100vh",
            background: "rgba(28, 29, 32, 0.73)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}
          onClick={() => setAchieveOpen(false)}
        >
          <div
            className="modal-fade achievements-modal"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setAchieveOpen(false)}
              style={{
                position: "absolute", top: 18, right: 27, background: "none", border: "none",
                color: "#888", fontSize: 28, cursor: "pointer"
              }}
              title="Закрыть"
            >&times;</button>
            <h2 style={{ margin: 0 }}>Мои достижения</h2>
            <hr />
            {user?.achievements && user.achievements.length > 0 ? (
              <ul style={{ color: "#263", fontSize: 17 }}>
                {user.achievements.map((a: any) => (
                  <li key={a._id} style={{ marginBottom: 16, listStyle: "none", display: "flex", alignItems: "center", gap: 15, backgroundColor: COLOR_ACCENT_HOVER, borderRadius: 10, padding: 10, borderColor: COLOR_ACCENT_HOVER }}>
                    <img src={a.icon || "https://cdn-icons-png.flaticon.com/512/1828/1828884.png"} alt="achv" width={40} height={40} style={{ borderRadius: 10}} />
                    <span>
                      <b>{a.title}</b><br />
                      <span style={{ color: "#555" }}>{a.description}</span>
                      <span style={{ color: "#999", fontSize: 14 }}>&nbsp;(+{a.xpReward || 0} XP)</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : <div>Пока нет достижений</div>}
          </div>
        </div>
      )}

      {/* Левая панель */}
      <div style={{
        background: COLOR_BG_PANEL,
        width: 250,
        minWidth: 250,
        flexShrink: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
        boxShadow: "0 0 14px #0004"
      }}>
        <div>
          <div style={{
            fontWeight: "bold",
            fontSize: 28,
            color: "#fff",
            margin: "26px 18px 36px 18px",
            textShadow: "0 2px 10px #0006"
          }}>
            LitLearn
          </div>
          <nav className="lit-sidebar-nav" aria-label="Основная навигация">
            {selectedBook ? (
              <button type="button" className="lit-nav-button" onClick={() => setSelectedBook(null)}>
                <span className="lit-nav-icon" aria-hidden="true">←</span>
                Назад к книгам
              </button>
            ) : (
              ([
                { id: 'books', icon: '📚', label: 'Выбор книги' },
                { id: 'achievements', icon: '🏆', label: 'Мои достижения' },
                { id: 'friends', icon: '🤝', label: 'Друзья' },
                { id: 'leaderboard', icon: '🥇', label: 'Лидерборд' },
                { id: 'chats', icon: '💬', label: 'Чаты' }
              ] as const).map(item => {
                const active = achieveOpen ? item.id === 'achievements' : mainView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`lit-nav-button${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => item.id === 'achievements' ? setAchieveOpen(true) : setMainView(item.id)}
                  >
                    <span className="lit-nav-icon" aria-hidden="true">{item.icon}</span>
                    {item.label}
                    {item.id === 'chats' && unreadCount > 0 && (
                      <span className="lit-unread-badge" aria-label={`${unreadCount} непрочитанных`}>{unreadCount}</span>
                    )}
                  </button>
                );
              })
            )}
          </nav>
        </div>

        {/* Подвал: пользователь */}
        <div style={{
          borderTop: "1px solid rgb(143, 110, 83)",
          padding: "13px 15px",
          display: "flex",
          alignItems: "center",
          background: COLOR_BG_PANEL
        }}>
          <div style={{
            width: 38, height: 38,
            borderRadius: "50%",
            background: COLOR_ACCENT,
            display: "flex", justifyContent: "center", alignItems: "center",
            color: "#fff", fontWeight: 700, fontSize: 19,
            marginRight: 10,
            userSelect: "none"
          }}>
            {user?.displayName ? user.displayName[0].toUpperCase() : "U"}
          </div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
              {user?.displayName || "Loading"}
            </div>
            <div style={{ color: "#b9bbbe", fontSize: 13 }}>
              {user?.username || ""}
              <br />
              XP: {user?.xp ?? 0} | Level: {user?.level ?? 1}
            </div>
          </div>
          <span style={{ marginLeft: "auto", color: "#b9bbbe", fontSize: 25, cursor: "pointer" }} title="Настройки">&#9881;</span>
        </div>
      </div>

      {/* Центральная панель */}
      <div style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        overflowY: "auto",
        padding: "24px 24px 0 24px",
        background: COLOR_BG_MAIN,
        display: "flex",
        flexDirection: "column",
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        boxShadow: "0 0 14px #0004"
      }}>
        {/* Галерея книг */}
        {mainView === 'books' && !selectedBook && (
          <>
            <div style={{
              marginBottom: 30,
              fontSize: 30,
              fontWeight: 700,
              color: "#fff"
            }}>Выбор книги</div>
            <div className="lit-book-grid">
              {[...books].sort((a, b) => Number(/^Жереб[её]нок$/.test(b.title)) - Number(/^Жереб[её]нок$/.test(a.title))).map(b => (
                <button
                  key={b._id}
                  type="button"
                  className="lit-book-card"
                  disabled={!Array.isArray(b.steps) || b.steps.length === 0}
                  onClick={() => { setSelectedBook(b._id); setSelectedChapter(0); }}
                >
                  {b.cover ? (
                    <img className="lit-book-cover" src={b.cover} alt={`Обложка: ${b.title}`} />
                  ) : (
                    <div className="lit-book-cover lit-book-cover-placeholder" aria-hidden="true">
                      <span>{b.author}</span>
                      <strong>{b.title}</strong>
                      <small>LitLearn</small>
                    </div>
                  )}
                  <span className="lit-book-title">{b.title}</span>
                  <span className="lit-book-author">{b.author}</span>
                  <span className="lit-book-action">{Array.isArray(b.steps) && b.steps.length > 0 ? 'Читать →' : 'Скоро · текст ещё не добавлен'}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ВЫБРАННАЯ КНИГА: только BookReader */}
        {mainView === 'books' && selectedBook && currentBook && (!Array.isArray(currentBook.steps) || currentBook.steps.length === 0) && (
          <div style={{ color: "#aaa", margin: 20 }}>В этой книге пока нет интерактивных шагов.</div>
        )}
        {mainView === 'books' && selectedBook && currentBook && Array.isArray(currentBook.steps) && currentBook.steps.length > 0 && (
          <>
            <div style={{
              background: COLOR_BG_PANEL,
              borderRadius: 8,
              padding: "15px 26px",
              color: COLOR_TEXT,
              fontSize: 18,
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <span>Выбранная книга: <span style={{ fontWeight: 800 }}>{currentBook.title}</span></span>
              <span>Автор: {currentBook.author}</span>
              <button onClick={() => setSelectedBook(null)}
                style={{
                  background: COLOR_BG_MAIN, color: COLOR_TEXT,
                  border: "none", borderRadius: 6,
                  padding: "5px 17px", fontWeight: 700, cursor: "pointer"
                }}>
                Назад
              </button>
            </div>
            <BookReader bookId={selectedBook} />
          </>
        )}

        {/* Лидерборд */}
        {mainView === 'leaderboard' && (
          <Leaderboard myUser={user?.username || ""} />
        )}

        {/* Друзья */}
        {mainView === 'friends' && (
          <Friends />
        )}

        {/* Содержимое выбранной вкладки */}
        {mainView === 'chats' && (
          <div style={{ display: "flex", height: "100%" }}>
            <div style={{
              width: 320,
              borderRight: "1px solid #cbb49a",
              background: "#e3cdb6",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              borderTopLeftRadius: 18,
              borderBottomLeftRadius: 18
            }}>
              <ChatList onSelectChat={setChatFriend} selected={chatFriend} chats={chats} updateChats={updateChatsAndUnread} />
            </div>
            <div style={{
              flex: 1,
              minWidth: 0,
              background: "#e3cdb6",
              display: "flex",
              flexDirection: "column",
              borderTopRightRadius: 18,
              borderBottomRightRadius: 18
            }}>
              {chatFriend
                ? <Chat friend={chatFriend} onBack={() => setChatFriend(null)} updateChatsAndUnread={updateChatsAndUnread} />
                : <div style={{
                    color: "#888",
                    fontSize: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%"
                  }}>Выберите чат</div>
              }
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
