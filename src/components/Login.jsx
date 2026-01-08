import { useState } from "react";
import logo from "../assets/logofixx.png"; // Path logo disesuaikan (naik satu folder)
import "../styles/Login.css"; // TAMBAH INI

// // Ikon Mata Terbuka
// const EyeIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
//     <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//     <circle cx="12" cy="12" r="3"></circle>
//   </svg>
// );

// // Ikon Mata Tertutup
// const EyeOffIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", color: "#9ca3af" }}>
//     <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
//     <line x1="1" y1="1" x2="23" y2="23"></line>
//   </svg>
// );

// --- KOMPONEN POPUP ERROR (Baru) ---
const ErrorPopup = ({ message, onClose }) => (
  <div className="error-popup-overlay">
    <div className="error-popup-content fade-in-up">
      <div className="error-icon">⚠️</div>
      <h3>Terjadi Kesalahan</h3>
      <p>{message}</p>
      <button onClick={onClose} className="error-close-btn">Tutup</button>
    </div>
  </div>
);

export default function Login({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // State untuk Error Popup
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State mata terpisah
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!username.trim()) throw new Error("Username wajib diisi!");
      if (!password.trim()) throw new Error("Password wajib diisi!");
      if (username.length < 3) throw new Error("Username minimal 3 karakter!");
      
      // Validasi Register
      if (!isLogin) {
        if (password.length < 6) throw new Error("Password minimal 6 karakter!");
        if (password !== confirmPassword) throw new Error("Konfirmasi password tidak cocok!");
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
      const users = JSON.parse(localStorage.getItem("tutor_users") || "{}");

      if (isLogin) {
        // --- LOGIN ---
        if (!users[username]) throw new Error("Username tidak ditemukan.");
        if (users[username].password !== password) throw new Error("Password salah!");

        const userData = { userId: users[username].userId, username: username, loginTime: new Date().toISOString() };
        localStorage.setItem("tutor_currentUser", JSON.stringify(userData));
        onLoginSuccess(userData);
      } else {
        // --- REGISTER ---
        if (users[username]) throw new Error("Username sudah terpakai.");

        const userId = "user_" + Date.now();
        users[username] = { userId, username, password, registeredAt: new Date().toISOString() };
        localStorage.setItem("tutor_users", JSON.stringify(users));

        const userData = { userId, username, loginTime: new Date().toISOString() };
        localStorage.setItem("tutor_currentUser", JSON.stringify(userData));
        onLoginSuccess(userData);
      }
    } catch (err) {
      setError(err.message);
      setShowError(true); // Tampilkan Popup
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(""); setShowError(false);
    setUsername(""); setPassword(""); setConfirmPassword("");
    setShowPassword(false); setShowConfirmPassword(false);
  };

  return (
    <div className="login-container">
      {/* TAMPILKAN POPUP JIKA ERROR */}
      {showError && <ErrorPopup message={error} onClose={() => setShowError(false)} />}

      <div className="login-card fade-in-up">
        <div className="login-header">
          <img src={logo} alt="Logo" className="login-logo" style={{width: 60, height: 60, margin: "0 auto 15px"}} />
          <h1>{isLogin ? "Masuk Akun" : "Daftar Akun"}</h1>
          <p>{isLogin ? "Lanjutkan pembelajaranmu" : "Mulai perjalanan belajarmu"}</p>
        </div>

        <form onSubmit={handleAuth} className="login-form">
          {/* USERNAME */}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: Budi123"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* PASSWORD UTAMA */}
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper" style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? "Masukkan password" : "Minimal 6 karakter"}
                disabled={loading}
                style={{ paddingRight: "45px" }} 
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex", alignItems: "center"
                }}
              >
                {/* {showPassword ? <EyeOffIcon /> : <EyeIcon />} */}
              </button>
            </div>
          </div>

          {/* KONFIRMASI PASSWORD (Hanya saat Register) */}
          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-input-wrapper" style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="login-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password"
                  disabled={loading}
                  style={{ paddingRight: "45px" }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex", alignItems: "center"
                  }}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Memproses..." : isLogin ? "Masuk Sekarang" : "Daftar Sekarang"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
            <button type="button" className="toggle-btn" onClick={toggleMode} disabled={loading}>
              {isLogin ? "Daftar di sini" : "Login di sini"}
            </button>
          </p>
        </div>
        
        <div className="login-info" style={{marginTop: "20px", fontSize: "12px", color: "#64748b"}}>
          <small>💡 Tips: Gunakan password yang mudah diingat</small>
        </div>
      </div>
    </div>
  );
}