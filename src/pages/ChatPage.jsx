import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/ChatPage.css"; 

export default function ChatPage({ 
  logsOpen, setLogsOpen, messages, onSendMessage, input, setInput, isLoading,
  chats, selectedChatId, setSelectedChatId, onNewChat,onDeleteChat, level, user,
  socraticMode, setSocraticMode 
}) {
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isLoading, attachment]);

  const handleSendClick = () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    onSendMessage(input, attachment);
    setInput(""); setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`app-main ${logsOpen ? "with-logs" : "no-logs"}`}>
      
      {/* BAGIAN TENGAH: CHAT SECTION */}
      <div className="chat-section">
        <div className="chat-panel"> 
          <div className="chat-header-actions">
             <div className="chat-greeting">
                Hi, {user.name}! 👋 <br/>
                <span style={{fontSize: "14px", color: "#555"}}>Tutor AI - Kelas {user.currentGrade} ({level})</span>
             </div>
             <div className="mode-toggle" style={{display:'flex', alignItems:'center', gap:'8px', float: 'right'}}>
                <span style={{fontSize:'12px', fontWeight:'bold', color: socraticMode ? '#0284c7' : '#64748b'}}>{socraticMode ? "🧠 Tutor" : "⚡ Cepat"}</span>
                <label className="switch" style={{position:'relative', display:'inline-block', width:'34px', height:'20px'}}>
                   <input type="checkbox" checked={socraticMode} onChange={() => setSocraticMode(!socraticMode)} style={{opacity:0, width:0, height:0}}/>
                   <span className="slider round" style={{position:'absolute', cursor:'pointer', top:0, left:0, right:0, bottom:0, backgroundColor: socraticMode ? '#0ea5e9' : '#cbd5e1', transition:'.4s', borderRadius:'34px'}}><span style={{position:'absolute', content:"", height:'14px', width:'14px', left:'3px', bottom:'3px', backgroundColor:'white', transition:'.4s', borderRadius:'50%', transform: socraticMode ? 'translateX(14px)' : 'translateX(0)'}}></span></span>
                </label>
             </div>
          </div>

          <div className="chat-messages">
             {messages.length === 0 && <div className="chat-bubble ai">Mau tanya materi apa hari ini?</div>}
             {messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.sender === "user" ? "user" : "ai"}`}>
                {m.fileName && <div className="file-indicator">📎 {m.fileName}</div>}
                <div className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown></div>
              </div>
             ))}
             {isLoading && <div className="chat-bubble ai"><em>Sedang berpikir... 🤖</em></div>}
             <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-wrapper"> 
            {attachment && <div className="attachment-preview"><span className="attachment-name">📄 {attachment.name}</span><button className="attachment-remove" onClick={() => {setAttachment(null); if(fileInputRef.current) fileInputRef.current.value=""}}>✕</button></div>}
            <div className="chat-input-bar">
              <input type="file" ref={fileInputRef} onChange={(e) => setAttachment(e.target.files[0])} style={{display: "none"}} />
              <button className="icon-btn attach-btn" onClick={() => fileInputRef.current.click()}>📎</button>
              <input className="chat-input-field" placeholder="Tulis pertanyaan..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendClick()} disabled={isLoading} />
              <button className="chat-send-btn" onClick={handleSendClick} disabled={isLoading}>{isLoading ? "..." : "Kirim"}</button>
            </div>
          </div>
        </div>

        {/* TOMBOL FLOATING (Muncul di Kanan Atas saat Sidebar Tertutup) */}
        {!logsOpen && (
          <button 
            className="logs-toggle-floating" 
            onClick={() => setLogsOpen(true)}
            title="Buka Riwayat"
          >
             ❮ Riwayat {/* Panah ke Kiri karena sidebar muncul dari Kanan */}
          </button>
        )}
      </div>

      {/* BAGIAN KANAN: SIDEBAR RIWAYAT */}
      {logsOpen && (
        <div className="logs-section">
          <div className="logs-panel">
              <div className="logs-header">
                <div className="logs-title">Riwayat Chat</div>
                <div className="logs-buttons">
                  <button className="new-chat-btn" onClick={onNewChat} title="Chat Baru">+</button>
                  <button className="close-sidebar-btn" onClick={() => setLogsOpen(false)} title="Tutup">❯</button>
                </div>
              </div>
              
              <div className="logs-list">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={"log-item " + (chat.id === selectedChatId ? "active" : "")}
                  onClick={() => setSelectedChatId(chat.id)}
                >
                  
                   <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px'}}>{chat.title}</span>
                   <button className="log-delete-btn" onClick={(e) => {e.stopPropagation(); onDeleteChat(chat.id)}}>🗑</button>
                </div>
              ))}
              {chats.length === 0 && <div style={{padding:"20px", textAlign:"center", color:"#94a3b8", fontSize:"13px"}}>Belum ada riwayat</div>}
              </div>
          </div>
        </div>
      )}

    </div>
  );
}