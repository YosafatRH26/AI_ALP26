import React, { useState } from "react";
import { generateQuizFromAI } from "../services/geminiService";
import "../styles/QuizPage.css";

// DATABASE MATA PELAJARAN (Updated Icons)
const SUBJECTS_DB = {
    SD: [
        { id: "matematika", name: "Matematika", icon: "📐", topic: "Hitungan Dasar" },
        { id: "ipa", name: "IPA (Sains)", icon: "🌱", topic: "Alam & Makhluk Hidup" }, // 🌱 lebih umum untuk sains dasar
        { id: "bing", name: "B. Inggris", icon: "💬", topic: "Vocabulary & Grammar" }, // 🅰️ untuk abjad/bahasa
        { id: "bindo", name: "B. Indonesia", icon: "📚", topic: "Membaca & Menulis" },
        { id: "pkn", name: "PPKn", icon: "🤝", topic: "Pancasila & Moral" }, // 🤝 simbol persatuan/moral
    ],
    SMP: [
        { id: "matematika", name: "Matematika", icon: "📐", topic: "Aljabar & Geometri" },
        { id: "ipa", name: "IPA Terpadu", icon: "🔬", topic: "Fisika & Biologi Dasar" },
        { id: "ips", name: "IPS Terpadu", icon: "🌍", topic: "Sejarah & Geografi" },
        { id: "bing", name: "B. Inggris", icon: "💬", topic: "Grammar & Text" }, // 💬 speech bubble
        { id: "bindo", name: "B. Indonesia", icon: "📚", topic: "Tata Bahasa" },
        { id: "pkn", name: "PPKn", icon: "⚖️", topic: "Hukum & Kewarganegaraan" }, // ⚖️ simbol keadilan/hukum
    ],
    SMA_UMUM: [
        { id: "mtk_wajib", name: "Matematika Wajib", icon: "📊", topic: "Logika & Fungsi" },
        { id: "bing", name: "B. Inggris", icon: "🗣️", topic: "General English" }, // 🗣️ speaking/communication
        { id: "bindo", name: "B. Indonesia", icon: "📚", topic: "Analisis Teks" },
        { id: "pkn", name: "PPKn", icon: "🏛️", topic: "Sistem Pemerintahan" }, // 🏛️ simbol institusi negara
    ],
    SMA_MIPA: [
        { id: "fisika", name: "Fisika", icon: "⚡", topic: "Mekanika & Listrik" },
        { id: "kimia", name: "Kimia", icon: "🧪", topic: "Zat & Reaksi" },
        { id: "biologi", name: "Biologi", icon: "🧬", topic: "Sel & Ekosistem" },
        { id: "mtk_minat", name: "Matematika Peminatan", icon: "📈", topic: "Kalkulus & Vektor" },
    ],
    SMA_IPS: [
        { id: "ekonomi", name: "Ekonomi", icon: "💰", topic: "Pasar & Akuntansi" },
        { id: "sosiologi", name: "Sosiologi", icon: "👥", topic: "Masyarakat & Interaksi" },
        { id: "geografi", name: "Geografi", icon: "🌋", topic: "Bumi & Lingkungan" },
        { id: "sejarah", name: "Sejarah Peminatan", icon: "📜", topic: "Sejarah Dunia" },
    ],
    SMA_BAHASA: [
        { id: "sastra", name: "Sastra Indonesia", icon: "🎭", topic: "Puisi & Prosa" }, // 🎭 seni/sastra
        { id: "antropologi", name: "Antropologi", icon: "🗿", topic: "Budaya Manusia" },
        { id: "asing", name: "Bahasa Asing", icon: "🎌", topic: "Dasar Bahasa Asing" },
    ],
};

export default function QuizPage({ user, onSaveResult }) {
    const [step, setStep] = useState("menu"); 
    const [quizData, setQuizData] = useState([]);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(0);
    const [subject, setSubject] = useState("");
    
    // State khusus anak SMA (Default MIPA)
    const [smaMajor, setSmaMajor] = useState("MIPA"); 

    // --- LOGIC MENENTUKAN SUBJECT LIST ---
    const getSubjectList = () => {
        const level = user.level; // SD, SMP, SMA,
        
        if (level === "SD") return SUBJECTS_DB.SD;
        if (level === "SMP") return SUBJECTS_DB.SMP;
        
        // Khusus SMA: Gabungkan Mapel Wajib + Mapel Jurusan
        if (level === "SMA") {
            const majorSubjects = SUBJECTS_DB[`SMA_${smaMajor}`] || [];
            return [...SUBJECTS_DB.SMA_UMUM, ...majorSubjects];
        }

        return SUBJECTS_DB.SD; // Fallback
    };

    const currentSubjects = getSubjectList();

    const startQuiz = async (selectedSubject, topic) => {
        setSubject(selectedSubject);
        setStep("loading");
        
        // Kirim info jurusan ke AI jika anak SMA agar soal lebih spesifik
        const extraContext = user.level === "SMA" ? `(Peminatan ${smaMajor})` : "";
        const finalTopic = `${topic} ${extraContext}`;

        const data = await generateQuizFromAI(user.currentGrade, user.level, selectedSubject, finalTopic);
        
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

    // --- RENDER COMPONENT ---

    if (step === "loading") return (
        <div className="center-screen">
            <div className="loading-spinner"></div>
            <h3>🔄 Sedang meracik soal...</h3>
            <p>Menyesuaikan dengan kurikulum {user.level} {user.level === "SMA" ? smaMajor : ""}...</p>
        </div>
    );

    if (step === "result") return (
        <div className="quiz-result-card fade-in">
            <h2>🎉 Hasil Kuis {subject}</h2>
            <div className="score-circle" style={{background: score >= 75 ? "#10b981" : "#ef4444"}}>
                {score}
            </div>
            <p>{score >= 75 ? "Luar biasa! Pertahankan! 🌟" : "Jangan menyerah, coba lagi ya! 💪"}</p>
            <div className="result-detail">
                Benar {Math.round((score/100) * quizData.length)} dari {quizData.length} soal
            </div>
            <button className="main-btn" onClick={() => setStep("menu")}>Kembali ke Menu</button>
        </div>
    );

    if (step === "quiz") return (
        <div className="quiz-taking-area fade-in">
            <div className="quiz-header">
                <h3>{subject}</h3>
                <span>{Object.keys(answers).length}/{quizData.length} Soal</span>
            </div>
            {quizData.map((q, idx) => (
                <div key={idx} className="quiz-card">
                    <p className="quiz-question">
                        <strong>{idx + 1}.</strong> {q.question}
                    </p>
                    <div className="quiz-options">
                        {q.options.map((opt, optIdx) => {
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

    // --- MENU UTAMA ---
    return (
        <div className="quiz-menu fade-in">
            <h2>🧠 Pusat Evaluasi</h2>
            <p>Pilih tes sesuai jenjangmu ({user.level}).</p>
            
            {/* KHUSUS SMA: TAB PEMINATAN */}
            {user.level === "SMA" && (
                <div className="major-tabs">
                    <button className={`major-tab ${smaMajor === "MIPA" ? "active" : ""}`} onClick={()=>setSmaMajor("MIPA")}>MIPA</button>
                    <button className={`major-tab ${smaMajor === "IPS" ? "active" : ""}`} onClick={()=>setSmaMajor("IPS")}>IPS</button>
                    <button className={`major-tab ${smaMajor === "BAHASA" ? "active" : ""}`} onClick={()=>setSmaMajor("BAHASA")}>Bahasa</button>
                </div>
            )}

            <div className="menu-grid">
                {/* RENDER MATA PELAJARAN DINAMIS */}
                {currentSubjects.map((sub) => (
                    <div key={sub.id} className="menu-card" onClick={() => startQuiz(sub.name, sub.topic)}>
                        <span className="icon">{sub.icon}</span>
                        <h3>{sub.name}</h3>
                        <p>{sub.topic}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}