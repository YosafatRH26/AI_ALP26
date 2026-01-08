// geminiservice.js
import { supabase } from "./supabaseClient";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash"; 
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent`; 

// --- HELPER: CONVERT FILE TO BASE64 ---
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

// --- FUNGSI RAG: CARI MATERI DI SUPABASE ---
const searchKnowledgeBase = async (query, userLevel) => {
  try {
    const embedResponse = await fetch(`${EMBED_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004", 
        content: { parts: [{ text: query }] }
      })
    });
    
    const embedData = await embedResponse.json();
    if (!embedData.embedding) return ""; 

    const queryVector = embedData.embedding.values;

    let filterJenjang = "SD";
    if (userLevel.includes("SMP")) filterJenjang = "SMP";
    if (userLevel.includes("SMA") || userLevel.includes("SMK")) filterJenjang = "SMA";

    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_threshold: 0.5, 
      match_count: 3,       
      filter_jenjang: filterJenjang
    });

    if (error) {
      console.error("Supabase Error:", error);
      return "";
    }

    if (documents && documents.length > 0) {
      return documents.map(doc => 
        `📖 [Sumber: ${doc.metadata.title}, Hal ${doc.metadata.page}]\n"${doc.content}"`
      ).join("\n\n");
    }

    return ""; 

  } catch (e) {
    console.error("RAG Search Error:", e);
    return "";
  }
};

// ============================================================================
// 1. FUNGSI UTAMA: CHAT AI (DENGAN RAG)
// ============================================================================
export const getGeminiResponse = async (userMessage, level, attachmentFile, isSocratic = true, history = []) => {
  try {
    let bookContext = "";
    if (userMessage.length > 5 && !attachmentFile) {
       console.log("🔍 Mencari di buku sekolah...");
       bookContext = await searchKnowledgeBase(userMessage, level);
    }

    let specificInstruction = "";
    if (level.includes("SD")) {
        specificInstruction = `
        TARGET AUDIENS: Anak SD. Gaya: Ceria, antusias, gunakan emoji 🌟.
        METODE:
        1. Gunakan perumpamaan/cerita sederhana.
        2. JANGAN beri jawaban langsung.
        3. JIKA INGIN MEMBERI KUIS INTERAKTIF DI CHAT, GUNAKAN FORMAT JSON DI BAWAH.
        `;
    } else if (level.includes("SMP")) {
        specificInstruction = `TARGET AUDIENS: SMP. Gaya: Gaul, Mentor. Gunakan analogi game/hobi.`;
    } else {
        specificInstruction = `TARGET AUDIENS: SMA/Mahasiswa. Gaya: Logis, Kritis, To-the-point.`;
    }

    const coreInstruction = isSocratic 
        ? "PERAN: Tutor Socratic. JANGAN beri jawaban langsung. Bimbing siswa step-by-step."
        : "PERAN: Asisten Pintar. Jawab langsung dengan jelas.";

    let contextPrompt = "";
    if (bookContext) {
        contextPrompt = `
        \n📚 INFORMASI DARI BUKU SEKOLAH RESMI:
        ${bookContext}
        \nINSTRUKSI: Gunakan informasi di atas sebagai acuan utama menjawab.
        `;
    } else {
        contextPrompt = `\n(Tidak ditemukan info spesifik di buku sekolah, gunakan pengetahuan umummu).`;
    }

    const jsonRule = `
    ATURAN KUIS CHAT:
    Jika kamu memberikan pertanyaan pilihan ganda (Quiz) di tengah percakapan, 
    AKHIRI responmu dengan blok kode khusus ini (agar tombol muncul di layar user):
    
    ~~~json
    {
      "isQuiz": true,
      "question": "Inti pertanyaan singkat",
      "options": [
        {"label": "A", "text": "Jawaban A", "isCorrect": false},
        {"label": "B", "text": "Jawaban B", "isCorrect": true},
        {"label": "C", "text": "Jawaban C", "isCorrect": false},
        {"label": "D", "text": "Jawaban D", "isCorrect": false}
      ]
    }
    ~~~
    `;

    const noLatexRule = `JANGAN gunakan format LaTeX/Dollar ($). Tulis matematika dengan teks biasa.`;
    const finalSystemPrompt = `${coreInstruction}\n${specificInstruction}\n${contextPrompt}\n${noLatexRule}\n${jsonRule}`;

    const recentHistory = history.slice(-4).map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.originalText || msg.text }]
    }));

    const currentParts = [{ text: `[SYSTEM: ${finalSystemPrompt}]\n\nUser: ${userMessage}` }];

    if (attachmentFile) {
      const base64Data = await fileToBase64(attachmentFile);
      currentParts.push({
        inline_data: { mime_type: attachmentFile.type, data: base64Data }
      });
    }

    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          ...recentHistory,
          { role: "user", parts: currentParts }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API Error Detail:", data);
      if (response.status === 429) {
        return "⏳ **Waduh, kita ngobrolnya terlalu cepat!** AI-nya butuh napas dulu. Tunggu sekitar 1 menit ya! (Limit Kuota Gratis)";
      }
      return `⚠️ Gagal (Error ${response.status}): ${data.error?.message || "Unknown error"}`;
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI diam saja.";

  } catch (error) {
    return `Koneksi bermasalah: ${error.message}`;
  }
};

// ============================================================================
// 2. FUNGSI BARU: GENERATE KUIS KHUSUS (KURIKULUM)
// ============================================================================
export const generateQuizFromAI = async (grade, level, subject, topic) => {
  let difficultyCheck = "";
  if (level.includes("SD")) difficultyCheck = "Soal harus SANGAT SEDERHANA, gunakan angka kecil atau kosakata dasar.";
  else if (level.includes("SMA") || level.includes("MAHASISWA")) difficultyCheck = "Soal harus ANALITIS, KOMPLEKS, dan TINGKAT LANJUT (HOTS).";

  const prompt = `
    Peran: Guru Ahli Kurikulum Indonesia.
    Tugas: Buat Kuis Pilihan Ganda.
    
    Target Siswa:
    - Jenjang: ${level} (Kelas ${grade})
    - Mapel: ${subject}
    - Topik: ${topic}
    - Tingkat Kesulitan: ${difficultyCheck}
    
    Output JSON WAJIB (Array of Objects):
    [
      {
        "question": "Pertanyaan disini...",
        "options": [
           "Pilihan A (Teks Saja)", 
           "Pilihan B (Teks Saja)", 
           "Pilihan C (Teks Saja)", 
           "Pilihan D (Teks Saja)"
        ],
        "correctIndex": 0,
        "explanation": "Penjelasan singkat"
      }
    ]
    
    PENTING: 
    1. "options" HARUS berupa Array of Strings (Contoh: ["Merah", "Biru"]), JANGAN object.
    2. Jangan tambahkan markdown \`\`\`json. Langsung raw text saja.
  `;

  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    
    if (!response.ok) {
        console.error("Quiz Error:", data);
        return [];
    }

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gagal generate kuis:", error);
    return []; 
  }
};

// ============================================================================
// 3. FUNGSI BARU: ANALISIS RAPORT (TREND ANALYSIS)
// ============================================================================
export const getReportAnalysis = async (studentName, grade, subject, quizHistory) => {
  const summaryData = quizHistory.map((q, i) => 
    `Kuis ${i+1}: Topik "${q.topic}", Skor ${q.score}`
  ).join("\n");

  const prompt = `
    Berperanlah sebagai Wali Kelas/Konselor Akademik yang bijak.
    Analisis data performa siswa berikut:
    
    Nama: ${studentName}
    Kelas: ${grade}
    Mapel: ${subject}
    Riwayat Nilai:
    ${summaryData}

    TUGAS:
    Berikan analisis JSON rapi dengan format ini (JANGAN markdown lain):
    {
      "strength": "Sebutkan topik-topik dimana siswa nilainya tinggi/konsisten bagus",
      "weakness": "Sebutkan topik-topik yang nilainya masih rendah",
      "advice": "Saran belajar spesifik untuk memperbaiki kelemahan",
      "prediction": "Prediksi singkat potensi siswa di masa depan berdasarkan tren nilai"
    }
  `;

  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (!response.ok) return null;

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);

  } catch (error) {
    console.error("Gagal analisis raport:", error);
    return null;
  }
};