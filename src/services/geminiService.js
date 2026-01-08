import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Pastikan .env sudah benar
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

/**
 * Helper: Mengubah File object menjadi format yang bisa dibaca Gemini
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(",")[1]; // Hapus header data:image/png;base64,...
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getGeminiResponse = async (userMessage, level, attachmentFile) => {
  try {
    let systemInstruction = "";
    
    // Setup Persona
    switch (level) {
      case "SD":
        systemInstruction = "Kamu adalah guru SD yang ceria. Jelaskan dengan bahasa sederhana. Jangan pakai LaTeX.";
        break;
      case "SMP":
        systemInstruction = "Kamu adalah tutor SMP yang asik. Bahasa gaul tapi edukatif. Jangan pakai LaTeX.";
        break;
      case "SMA":
        systemInstruction = "Kamu adalah mentor SMA. Analitis dan logis. Hindari LaTeX jika tidak perlu.";
        break;
      default:
        systemInstruction = "Kamu adalah asisten belajar.";
    }

    // Siapkan Prompt (Teks + File jika ada)
    const promptParts = [`${systemInstruction}\n\nPertanyaan: ${userMessage}`];

    // Jika ada file attachment, proses dulu jadi Base64 lalu masukkan ke array
    if (attachmentFile) {
      const imagePart = await fileToGenerativePart(attachmentFile);
      promptParts.push(imagePart);
    }

    // Kirim request (bisa array isinya teks & gambar)
    const result = await model.generateContent(promptParts);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Error Gemini:", error);
    return `Maaf, ada error: ${error.message}`;
  }
};