export default function TypingIndicator() {
  return (
    <div className="text-gray-600 flex gap-1 ml-2 items-center">
      <span className="animate-bounce">●</span>
      <span className="animate-bounce delay-150">●</span>
      <span className="animate-bounce delay-300">●</span>
    </div>
  );
}
