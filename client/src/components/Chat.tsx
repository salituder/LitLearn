import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { socket } from "../socket";
import "./Chat.css";

interface User {
  username: string;
  displayName: string;
}

interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
  sentAt: string;
}

export default function Chat({ friend, onBack, updateChatsAndUnread }: { friend: User, onBack: () => void, updateChatsAndUnread: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const bottomRef = useRef<HTMLDivElement>(null);
  const myUsername = localStorage.getItem("username");
  const myDisplayName = localStorage.getItem("displayName");
  const userId = localStorage.getItem("userId");
  const audioRef = useRef<HTMLAudioElement>(null);

  // Загрузка истории сообщений
  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/messages/${friend.username}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
  }, [friend.username]);

  // Отправка сообщения
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setInput("");
    const res = await fetch(`http://localhost:5000/api/messages/${friend.username}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: input })
    });
    const msg = await res.json();
    msg.sender = { username: myUsername, displayName: myDisplayName };
    msg.receiver = friend;
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  useEffect(() => {
    if (userId) {
      socket.emit('register', userId);
    }
  }, [userId]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/messages/${friend.username}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      updateChatsAndUnread();
    });
  }, [friend.username, updateChatsAndUnread]);

  useEffect(() => {
    const handler = (data: any) => {
      if (data.sender.username === friend.username) {
        setMessages(prev => [...prev, data]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        audioRef.current?.play();
        // После получения нового сообщения обновить чаты и счетчик
        updateChatsAndUnread();
      }
    };
    socket.on('new_message', handler);
    return () => { socket.off('new_message', handler); };
  }, [friend.username, updateChatsAndUnread]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "#e3cdb6",
      borderRadius: 18,
      boxShadow: "0 4px 16px #0002",
      flex: 1,
      minWidth: 0
    }}>
      <div style={{
        padding: "18px 26px 0 26px",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        background: "#e7d6c6",
        borderBottom: "1px solid #d1c1b2",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <span style={{ fontWeight: 900, color: "#826753", fontSize: 22 }}>
          Чат с {friend.displayName || friend.username}
        </span>
        <button onClick={onBack} style={{
  background: "#f5f5f5", // Светло-бежевый фон
  color: "#5c4033",       // Более глубокий оттенок
  border: "1px solid #d3c4b5",
  borderRadius: 6,
  fontSize: 18,
  cursor: "pointer",
  padding: "6px 12px",
  marginBottom: 10,
  fontWeight: 600,
  transition: "background 0.2s, transform 0.1s"
}}
  onMouseEnter={(e) => (e.currentTarget.style.background = "#e8ddd3")}
  onMouseLeave={(e) => (e.currentTarget.style.background = "#f5f5f5")}
>
  ← Назад
</button>

      </div>
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        padding: "18px 26px",
        display: "flex",
        flexDirection: "column",
        gap: 10
      }}>
        {loading ? <div>Загрузка...</div> : (
          messages.length === 0 ? <div style={{ color: "#a7866b" }}>Нет сообщений</div> :
            messages.map(m => (
              <div key={m._id} style={{
                display: "flex",
                justifyContent: m.sender.username === friend.username ? "flex-start" : "flex-end"
              }}>
                <span style={{
                  background: m.sender.username === friend.username ? "#e9dbc9" : "#cbb49a",
                  color: "#382c23",
                  borderRadius: 14,
                  padding: "10px 16px",
                  maxWidth: "60%",
                  fontWeight: 500,
                  fontSize: 16,
                  boxShadow: "0 2px 8px #0001"
                }}>
                  <b>{m.sender.displayName || m.sender.username}:</b> {m.content}
                  <div style={{
                    fontSize: 11,
                    color: "#a7866b",
                    marginTop: 4,
                    textAlign: "right"
                  }}>
                    {new Date(m.sentAt).toLocaleString()}
                  </div>
                </span>
              </div>
            ))
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} style={{
        display: "flex",
        gap: 8,
        padding: "18px 26px",
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        background: "#e7d6c6",
        borderTop: "1px solid #d1c1b2"
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{
            flex: 1,
            borderRadius: 7,
            border: "1px solid #c9b5a4",
            padding: "10px 14px",
            fontSize: 16,
            background: "#fff"
          }}
          placeholder="Введите сообщение..."
        />
        <button type="submit" style={{
          background: "#826753",
          color: "#fff",
          border: "none",
          borderRadius: 7,
          padding: "10px 22px",
          fontWeight: 600,
          fontSize: 16
        }}>Отправить</button>
      </form>

    </div>
  );
}
