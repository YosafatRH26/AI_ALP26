export default function LevelSelector({ level, setLevel }) {
  const levels = ["SD", "SMP", "SMA"];

  return (
    <div className="level-selector">
      {levels.map((lvl) => (
        <button
          key={lvl}
          className={`level-button ${level === lvl ? "active" : ""}`}
          onClick={() => setLevel(lvl)}
        >
          {lvl}
        </button>
      ))}
    </div>
  );
}
