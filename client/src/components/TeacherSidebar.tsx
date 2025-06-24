import React from "react";

const COLOR_BG_PANEL = "#564433";
const COLOR_ACCENT = "#826753e3";
const COLOR_ACCENT_HOVER = "#a7866b";

const navBtnStyle = (active: boolean) => ({
  display: "flex",
  alignItems: "center",
  background: active ? COLOR_ACCENT_HOVER : COLOR_ACCENT,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  margin: "10px 16px",
  padding: "12px 16px",
  fontSize: 17,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s",
  boxShadow: active ? "0 2px 8px #0001" : "none"
});

export default function TeacherSidebar({ activeTab, setActiveTab, user }: { activeTab: string, setActiveTab: (tab: string) => void, user: any }) {
  return (
    <div style={{
      width: 220,
      minHeight: "100vh",
      background: COLOR_BG_PANEL,
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      boxShadow: "2px 0 8px #0002",
      padding: "0 0 12px 0"
    }}>
      <div style={{ fontWeight: 700, fontSize: 22, color: "#fff", margin: "24px 0 18px 24px" }}>
        LitLearn
      </div>
      <button style={navBtnStyle(activeTab === "classes")} onClick={() => setActiveTab("classes")}>
        📚 <span style={{ marginLeft: 10 }}>Классы</span>
      </button>
      <button style={navBtnStyle(activeTab === "stats")} onClick={() => setActiveTab("stats")}>
        📊 <span style={{ marginLeft: 10 }}>Статистика</span>
      </button>
      <button style={navBtnStyle(activeTab === "messages")} onClick={() => setActiveTab("messages")}>
        💬 <span style={{ marginLeft: 10 }}>Сообщения</span>
      </button>
      <div style={{ flex: 1 }} />
      {/* Нижний бар с профилем */}
      <div style={{
        background: "#826753",
        color: "#fff",
        borderRadius: 12,
        margin: "0 16px",
        padding: 10,
        display: "flex",
        alignItems: "center"
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", background: "#a7866b",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, marginRight: 10
        }}>
          {user?.displayName ? user.displayName[0] : "?"}
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>{user?.displayName || "..."}</div>
          <div style={{ fontSize: 13, color: "#e0c7a0" }}>@{user?.username || ""}</div>
        </div>
        <button style={{
          marginLeft: "auto", background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer"
        }} title="Настройки/Выход">
          ⚙️
        </button>
      </div>
    </div>
  );
}
