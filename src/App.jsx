import { useState, useEffect, useRef } from "react";
import "./styles/main.css";
import logo from "./assets/logofixx.png";
import { getGeminiResponse } from "./services/geminiService";

function ChatLayout({
  logsOpen,
  setLogsOpen,
  messages,
  setMessages,
  input,
  setInput,
  chats,
  selectedChatId,
  setSelectedChatId,
  onNewChat,
  onDeleteChat,
  level,
}) {
  const [isLoading, setIsLoading] = useState(false);
  
  // --- 1. SETUP ATTACHMENT / FILE UPLOAD ---
  const [attachment, setAttachment] = useState(null); // State untuk file sementara
  const fileInputRef = useRef(null); // Ref untuk input file hidden

  // --- 2. SETUP AUTO-SCROLL ---
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll saat: ada pesan baru, loading berubah, atau ada attachment baru
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, attachment]);

  // --- 3. HANDLER FILE ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
  };

  // --- 4. LOGIKA KIRIM PESAN ---
  const handleSend = async () => {
    // Cek validasi: Harus ada text ATAU file, dan tidak sedang loading
    if ((!input.trim() && !attachment) || isLoading) return;

    // A. Tampilkan pesan user di UI
    const userMsg = { 
      id: Date.now(), 
      sender: "user", 
      text: input.trim(),
      fileName: attachment ? attachment.name : null // Simpan nama file utk UI
    };
    setMessages((prev) => [...prev, userMsg]);
    
    // Simpan data sementara sebelum di-reset
    const currentQuestion = input.trim();
    const currentFile = attachment; 

    // Reset Form
    setInput("");
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    setIsLoading(true);

    // B. Panggil API Gemini (Kirim Text + File)
    const aiResponseText = await getGeminiResponse(currentQuestion, level, currentFile);

    // C. Tampilkan balasan AI
    const aiMsg = { id: Date.now() + 1, sender: "ai", text: aiResponseText };
    setMessages((prev) => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`app-main ${logsOpen ? "with-logs" : "no-logs"}`}>
      {/* 75% – Chat area */}
      <div className="chat-section">
        <div className="chat-panel">
          <div className="chat-greeting">
            Halo! Aku Tutor AI ({level}). Mau belajar apa hari ini?
          </div>
          <div className="chat-subtext">
            Mulai dengan menuliskan pertanyaan, atau <strong>lampirkan foto soal</strong> matematika kamu! 📸
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-bubble ai">
                Ini adalah ruang percakapan kamu. Semua pertanyaanmu tentang
                pelajaran akan muncul di sini 😊
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble ${m.sender === "user" ? "user" : "ai"}`}
              >
                {/* Tampilkan indikator file jika user mengirim file */}
                {m.fileName && (
                   <div className="file-indicator">📎 {m.fileName}</div>
                )}
                {/* Agar format teks (bold/enter) dari Gemini terlihat rapi */}
                <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
              </div>
            ))}

            {isLoading && (
              <div className="chat-bubble ai">
                <em>Sedang menganalisis... 🤖</em>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* AREA INPUT (Wrapper baru untuk menampung Preview & Input Bar) */}
          <div className="chat-input-wrapper">
            
            {/* PREVIEW FILE (Muncul jika ada file dipilih) */}
            {attachment && (
              <div className="attachment-preview">
                <span className="attachment-name">📄 {attachment.name}</span>
                <button className="attachment-remove" onClick={removeAttachment}>✕</button>
              </div>
            )}

            <div className="chat-input-bar">
              {/* TOMBOL ATTACHMENT */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*,application/pdf" // Hanya gambar & PDF
                style={{ display: "none" }} 
              />
              <button 
                className="icon-btn attach-btn" 
                onClick={() => fileInputRef.current.click()}
                title="Tambahkan Gambar/PDF"
              >
                📎
              </button>

              <input
                className="chat-input-field"
                placeholder={attachment ? "Tambahkan keterangan..." : "Tulis pertanyaanmu di sini..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading} 
              />
              <button 
                className="chat-send-btn" 
                onClick={handleSend}
                disabled={isLoading}
              >
                {isLoading ? "..." : "Kirim"}
              </button>
            </div>
          </div>
        </div>

        {!logsOpen && (
          <button
            className="icon-btn logs-toggle-floating"
            onClick={() => setLogsOpen(true)}
            title="Tampilkan Chat Logs"
          >
            ❯
          </button>
        )}
      </div>

      {/* 25% – Chat logs */}
      <div className="logs-section">
        <div className="logs-panel">
          <div className="logs-header">
            <div className="logs-title">Chat Logs</div>
            <div className="logs-buttons">
              <button className="new-chat-btn" onClick={onNewChat}>
                New chat
              </button>
              <button
                className="icon-btn logs-toggle-btn"
                onClick={() => setLogsOpen(false)}
                title="Sembunyikan Chat Logs"
              >
                ❮
              </button>
            </div>
          </div>

          <div className="logs-list">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={
                  "log-item " + (chat.id === selectedChatId ? "active" : "")
                }
                onClick={() => setSelectedChatId(chat.id)}
              >
                <span>{chat.title}</span>

                <button
                  className="log-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  title="Hapus chat"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ level, setLevel }) {
  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-top">
          <div className="profile-avatar">DP</div>
          <div>
            <div className="profile-name">Danniel Prananda</div>
            <div className="profile-username">@username_siswa</div>
          </div>
        </div>

        <div className="profile-section-title">Jenjang Pendidikan</div>
        <div className="level-buttons">
          {["SD", "SMP", "SMA"].map((lvl) => (
            <button
              key={lvl}
              className={"level-btn " + (level === lvl ? "active" : "")}
              onClick={() => setLevel(lvl)}
            >
              {lvl}
            </button>
          ))}
        </div>
        <div style={{marginTop: "20px", fontSize: "12px", color: "#666"}}>
            *Mengubah jenjang akan mengubah gaya bahasa AI Tutor.
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("chat");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(true);
  const [level, setLevel] = useState("SMP");

  const [chats, setChats] = useState([
    { id: 1, title: "Belajar pecahan SD" },
    { id: 2, title: "Persamaan linear SMP" },
  ]);
  const [selectedChatId, setSelectedChatId] = useState(1);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleNewChat = () => {
    const newId = Date.now();
    const newChat = { id: newId, title: "Chat baru " };
    setChats((prev) => [newChat, ...prev]);
    setSelectedChatId(newId);
    setMessages([]);
    setInput("");
  };

  const handleDeleteChat = (id) => {
    setChats((prev) => prev.filter((c) => c.id !== id));

    if (selectedChatId === id) {
      setMessages([]);
      const remaining = chats.filter((c) => c.id !== id);
      setSelectedChatId(remaining[0]?.id ?? null);
    }
  };

  const handleEditProfileClick = () => {
    setSettingsOpen(false);
    setPage("profile");
  };

  const handleLogoTitleClick = () => {
    setPage("chat");
  };

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="app-header">
        <div
          className="app-header-left"
          style={{ cursor: "pointer" }}
          onClick={handleLogoTitleClick}
        >
          <img src={logo} alt="MentorkuAI logo" className="app-logo" />
          <span className="app-title">MentorkuAI</span>
        </div>

        <div className="app-header-right">
          <button
            className="icon-btn"
            onClick={() => setSettingsOpen((o) => !o)}
            title="Settings"
          >
            ⚙
          </button>

          {settingsOpen && (
            <div className="settings-menu">
              <div className="settings-user">
                <div className="settings-avatar">DP</div>
                <div>
                  <div className="settings-name">Nama Pengguna</div>
                  <div className="settings-username">@username</div>
                </div>
              </div>

              <hr />

              <div className="settings-actions">
                <button
                  className="settings-btn"
                  onClick={handleEditProfileClick}
                >
                  Edit profile
                </button>
                <button
                  className="settings-btn logout"
                  onClick={() => alert("Logout (dummy, desain saja)")}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      {page === "chat" ? (
        <ChatLayout
          logsOpen={logsOpen}
          setLogsOpen={setLogsOpen}
          messages={messages}
          setMessages={setMessages}
          input={input}
          setInput={setInput}
          chats={chats}
          selectedChatId={selectedChatId}
          setSelectedChatId={setSelectedChatId}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          level={level}
        />
      ) : (
        <ProfilePage level={level} setLevel={setLevel} />
      )}
    </div>
  );
}