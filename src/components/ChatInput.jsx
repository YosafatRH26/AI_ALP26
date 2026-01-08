export default function ChatInput({ question, setQuestion, sendMessage }) {
  return (
    <div className="input-row">
      <input
        className="text-input"
        type="text"
        placeholder="Tanya sesuatu..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button className="send-btn" onClick={sendMessage}>
        Kirim
      </button>
    </div>
  );
}
