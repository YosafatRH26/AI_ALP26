export default function ChatBubble({ sender, text }) {
  const isUser = sender === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          px-4 py-3 max-w-[75%] rounded-2xl shadow 
          ${isUser 
            ? "bg-indigo-600 text-white rounded-br-none" 
            : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"}
        `}
      >
        {text}
      </div>
    </div>
  );
}
