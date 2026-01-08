import React, { useState, useRef } from "react";
import { getReportAnalysis } from "../services/geminiService";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../styles/ReportPage.css"; // Pastikan CSS Anda tetap terhubung

export default function ReportPage({ history, user }) {
    const [selectedSubject, setSelectedSubject] = useState("Semua");
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // REF: Menandai area yang akan di-foto oleh html2canvas
    const printRef = useRef(null);

    // --- LOGIC DATA ---
    const filteredHistory = selectedSubject === "Semua" 
        ? history 
        : history.filter(h => h.subject === selectedSubject);

    const subjects = ["Semua", ...new Set(history.map(h => h.subject))];

    const averageScore = filteredHistory.length > 0 
        ? Math.round(filteredHistory.reduce((acc, curr) => acc + curr.score, 0) / filteredHistory.length) 
        : 0;
    
    const bestScore = filteredHistory.length > 0 
        ? Math.max(...filteredHistory.map(h => h.score)) 
        : 0;

    // --- LOGIC AI ---
    const handleAnalyze = async () => {
        if (selectedSubject === "Semua") {
            alert("Pilih satu mata pelajaran spesifik dulu untuk dianalisis.");
            return;
        }
        if (filteredHistory.length < 1) { 
            alert("Kerjakan minimal 1 kuis di mapel ini.");
            return;
        }

        setIsAnalyzing(true);
        // Safety check untuk nama user
        const userName = user?.name || "Siswa";
        const userGrade = user?.currentGrade || "Umum";
        
        const result = await getReportAnalysis(userName, userGrade, selectedSubject, filteredHistory);
        setAnalysis(result);
        setIsAnalyzing(false);
    };

    // --- LOGIC DOWNLOAD PDF (FIXED FORMAT A4) ---
    const handleDownloadPDF = async () => {
        const element = printRef.current;
        if (!element) return;

        try {
            // Ubah cursor jadi loading
            document.body.style.cursor = 'wait';

            const canvas = await html2canvas(element, {
                scale: 2, // Resolusi tinggi agar teks tidak pecah
                useCORS: true, // Izinkan gambar external
                backgroundColor: "#ffffff", // Background PDF putih
                // TRIK PENTING: Paksa header print muncul saat dicapture
                onclone: (clonedDoc) => {
                    const printHeader = clonedDoc.querySelector('.report-header-print');
                    if (printHeader) {
                        printHeader.style.display = 'block';
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;
            
            // Margin 10mm
            const width = pdfWidth - 20; 
            const height = width / ratio;

            // Jika konten terlalu panjang, potong per halaman (Basic implementation)
            // Untuk sekarang kita fit to 1 page atau memanjang ke bawah
            if (height > pdfHeight - 20) {
                 // Logic multipage bisa ditambahkan disini, tapi untuk raport simple
                 // biasanya kita resize agar muat atau biarkan memanjang di 1 halaman custom
                 const pdfCustom = new jsPDF('p', 'mm', [pdfWidth, height + 40]);
                 pdfCustom.addImage(imgData, 'PNG', 10, 10, width, height);
                 pdfCustom.save(`Raport-${userName}-${selectedSubject}.pdf`);
            } else {
                 pdf.addImage(imgData, 'PNG', 10, 10, width, height);
                 pdf.save(`Raport-${userName}-${selectedSubject}.pdf`);
            }

        } catch (error) {
            console.error("Gagal cetak PDF:", error);
            alert("Gagal membuat PDF.");
        } finally {
            document.body.style.cursor = 'default';
        }
    };

    const userName = user?.name || "Siswa";

    return (
        <div className="report-page fade-in">
            
            {/* Bagian Controls (Dropdown & Tombol) TIDAK MASUK REF PRINT */}
            <div className="report-controls">
                <h2>📊 Statistik Belajar</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select 
                        value={selectedSubject} 
                        onChange={(e) => { setSelectedSubject(e.target.value); setAnalysis(null); }}
                        className="subject-select"
                    >
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* --- AREA INI YANG AKAN DICETAK KE PDF (DIBUNGKUS REF) --- */}
            <div ref={printRef} style={{ padding: '20px', background: 'white' }}> 
                
                {/* Header Print (Tersembunyi di layar, muncul di PDF lewat onclone) */}
                <div className="report-header-print"> 
                    <h1>RAPORT KEMAJUAN BELAJAR</h1>
                    <p>MentorkuAI - Personalized Learning System</p>
                    <p>{userName} | {selectedSubject} | {new Date().toLocaleDateString()}</p>
                    <hr style={{ margin: '20px 0', border: '1px solid #eee' }}/>
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
                                {filteredHistory.map((h, idx) => (
                                    <tr key={idx}>
                                        <td>{h.date || "-"}</td>
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
                {selectedSubject !== "Semua" && filteredHistory.length > 0 && analysis && (
                    <div className="analysis-section">
                        <div className="ai-report-card fade-in">
                            <h3>📝 Evaluasi Mentor AI: {selectedSubject}</h3>
                            <div className="analysis-grid">
                                <div className="analysis-item strength">
                                    <h4>💪 Keunggulan</h4>
                                    <p>{analysis.strength}</p>
                                </div>
                                <div className="analysis-item weakness">
                                    <h4>⚠️ Perlu Peningkatan</h4>
                                    <p>{analysis.weakness}</p>
                                </div>
                                <div className="analysis-item advice">
                                    <h4>💡 Saran Belajar</h4>
                                    {/* Handle jika advice berupa Array agar rapi */}
                                    {Array.isArray(analysis.advice) ? (
                                        <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', color: '#334155' }}>
                                            {analysis.advice.map((item, i) => (
                                                <li key={i} style={{ marginBottom: '5px' }}>{item}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>{analysis.advice}</p>
                                    )}
                                </div>
                                <div className="analysis-item prediction">
                                    <h4>🚀 Prediksi Potensi</h4>
                                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{analysis.prediction}</p>
                                    <p style={{ fontStyle: 'italic', marginTop: '5px' }}>"{analysis.motivational_quote}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* --- AKHIR AREA CETAK --- */}

            {/* Tombol Action (Di luar Ref agar tidak ikut tercetak) */}
            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '20px' }}>
                {selectedSubject !== "Semua" && filteredHistory.length > 0 && (
                     <button 
                        className="analyze-btn" 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing}
                        style={{ background: '#6366f1' }} // Warna ungu untuk analisis
                    >
                        {isAnalyzing ? "🤖 Sedang Menganalisis..." : "✨ Analisis AI Baru"}
                    </button>
                )}
                
                <button 
                    className="print-btn" 
                    onClick={handleDownloadPDF} // Panggil fungsi PDF baru
                >
                    🖨️ Download PDF Raport
                </button>
            </div>

        </div>
    );
}