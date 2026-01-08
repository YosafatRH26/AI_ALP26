import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import HeaderBar from "../components/HeaderBar";
import ChatBubble from "../components/ChatBubble";
import ChatInput from "../components/ChatInput";
import TypingIndicator from "../components/TypingIndicator";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Halo! Aku Tutor AI kamu. Mau belajar apa hari ini? 😊" },
  ]);

  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState("SD");

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = (text) => {
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Oke, ini penjelasannya ya..." },
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar level={level} setLevel={setLevel} />

      {/* MAIN CHAT CONTENT */}
      <div className="flex flex-col flex-1">

        <HeaderBar level={level} />

        {/* Chat Content Centered */}
        <div className="flex justify-center w-full flex-1 overflow-y-auto p-4">
          <div className="w-full max-w-3xl space-y-4">
            {messages.map((msg, i) => (
              <ChatBubble key={i} sender={msg.sender} text={msg.text} />
            ))}

            {loading && <TypingIndicator />}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex justify-center w-full bg-white border-t p-4">
          <div className="w-full max-w-3xl">
            <ChatInput onSend={handleSend} />
          </div>
        </div>

      </div>
    </div>
  );
}
