import logo from "../assets/logofixx.png";
import "../styles/headerbar.css";

export default function HeaderBar() {
  return (
    <header className="header-bar">
      <img src={logo} alt="Mentorku AI" className="logo" />
      <h1 className="app-title">Mentorku AI</h1>
    </header>
  );
}
