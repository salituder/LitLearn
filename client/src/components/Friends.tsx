import React, { useEffect, useState } from "react";

function Friends() {
  const [friends, setFriends] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  // Получить список друзей
  useEffect(() => {
    fetch("http://localhost:5000/api/friends", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setFriends(data));
  }, [token]);

  // Поиск пользователей
  const handleSearch = async () => {
    if (!search.trim()) return setResults([]);
    const res = await fetch(`http://localhost:5000/api/friends/search?q=${encodeURIComponent(search)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setResults(await res.json());
  };

  // Добавить в друзья
  const addFriend = async (username: string) => {
    await fetch("http://localhost:5000/api/friends/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username }),
    });
    setMessage("Друг добавлен!");
    setResults([]);
    // Обновить друзей
    fetch("http://localhost:5000/api/friends", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setFriends(data));
  };

  return (
    <div style={{ maxWidth: 480, margin: "35px auto", background: "#f6eee8", borderRadius: 12, padding: 26 }}>
      <h2 style={{ color: "#826753", margin: "0 0 14px 0", fontWeight: 900 }}>Мои друзья</h2>
      <ul style={{ paddingLeft: 0 }}>
        {friends.map(f => (
          <li key={f.username} style={{ marginBottom: 8, listStyle: "none", padding: "6px 0" }}>
            {f.displayName} <span style={{ color: "#a7866b" }}>@{f.username}</span>
          </li>
        ))}
        {friends.length === 0 && <li style={{ color: "#a7866b" }}>Нет друзей</li>}
      </ul>
      <hr style={{ margin: "18px 0" }} />
      <div>
        <label style={{ fontWeight: 700, color: "#7c6860" }}>Найти пользователя:</label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ margin: "0 10px 0 12px", borderRadius: 7, border: "1px solid #c9b5a4", padding: "4px 8px", fontSize: 17 }}
        />
        <button onClick={handleSearch} style={{
          background: "#826753", color: "#fff", border: "none", borderRadius: 7, padding: "4px 13px"
        }}>Найти</button>
        <ul style={{ paddingLeft: 0 }}>
          {results.map(u => (
            <li key={u.username} style={{ margin: "5px 0", listStyle: "none" }}>
              {u.displayName || u.username} <span style={{ color: "#a7866b" }}>@{u.username}</span>
              <button onClick={() => addFriend(u.username)}
                style={{ marginLeft: 10, background: "#a7866b", color: "#fff", border: "none", borderRadius: 7, padding: "2px 9px", fontWeight: 600 }}>
                + В друзья
              </button>
            </li>
          ))}
        </ul>
        {message && <div style={{ color: "#388c3c", marginTop: 6 }}>{message}</div>}
      </div>
    </div>
  );
}

export default Friends;