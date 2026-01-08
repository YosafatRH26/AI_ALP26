export default function Sidebar({ level, setLevel }) {
  const levels = ["SD", "SMP", "SMA"];

  return (
    <div className="w-64 bg-white shadow-xl p-6 flex flex-col border-r">
      <h1 className="text-2xl font-bold text-indigo-600 mb-6">AI Tutor</h1>

      <div className="space-y-3">
        {levels.map((lv) => (
          <button
            key={lv}
            onClick={() => setLevel(lv)}
            className={`w-full py-3 rounded-xl font-medium 
              ${
                level === lv
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-indigo-100 text-indigo-700"
              }`}
          >
            {lv}
          </button>
        ))}
      </div>
    </div>
  );
}
