import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/ChatPage.css"; // Import CSS lokal untuk styling ChatPage

export default function ChatPage({ 
  logsOpen, setLogsOpen, messages, onSendMessage, input, setInput, isLoading,
  chats, selectedChatId, setSelectedChatId, onNewChat, onDeleteChat, level, user,
  socraticMode, setSocraticMode 
}) {
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [answeredQuizzes, setAnsweredQuizzes] = useState({}); 

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isLoading, attachment]);

  const handleSendClick = () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    onSendMessage(input, attachment);
    setInput(""); setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleQuizOptionClick = (messageId, option) => {
    if (answeredQuizzes[messageId] || isLoading) return;
    setAnsweredQuizzes(prev => ({ ...prev, [messageId]: option.label }));
    onSendMessage(`Saya memilih jawaban ${option.label}: "${option.text}"`, null);
  };

  return (
    <div className={`app-main ${logsOpen ? "with-logs" : "no-logs"}`}>
      <div className="chat-section">
        <div className="chat-panel"> 
          <div className="chat-header-actions">
             <div className="chat-greeting">
                Hi, {user.name}! 👋 <br/>
                <span style={{fontSize: "14px", color: "#555"}}>Tutor AI - Kelas {user.currentGrade} ({level})</span>
             </div>
             {/* Mode toggle bisa dipindah ke settings jika mau, tapi biarkan disini sesuai request */}
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
                {m.sender === "ai" && m.quiz && (
                  <div className="quiz-container" style={{marginTop: "15px", display: "flex", flexDirection: "column", gap: "8px"}}>
                    <div style={{fontSize: "0.9em", fontWeight: "bold", marginBottom: "5px"}}>Pilih Jawaban:</div>
                    {m.quiz.options.map((opt, idx) => {
                          const label = typeof opt === 'object' ? (opt.text || opt.label || JSON.stringify(opt)) : opt;
                          const isSelected = answeredQuizzes[m.id] === (opt.label || opt); // Simple check
                          return (
                            <button key={idx} onClick={() => handleQuizOptionClick(m.id, opt)} disabled={!!answeredQuizzes[m.id]} className={`option-btn ${isSelected ? "selected" : ""}`} style={{padding: "10px", minHeight: "40px"}}>
                                {label}
                            </button>
                          )
                    })}
                  </div>
                )}
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
        {!logsOpen && <button className="icon-btn logs-toggle-floating" onClick={() => setLogsOpen(true)}>❯</button>}
      </div>

      <div className="logs-section">
        <div className="logs-panel">
            <div className="logs-header"><div className="logs-title">Riwayat</div><div className="logs-buttons"><button className="new-chat-btn" onClick={onNewChat}>+</button><button className="icon-btn" onClick={() => setLogsOpen(false)}>❮</button></div></div>
            <div className="logs-list">
            {chats.map((chat) => (
              <div key={chat.id} className={"log-item " + (chat.id === selectedChatId ? "active" : "")} onClick={() => setSelectedChatId(chat.id)}>
                 <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px'}}>{chat.title}</span><button className="log-delete-btn" onClick={(e) => {e.stopPropagation(); onDeleteChat(chat.id)}}>🗑</button>
              </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
}