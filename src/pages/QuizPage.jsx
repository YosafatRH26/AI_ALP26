import { useState } from "react";
import { generateQuizFromAI } from "../services/geminiService";
import "./QuizPage.css";

export default function QuizPage({ user, onSaveResult }) {
    const [step, setStep] = useState("menu"); 
    const [quizData, setQuizData] = useState([]);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(0);
    const [subject, setSubject] = useState("");

    const startQuiz = async (selectedSubject, topic) => {
        setSubject(selectedSubject);
        setStep("loading");
        const data = await generateQuizFromAI(user.currentGrade, user.level, selectedSubject, topic);
        if(data && data.length > 0) {
            setQuizData(data);
            setStep("quiz");
            setAnswers({});
        } else {
            alert("Gagal membuat soal. Coba lagi.");
            setStep("menu");
        }
    };

    const handleAnswer = (qIndex, optIndex) => {
        setAnswers({ ...answers, [qIndex]: optIndex });
    };

    const finishQuiz = () => {
        let correctCount = 0;
        quizData.forEach((q, idx) => {
            if (answers[idx] === q.correctIndex) correctCount++;
        });
        const finalScore = Math.round((correctCount / quizData.length) * 100);
        setScore(finalScore);
        setStep("result");

        onSaveResult({
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            subject: subject,
            topic: quizData[0]?.topic || "Umum", 
            score: finalScore,
            total: quizData.length
        });
    };

    if (step === "loading") return <div className="center-screen"><h3>🔄 Sedang meminta soal ke AI...</h3><p>Mohon tunggu sebentar ya, {user.name}!</p></div>;

    if (step === "result") return (
        <div className="quiz-result-card fade-in">
            <h2>🎉 Hasil Kuis {subject}</h2>
            <div className="score-circle">{score}</div>
            <p>{score > 75 ? "Luar biasa! Pertahankan! 🌟" : "Tetap semangat belajar ya! 💪"}</p>
            <button className="main-btn" onClick={() => setStep("menu")}>Kembali ke Menu</button>
        </div>
    );

    if (step === "quiz") return (
        <div className="quiz-taking-area fade-in">
            <div className="quiz-header">
                <h3>Uji Kemampuan: {subject}</h3>
                <span>{Object.keys(answers).length}/{quizData.length} Soal</span>
            </div>
            {quizData.map((q, idx) => (
                <div key={idx} className="quiz-card">
                    <p className="quiz-question">
                        <strong>{idx + 1}.</strong> {q.question}
                    </p>
                    <div className="quiz-options">
                        {q.options.map((opt, optIdx) => {
                            // Defensive coding: Pastikan opt adalah string
                            const label = typeof opt === 'object' ? (opt.text || opt.label || JSON.stringify(opt)) : opt;
                            
                            return (
                                <button 
                                    key={optIdx} 
                                    className={`option-btn ${answers[idx] === optIdx ? "selected" : ""}`}
                                    onClick={() => handleAnswer(idx, optIdx)}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            {Object.keys(answers).length === quizData.length && (
                <button className="finish-btn" onClick={finishQuiz}>Selesai & Lihat Nilai</button>
            )}
        </div>
    );

    return (
        <div className="quiz-menu fade-in">
            <h2>🧠 Pusat Evaluasi</h2>
            <p>Pilih tes untuk mengukur kemampuanmu.</p>
            
            <div className="menu-grid">
                <div className="menu-card" onClick={() => startQuiz("Matematika", "Umum")}>
                    <span className="icon">📐</span>
                    <h3>Matematika</h3>
                    <p>Tes hitungan & logika</p>
                </div>
                <div className="menu-card" onClick={() => startQuiz("IPA (Sains)", "Umum")}>
                    <span className="icon">🧬</span>
                    <h3>Sains / IPA</h3>
                    <p>Alam & makhluk hidup</p>
                </div>
                <div className="menu-card" onClick={() => startQuiz("Bahasa Inggris", "Grammar & Vocab")}>
                    <span className="icon">🇬🇧</span>
                    <h3>B. Inggris</h3>
                    <p>Vocabulary & Grammar</p>
                </div>
            </div>
        </div>
    );
}