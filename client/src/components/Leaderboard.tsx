import React, { useEffect, useState } from 'react';

const API_URL = "http://localhost:5000/api/leaderboard";

function Leaderboard({ myUser }: { myUser: string }) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  return (
    <div
    style={{
        background: "#f6eee8",
        borderRadius: 12,
        boxShadow: "0 4px 24px #8267532a",
        width: "max(480px, 65vw)",
        maxWidth: 700,
        margin: "40px auto 0 auto",
        padding: "34px 40px 26px 40px",
        color: "#382c23",
        fontWeight: 600,
        // добавим minHeight, чтобы не было пустоты
        minHeight: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    }}
    >
      <h2 style={{
        textAlign: "center",
        margin: 0,
        fontSize: 34,
        fontWeight: 700,
        color: "#826753"
      }}>
        Лидеры недели
      </h2>
      <table style={{
        margin: "35px 0 0 0",
        width: "100%",
        borderCollapse: "separate",
        borderSpacing: "0 3px"
      }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", color: "#a7866b" }}>#</th>
            <th style={{ textAlign: "left", color: "#a7866b" }}>Пользователь</th>
            <th style={{ color: "#a7866b" }}>XP</th>
            <th style={{ color: "#a7866b" }}>Уровень</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u._id}
              style={{
                background: u.username === myUser ? "#eedbd0" : undefined,
                fontWeight: u.username === myUser ? 900 : 600,
                color: u.username === myUser ? "#826753" : "#382c23"
              }}>
              <td>{i + 1}</td>
              <td style={{ fontWeight: 700 }}>{u.displayName || u.username}</td>
              <td style={{ textAlign: "center" }}>{u.xp}</td>
              <td style={{ textAlign: "center" }}>{u.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;