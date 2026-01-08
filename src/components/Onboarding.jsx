import { useState } from "react";
import logo from "../assets/logofixx.png"; // Path logo disesuaikan (naik satu folder)
import "../styles/Onboarding.css";

export default function Onboarding({ onSave, userId, username }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("7");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Silakan isi nama kamu dulu ya! 😉");
    
    const userData = {
      name: name,
      grade: parseInt(grade),
      registeredAt: new Date().toISOString(),
      userId: userId,
      username: username
    };
    
    onSave(userData);
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card fade-in-up">
        <div className="onboarding-header">
          <img src={logo} alt="Logo" className="onboarding-logo" style={{width: 60, height: 60, margin: "0 auto 15px"}} />
          <h1>Selamat Datang! 👋</h1>
          <p>Tutor AI siap menemanimu belajar.</p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label>Siapa namamu?</label>
            <input 
              type="text" 
              className="onboarding-input" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ketik namamu di sini..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Sekarang kelas berapa?</label>
            <div className="select-wrapper">
              <select 
                className="onboarding-input" 
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                <optgroup label="Sekolah Dasar (SD)">
                  {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>Kelas {g} SD</option>)}
                </optgroup>
                <optgroup label="Sekolah Menengah Pertama (SMP)">
                  {[7, 8, 9].map(g => <option key={g} value={g}>Kelas {g} (SMP {g-6})</option>)}
                </optgroup>
                <optgroup label="Sekolah Menengah Atas (SMA)">
                  {[10, 11, 12].map(g => <option key={g} value={g}>Kelas {g} (SMA {g-9})</option>)}
                </optgroup>
                <optgroup label="Umum">
                  <option value="13">Mahasiswa / Umum</option>
                </optgroup>
              </select>
            </div>
          </div>

          <button type="submit" className="onboarding-btn">
            Mulai Belajar 🚀
          </button>
        </form>
        
        <div className="onboarding-footer">
          <small>Aplikasi Belajar Pintar Berbasis AI</small>
        </div>
      </div>
    </div>
  );
}