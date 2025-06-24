import React, { useEffect } from "react";
import { socket } from "../socket";

export default function ChatList({ onSelectChat, selected, chats, updateChats }: { onSelectChat: (user: any) => void, selected: any, chats: any[], updateChats: () => void }) {
  useEffect(() => {
    // Обновлять список чатов при приходе нового сообщения
    socket.on('new_message', updateChats);
    return () => { socket.off('new_message', updateChats); };
  }, [updateChats]);

  return (
    <div>
      <h2 style={{ marginLeft: 10 }}>Чаты</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {chats.map(chat => (
          <li
            key={chat.user.username}
            style={{
              marginBottom: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              background: selected && selected.username === chat.user.username ? "#d2bfa6" : "transparent",
              borderRadius: 12,
              padding: "6px 8px"
            }}
            onClick={() => onSelectChat(chat.user)}
          >
            <div style={{
              width: 38, height: 38, borderRadius: "50%", background: "#826753",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 19, marginRight: 10
            }}>
              {chat.user.displayName ? chat.user.displayName[0].toUpperCase() : chat.user.username[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <b>{chat.user.displayName || chat.user.username}</b>
              <div style={{ color: "#888", fontSize: 13 }}>
                {chat.lastMessage.content}
              </div>
            </div>
            {chat.unread > 0 && (
              <span style={{
                background: "red", color: "#fff", borderRadius: "50%",
                padding: "2px 7px", fontSize: 13, fontWeight: 700, marginLeft: 8
              }}>{chat.unread}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
