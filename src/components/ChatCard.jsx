import ChatInput from "./ChatInput";

export default function ChatCard({ level, question, setQuestion }) {
  const sendMessage = () => {
    console.log("User question:", question);
  };

  return (
    <div className="chat-card">
      <h2 className="chat-title">MentorKu AI — {level}</h2>
      <p className="chat-desc">
        Halo! Aku Tutor AI kamu. Mau belajar apa hari ini? 😊
      </p>

      <ChatInput
        question={question}
        setQuestion={setQuestion}
        sendMessage={sendMessage}
      />
    </div>
  );
}
