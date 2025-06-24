import React, { useEffect, useState } from 'react';
import { toast } from "react-toastify";
import Chat from "./Chat";
import ChatList from "./ChatList";
import TeacherSidebar from "./TeacherSidebar";

const COLOR_BG_PANEL = "#564433";
const COLOR_ACCENT = "#826753e3";
const COLOR_ACCENT_HOVER = "#a7866b";
const COLOR_CARD = "#f6eee8";
const COLOR_TEXT = "#382c23";

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<any[]>([]);
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [profileModal, setProfileModal] = useState<{open: boolean, student: any, progress: any} | null>(null);
  const [bookStats, setBookStats] = useState<{[bookId: string]: {started: number, finished: number}}>({});
  const [bookSearch, setBookSearch] = useState('');
  const [activeTab, setActiveTab] = useState("classes");
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch('/api/classes/my', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(setClasses);
    fetch('/api/books').then(res => res.json()).then(setAllBooks);
  }, []);

  useEffect(() => {
    fetch('/api/books/stats').then(res => res.json()).then(setBookStats);
  }, []);

  // Получаем данные пользователя (для нижнего бара)
  useEffect(() => {
    if (!token) return;
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setUser(data.user));
  }, []);

  const createClass = async () => {
    if (!newClassName.trim()) return;
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newClassName })
    });
    const data = await res.json();
    setClasses([...classes, data]);
    setNewClassName('');
  };

  const selectClass = (cls: any) => setSelectedClass(cls);

  // Поиск учеников
  useEffect(() => {
    if (!studentSearch.trim()) {
      setStudentResults([]);
      return;
    }
    setSearchLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(studentSearch)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(users => {
          console.log("Результаты поиска:", users);
          setStudentResults(users);
          setSearchLoading(false);
        });
    }, 400);
    return () => clearTimeout(timeout);
  }, [studentSearch]);

  const addStudent = async (studentId: string) => {
    await fetch(`/api/classes/${selectedClass._id}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ studentId })
    });
    // Обновить класс
    const updated = await fetch(`/api/classes/my`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());
    setClasses(updated);
    setSelectedClass(updated.find((c: any) => c._id === selectedClass._id));
    setStudentSearch('');
    setStudentResults([]);
    toast.success("Ученик добавлен!");
  };

  const assignBooks = async (bookIds: string[]) => {
    await fetch(`/api/classes/${selectedClass._id}/books`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ books: bookIds })
    });
    // Обновить класс
    const updated = await fetch(`/api/classes/my`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());
    setClasses(updated);
    setSelectedClass(updated.find((c: any) => c._id === selectedClass._id));
  };

  const alreadyInClass = selectedClass?.students?.map((s: any) => s._id) || [];
  const filteredResults = studentResults.filter(u => !alreadyInClass.includes(u._id));

  // Получение статистики по книгам для выбранного класса
  useEffect(() => {
    if (!selectedClass) return;
    fetch(`/api/classes/${selectedClass._id}/book-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setBookStats);
  }, [selectedClass]);

  // Открыть модалку профиля ученика
  const openStudentProfile = async (student: any) => {
    const res = await fetch(`/api/users/${student._id}/progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const progress = await res.json();
    setProfileModal({ open: true, student, progress });
  };

  const filteredBooks = allBooks.filter(book =>
    book.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
    book.author.toLowerCase().includes(bookSearch.toLowerCase())
  );

  const selectedBookIds = selectedClass?.books?.map((b: any) => b._id) || [];
  const allBookIds = filteredBooks.map(b => b._id);

  // Массовое добавление/удаление
  const selectAllBooks = () => {
    if (!selectedClass) return;
    assignBooks(Array.from(new Set([...selectedBookIds, ...allBookIds])));
  };
  const deselectAllBooks = () => {
    if (!selectedClass) return;
    assignBooks(selectedBookIds.filter((id: string) => !allBookIds.includes(id)));
  };

  const fetchChats = () => {
    fetch('/api/messages/chats', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setChats(Array.isArray(data.chats) ? data.chats : []));
  };

  useEffect(() => {
    if (activeTab === "messages") fetchChats();
  }, [activeTab]);

  if (!user) {
    return <div style={{ color: "#fff", padding: 40 }}>Загрузка профиля...</div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <TeacherSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      <div style={{ flex: 1, background: "linear-gradient(135deg, #826753e3 42%, #382c23 100%)" }}>
        {activeTab === "classes" && (
          <div style={{
            background: COLOR_BG_PANEL,
            borderRadius: 16,
            boxShadow: "0 0 14px #0004",
            padding: "32px 38px",
            color: "#fff"
          }}>
            <h2 style={{ fontWeight: 900, fontSize: 32, marginBottom: 18 }}>Мои классы</h2>
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <input
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                placeholder="Название класса"
                style={{
                  borderRadius: 8, border: "1px solid #cbb49a", padding: "8px 16px", fontSize: 18, minWidth: 180
                }}
              />
              <button
                onClick={createClass}
                style={{
                  background: COLOR_ACCENT,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 22px",
                  fontWeight: 700,
                  fontSize: 18,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px #9d826744"
                }}
              >Создать класс</button>
            </div>
            <ul style={{ display: "flex", gap: 16, listStyle: "none", padding: 0, marginBottom: 30 }}>
              {classes.map(cls => (
                <li key={cls._id}>
                  <button
                    onClick={() => selectClass(cls)}
                    style={{
                      background: selectedClass && selectedClass._id === cls._id ? COLOR_ACCENT_HOVER : COLOR_ACCENT,
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 22px",
                      fontWeight: 700,
                      fontSize: 18,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px #9d826744"
                    }}
                  >{cls.name}</button>
                </li>
              ))}
            </ul>
            {selectedClass ? (
              <div style={{
                background: COLOR_CARD,
                color: COLOR_TEXT,
                borderRadius: 12,
                padding: "28px 32px",
                boxShadow: "0 4px 24px #0002"
              }}>
                <h3 style={{ fontWeight: 800, fontSize: 26, marginBottom: 10 }}>Класс: {selectedClass.name}</h3>
                <h4 style={{ margin: "18px 0 8px 0", fontWeight: 700 }}>Ученики:</h4>
                <ul style={{ paddingLeft: 0, marginBottom: 18 }}>
                  {(selectedClass?.students && selectedClass.students.length > 0) ? (
                    selectedClass.students.map((s: any) => (
                      <li key={s._id} style={{
                        marginBottom: 10, listStyle: "none", display: "flex", alignItems: "center", background: "#f6eee8",
                        borderRadius: 10, padding: "6px 12px", boxShadow: "0 2px 8px #0001"
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", background: "#a7866b", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginRight: 10
                        }}>
                          {s.displayName[0]}
                        </div>
                        <span style={{ flex: 1 }}>
                          {s.displayName} <span style={{ color: "#a7866b" }}>@{s.username}</span>
                        </span>
                        <button
                          style={{
                            marginLeft: 10,
                            background: "#826753",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "2px 10px",
                            cursor: "pointer"
                          }}
                          onClick={() => openStudentProfile(s)}
                        >Профиль</button>
                        <button
                          style={{
                            marginLeft: 10,
                            background: "#f04747",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "2px 10px",
                            cursor: "pointer"
                          }}
                          onClick={async () => {
                            if (!window.confirm("Удалить ученика из класса?")) return;
                            await fetch(`/api/classes/${selectedClass._id}/students/${s._id}`, {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            // Обновить класс
                            const updated = await fetch(`/api/classes/my`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());
                            setClasses(updated);
                            setSelectedClass(updated.find((c: any) => c._id === selectedClass._id));
                            toast.info("Ученик удалён из класса.");
                          }}
                        >Удалить</button>
                      </li>
                    ))
                  ) : (
                    <li style={{ color: "#a7866b" }}>Нет учеников</li>
                  )}
                </ul>
                <div style={{ position: "relative", marginBottom: 18 }}>
                  <input
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Поиск ученика по имени или username"
                    style={{
                      borderRadius: 8, border: "1px solid #cbb49a", padding: "8px 16px", fontSize: 17, minWidth: 260
                    }}
                  />
                  {searchLoading && <span style={{ marginLeft: 10, color: "#a7866b" }}>Поиск...</span>}
                  {studentResults.length > 0 && (
                    <ul style={{
                      position: "absolute",
                      left: 0,
                      top: 38,
                      background: "#fff",
                      color: "#382c23",
                      borderRadius: 8,
                      boxShadow: "0 4px 16px #0002",
                      zIndex: 10,
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      minWidth: 260
                    }}>
                      {filteredResults.map(u => (
                        <li key={u._id}
                          style={{
                            padding: "8px 14px",
                            cursor: "pointer",
                            borderBottom: "1px solid #eee"
                          }}
                          onClick={() => addStudent(u._id)}
                        >
                          {u.displayName} <span style={{ color: "#a7866b" }}>@{u.username}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <h4 style={{ margin: "18px 0 8px 0", fontWeight: 700 }}>Книги для класса:</h4>
                <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                  <input
                    value={bookSearch}
                    onChange={e => setBookSearch(e.target.value)}
                    placeholder="Поиск книги по названию или автору"
                    style={{
                      borderRadius: 8, border: "1px solid #cbb49a", padding: "8px 16px", fontSize: 17, minWidth: 260
                    }}
                  />
                  <button
                    onClick={selectAllBooks}
                    style={{
                      background: "#826753", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 700, cursor: "pointer"
                    }}
                  >Выбрать все</button>
                  <button
                    onClick={deselectAllBooks}
                    style={{
                      background: "#f04747", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 700, cursor: "pointer"
                    }}
                  >Снять все</button>
                </div>
                <ul style={{ paddingLeft: 0, maxHeight: 220, overflowY: "auto" }}>
                  {filteredBooks.map(book => (
                    <li key={book._id} style={{ marginBottom: 8, listStyle: "none" }}>
                      <label style={{ fontSize: 17, background: selectedBookIds.includes(book._id) ? "#f6eee8" : "transparent", borderRadius: 6, padding: "2px 6px" }}>
                        <input
                          type="checkbox"
                          checked={selectedBookIds.includes(book._id)}
                          onChange={e => {
                            if (!selectedClass) return;
                            const newBooks = e.target.checked
                              ? [...selectedBookIds, book._id]
                              : selectedBookIds.filter((id: string) => id !== book._id);
                            assignBooks(newBooks);
                          }}
                          style={{ marginRight: 8 }}
                        />
                        <span title={book.description || ""}>
                          {book.title} — {book.author}
                        </span>
                        <span style={{ marginLeft: 8, color: "#a7866b" }}>
                          ({bookStats[book._id]?.started || 0} начали, {bookStats[book._id]?.finished || 0} закончили)
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <button
                  style={{
                    marginLeft: 16,
                    background: "#f04747",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 16px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                  onClick={async () => {
                    if (!window.confirm("Удалить этот класс?")) return;
                    await fetch(`/api/classes/${selectedClass._id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    const updated = await fetch(`/api/classes/my`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());
                    setClasses(updated);
                    setSelectedClass(null);
                    toast.info("Класс удалён.");
                  }}
                >Удалить класс</button>
              </div>
            ) : (
              <div style={{ color: "#fff", fontSize: 20, textAlign: "center", marginTop: 40 }}>
                Выберите класс или создайте новый
              </div>
            )}
          </div>
        )}
        {activeTab === "stats" && (
          <div>
            <h2>Статистика (в разработке)</h2>
            {/* Здесь можно добавить аналитику по классам, книгам, ученикам */}
          </div>
        )}
        {activeTab === "messages" && (
          <div style={{ display: "flex", gap: 24, minHeight: 500 }}>
            <div style={{ minWidth: 260, maxWidth: 320 }}>
              <ChatList
                chats={chats}
                selected={selectedChat}
                onSelectChat={setSelectedChat}
                updateChats={fetchChats}
              />
            </div>
            <div style={{ flex: 1 }}>
              {selectedChat ? (
                <Chat
                  friend={selectedChat}
                  onBack={() => setSelectedChat(null)}
                  updateChatsAndUnread={fetchChats}
                />
              ) : (
                <div style={{ color: "#a7866b", fontSize: 22, marginTop: 60, textAlign: "center" }}>
                  Выберите чат для переписки
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Модалка профиля */}
      {profileModal?.open && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "#0008", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#fff", color: "#382c23", borderRadius: 12, padding: 32, minWidth: 340, maxWidth: 420, boxShadow: "0 8px 32px #0004"
          }}>
            <h3 style={{ marginBottom: 8 }}>{profileModal.student.displayName} <span style={{ color: "#a7866b" }}>@{profileModal.student.username}</span></h3>
            <div style={{ marginBottom: 12 }}>
              <b>Прогресс:</b>
              <ul>
                {profileModal.progress.books?.map((b: any) => (
                  <li key={b.book._id}>
                    {b.book.title} — {b.finished ? "Завершено" : `Прогресс: ${b.progress}%`}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginBottom: 12 }}>
              <b>Достижения:</b>
              <ul>
                {profileModal.progress.achievements?.length
                  ? profileModal.progress.achievements.map((a: any) => <li key={a._id}>{a.title}</li>)
                  : <li>Нет достижений</li>}
              </ul>
            </div>
            <button
              style={{
                background: "#826753", color: "#fff", border: "none", borderRadius: 8, padding: "6px 18px", fontWeight: 700, cursor: "pointer"
              }}
              onClick={() => setProfileModal(null)}
            >Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}
