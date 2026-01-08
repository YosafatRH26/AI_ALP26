# MentorkuAI — AI Tutor for Students

MentorkuAI adalah aplikasi AI Tutor berbasis web yang dirancang untuk membantu siswa dari berbagai jenjang (SD, SMP, SMA) 

Tech Stack
Frontend: React.js + Vite
Styling: CSS Modular / Global CSS (Poppins Font)
State Management: React Hooks
Version Control: Git & GitHub
AI Integration (planned): LLM-based Tutor Engine

Cara menjalankan projek

git clone https://github.com/USERNAME/REPO-NAME.git
cd REPO-NAME

npm install

npm run dev

http://localhost:5173

# Fitur Utama
1. AI Chatbot Tutor
Chatbot interaktif sebagai tutor belajar
Mendukung berbagai topik pelajaran sesuai jenjang siswa
Tampilan chat dengan bubble message

2. Pembagian Layout Aplikasi
75% area kiri: Fokus pada chatbot & percakapan
25% area kanan: Chat logs / riwayat percakapan
Chat logs dapat:
Dipilih
Dihapus
Disembunyikan (hide / show panel)

3️. Chat Logs (Riwayat Chat)
Menampilkan daftar percakapan sebelumnya
Klik chat untuk melanjutkan percakapan
Hover pada chat log akan menampilkan tombol hapus
Tombol New Chat untuk membuat percakapan baru

4️. User Menu (Header Dropdown)
Saat ikon user / setting diklik, akan muncul popup menu berisi:
Nama user
Tombol Edit Profile
Tombol Logout
Tombol Hapus User

5️. Halaman Profile
User dapat mengedit data profile:
Nama
Username / Email
Jenjang pendidikan (SD / SMP / SMA)
Perubahan profile langsung tersimpan 

6️. Login & Register
User dapat melakukan Register & Login
Riwayat chat tersimpan per user
Sistem mengenali identitas & jenjang user

7️. Quiz Uji Kemampuan
User dapat mengikuti quiz uji kemampuan
Soal di-generate berdasarkan:
Mata pelajaran yang dipilih
Jenjang pendidikan
Digunakan untuk mengukur kemampuan awal siswa

8️. Report & Analisis Belajar
Setelah mengikuti quiz, tersedia halaman Report yang menampilkan:
Nilai rata-rata
Nilai tertinggi
Jumlah quiz yang telah dikerjakan
Filter berdasarkan:
Mata pelajaran

Fitur AI Analysis:
AI menganalisis hasil belajar & quiz
