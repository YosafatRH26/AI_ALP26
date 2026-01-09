import { useState, useEffect } from "react";
import "./styles/main.css";
import logo from "./assets/logofixx.png";
import { getGeminiResponse } from "./services/geminiService";
import Login from "./components/Login";
import Onboarding from "./components/Onboarding";

// IMPORT PAGES (Rapi berkat index.js di folder pages)
import { ChatPage, QuizPage, ReportPage, ProfilePage } from "./pages";

// --- HELPER ---
const parseAIResponse = (text) => {
  const jsonRegex = /~~~json([\s\S]*?)~~~$/;
  const match = text.match(jsonRegex);
  if (match) {
    try {
      return {
        text: text.replace(jsonRegex, "").trim(),
        quiz: JSON.parse(match[1]),
        originalText: text,
      };
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return { text, quiz: null, originalText: text };
    }
  }
  return { text, quiz: null, originalText: text };
};

const calculateCurrentStatus = (userData) => {
  if (!userData) return null;
  const now = new Date();
  const registeredDate = new Date(userData.registeredAt);
  let yearDiff = now.getFullYear() - registeredDate.getFullYear();
  let currentGrade = userData.grade + yearDiff;
  let level = "UMUM";
  if (currentGrade >= 1 && currentGrade <= 6) level = "SD";
  else if (currentGrade >= 7 && currentGrade <= 9) level = "SMP";
  else if (currentGrade >= 10 && currentGrade <= 12) level = "SMA";
  else level = "MAHASISWA";
  return { ...userData, currentGrade, level };
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [authState, setAuthState] = useState(null);
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [socraticMode, setSocraticMode] = useState(true);
  const [logsOpen, setLogsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  // NAVIGATION STATE
  const [page, setPage] = useState("chat");
  const [quizHistory, setQuizHistory] = useState([]);

  // Load Initial Data
  useEffect(() => {
    const savedAuthState = localStorage.getItem("tutor_currentUser");
    const savedUserSession = localStorage.getItem("mentorku-active-session");
    if (savedAuthState && savedUserSession) {
      const authData = JSON.parse(savedAuthState);
      setAuthState(authData);
      const userData = JSON.parse(savedUserSession);
      setUser(calculateCurrentStatus(userData));

      const storageKey = `mentorku-data-${authData.userId}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setChats(parsed.chats || []);
        setSelectedChatId(parsed.selectedChatId);
        setQuizHistory(parsed.quizHistory || []);
      } else {
        const newId = Date.now();
        setChats([{ id: newId, title: "Chat Baru", messages: [] }]);
        setSelectedChatId(newId);
      }
    }
  }, []);

  // Auto Save
  useEffect(() => {
    if (user && authState) {
      const storageKey = `mentorku-data-${authState.userId}`;
      const dataToSave = { chats, selectedChatId, quizHistory };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [chats, selectedChatId, quizHistory]);

  const handleSendMessage = async (textInput, fileInput) => {
    const activeChat = chats.find((c) => c.id === selectedChatId);
    if (!activeChat) return;
    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: textInput,
      fileName: fileInput ? fileInput.name : null,
    };
    let updatedChats = chats.map((chat) =>
      chat.id === selectedChatId
        ? {
            ...chat,
            messages: [...chat.messages, userMsg],
            title:
              chat.messages.length === 0
                ? textInput.substring(0, 20)
                : chat.title,
          }
        : chat
    );
    setChats(updatedChats);
    setIsLoading(true);
    try {
      const specificLevel = `Kelas ${user.currentGrade} (${user.level})`;
      const rawAiResponse = await getGeminiResponse(
        textInput,
        specificLevel,
        fileInput,
        socraticMode,
        activeChat.messages
      );
      const { text, quiz, originalText } = parseAIResponse(rawAiResponse);
      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text,
        originalText,
        quiz,
      };
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChatId
            ? { ...chat, messages: [...chat.messages, aiMsg] }
            : chat
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuizResult = (result) => {
    setQuizHistory((prev) => [result, ...prev]);
  };

  const handleLogout = () => {
    localStorage.removeItem("tutor_currentUser");
    localStorage.removeItem("mentorku-active-session");
    window.location.reload();
  };

  //   useEffect(() => {
  //   if (!authState) return;

  //   const profileKey = `mentorku-user-${authState.userId}`;
  //   const savedProfile = localStorage.getItem(profileKey);

  //   if (savedProfile) {
  //     const parsed = JSON.parse(savedProfile);
  //     setUser(calculateCurrentStatus(parsed));
  //   } else {
  //     setUser(null);
  //   }
  // }, [authState]);

  // Jika belum login (AuthState Kosong)
  if (!authState) {
    return (
      <Login
        onLoginSuccess={(data) => {
          // Simpan Auth
          setAuthState(data);
          localStorage.setItem("tutor_currentUser", JSON.stringify(data));

          // CARI DATA PROFIL LAMA DISINI
          const profileKey = `mentorku-user-${data.userId}`;
          const savedProfile = localStorage.getItem(profileKey);

          if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            // Set user agar tidak masuk ke onboarding
            setUser(calculateCurrentStatus(parsed));
            // Simpan ke session aktif agar konsisten dengan flow aplikasi
            localStorage.setItem(
              "mentorku-active-session",
              JSON.stringify(parsed)
            );
          } else {
            // Jika memang user baru benar-benar belum punya profil
            setUser(null);
          }
        }}
      />
    );
  }

  // Jika sudah login (AuthState ada), tapi profil belum ada
  if (!user) {
    return (
      <Onboarding
        onSave={(data) => {
          const profileData = calculateCurrentStatus(data);
          setUser(profileData);
          // Pastikan disimpan di dua tempat agar saat login ulang ketemu
          localStorage.setItem("mentorku-active-session", JSON.stringify(data));
          localStorage.setItem(
            `mentorku-user-${authState.userId}`,
            JSON.stringify(data)
          );
        }}
        userId={authState.userId}
        username={authState.username}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="app-header">
        <div className="app-header-left" onClick={() => setPage("chat")}>
          <img src={logo} alt="MentorkuAI" className="app-logo" />{" "}
          <span className="app-title">MentorkuAI</span>
        </div>
        <div className="app-header-right">
          <div className="user-badge" onClick={() => setPage("profile")}>
            <div className="avatar-small">{user.name.charAt(0)}</div>
            <span>{user.name}</span>
          </div>
        </div>
      </header>

      {/* CONTENT AREA - Render Page berdasarkan state 'page' */}
      <div className="content-area">
        {page === "chat" && (
          <ChatPage
            logsOpen={logsOpen}
            setLogsOpen={setLogsOpen}
            messages={
              chats.find((c) => c.id === selectedChatId)?.messages || []
            }
            onSendMessage={handleSendMessage}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            chats={chats}
            selectedChatId={selectedChatId}
            setSelectedChatId={setSelectedChatId}
            onNewChat={() => {
              const newId = Date.now();
              setChats((prev) => [
                { id: newId, title: "Chat Baru", messages: [] },
                ...prev,
              ]);
              setSelectedChatId(newId);
            }}
            onDeleteChat={(id) => {
              const n = chats.filter((c) => c.id !== id);
              setChats(n);
              if (n.length === 0) {
                const newId = Date.now();
                const autoChat = { id: newId, title: "Chat Baru", messages: [] };
                setChats([autoChat]);
                setSelectedChatId(newId);
              } else if (selectedChatId === id) {
                setSelectedChatId(n[0]?.id || null);
              }
            }}
            level={user.level}
            user={user}
            socraticMode={socraticMode}
            setSocraticMode={setSocraticMode}
          />
        )}

        {page === "quiz" && (
          <QuizPage user={user} onSaveResult={handleSaveQuizResult} />
        )}

        {page === "report" && <ReportPage history={quizHistory} user={user} />}

        {page === "profile" && (
          <ProfilePage
            user={user}
            onLogout={handleLogout}
            onDeleteAccount={() => {
              if (confirm("Hapus?")) {
                localStorage.removeItem(`mentorku-data-${authState.userId}`);
                handleLogout();
              }
            }}
            onUpdateProfile={(updatedData) => {
              // 1. Gabungkan data lama dengan data baru
              const newRawData = { ...user, ...updatedData, grade: parseInt(updatedData.currentGrade) };
              
              // 2. Hitung ulang status (Level, dll) agar UI langsung berubah
              const finalizedData = calculateCurrentStatus(newRawData);
              
              // 3. Update State
              setUser(finalizedData);
              
              // 4. Update LocalStorage (Session Aktif)
              localStorage.setItem("mentorku-active-session", JSON.stringify(finalizedData));
              
              // 5. Update LocalStorage (Database Permanen User) - INI KUNCINYA
              const profileKey = `mentorku-user-${authState.userId}`;
              localStorage.setItem(profileKey, JSON.stringify(finalizedData));
          }}
          />
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${page === "chat" ? "active" : ""}`}
          onClick={() => setPage("chat")}
        >
          <span className="icon">💬</span> Chat
        </button>
        <button
          className={`nav-item ${page === "quiz" ? "active" : ""}`}
          onClick={() => setPage("quiz")}
        >
          <span className="icon">📝</span> Uji Kemampuan
        </button>
        <button
          className={`nav-item ${page === "report" ? "active" : ""}`}
          onClick={() => setPage("report")}
        >
          <span className="icon">📊</span> Raport
        </button>
      </nav>
    </div>
  );
}
