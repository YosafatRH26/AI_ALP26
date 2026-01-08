import { useState } from "react";
import { getReportAnalysis } from "../services/geminiService";
import "./ReportPage.css";

export default function ReportPage({ history, user }) {
    const [selectedSubject, setSelectedSubject] = useState("Semua");
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 1. Filter Data berdasarkan Mapel
    const filteredHistory = selectedSubject === "Semua" 
        ? history 
        : history.filter(h => h.subject === selectedSubject);

    // 2. Ambil list Mapel unik untuk Dropdown
    const subjects = ["Semua", ...new Set(history.map(h => h.subject))];

    // 3. Hitung Statistik Sederhana
    const averageScore = filteredHistory.length > 0 
        ? Math.round(filteredHistory.reduce((acc, curr) => acc + curr.score, 0) / filteredHistory.length) 
        : 0;
    
    const bestScore = filteredHistory.length > 0 
        ? Math.max(...filteredHistory.map(h => h.score)) 
        : 0;

    // 4. Fungsi Minta Analisis AI
    const handleAnalyze = async () => {
        if (selectedSubject === "Semua") {
            alert("Pilih satu mata pelajaran spesifik dulu (misal: Matematika) untuk dianalisis.");
            return;
        }
        if (filteredHistory.length < 2) { 
            alert("Kerjakan minimal 2 kuis di mapel ini agar AI bisa membaca tren nilaimu.");
            return;
        }

        setIsAnalyzing(true);
        const result = await getReportAnalysis(user.name, user.currentGrade, selectedSubject, filteredHistory);
        setAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="report-page fade-in">
            <div className="report-header-print"> 
                <h1>RAPORT KEMAJUAN BELAJAR</h1>
                <p>MentorkuAI - Personalized Learning System</p>
                <hr/>
            </div>

            <div className="report-controls">
                <h2>📊 Statistik Belajar</h2>
                <select 
                    value={selectedSubject} 
                    onChange={(e) => { setSelectedSubject(e.target.value); setAnalysis(null); }}
                    className="subject-select"
                >
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* STATS CARDS */}
            <div className="stats-grid">
                <div className="stat-card">
                    <span className="label">Rata-Rata</span>
                    <span className="value">{averageScore}</span>
                </div>
                <div className="stat-card">
                    <span className="label">Tertinggi</span>
                    <span className="value">{bestScore}</span>
                </div>
                <div className="stat-card">
                    <span className="label">Total Kuis</span>
                    <span className="value">{filteredHistory.length}</span>
                </div>
            </div>

            {/* TABLE HISTORY */}
            <div className="history-section">
                <h3>Riwayat Kuis ({selectedSubject})</h3>
                {filteredHistory.length === 0 ? (
                    <div className="empty-state">Belum ada data. Yuk kerjakan kuis!</div>
                ) : (
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Topik/Materi</th>
                                <th>Skor</th>
                                <th>Ket.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map((h) => (
                                <tr key={h.id}>
                                    <td>{h.date}</td>
                                    <td>{h.topic || h.subject}</td>
                                    <td>
                                        <span className={`score-badge ${h.score >= 75 ? 'good' : 'bad'}`}>
                                            {h.score}
                                        </span>
                                    </td>
                                    <td>{h.score >= 75 ? "Tuntas" : "Remedial"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* AI ANALYSIS SECTION */}
            {selectedSubject !== "Semua" && filteredHistory.length > 0 && (
                <div className="analysis-section">
                    <button 
                        className="analyze-btn" 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? "🤖 Sedang Menganalisis..." : "✨ Analisis Kemampuan Saya (AI)"}
                    </button>

                    {analysis && (
                        <div className="ai-report-card fade-in">
                            <h3>📝 Evaluasi Mentor AI: {selectedSubject}</h3>
                            <div className="analysis-grid">
                                <div className="analysis-item strength">
                                    <h4>💪 Keunggulan (Materi Dikuasai)</h4>
                                    <p>{analysis.strength}</p>
                                </div>
                                <div className="analysis-item weakness">
                                    <h4>⚠️ Perlu Peningkatan</h4>
                                    <p>{analysis.weakness}</p>
                                </div>
                                <div className="analysis-item advice">
                                    <h4>💡 Saran Belajar</h4>
                                    <p>{analysis.advice}</p>
                                </div>
                                <div className="analysis-item prediction">
                                    <h4>🚀 Prediksi Potensi</h4>
                                    <p>{analysis.prediction}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <button className="print-btn" onClick={() => window.print()}>🖨️ Download PDF Raport</button>
        </div>
    );
}