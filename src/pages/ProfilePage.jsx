import { useState } from "react";
import "../styles/ProfilePage.css";

export default function ProfilePage({ user, onLogout, onDeleteAccount, onUpdateProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedGrade, setEditedGrade] = useState(user.currentGrade);

  const handleSave = () => {
    if(editedName && editedGrade) {
        onUpdateProfile({ name: editedName, currentGrade: parseInt(editedGrade)});
        setIsEditing(false);
    }
  };

  return (
    <div className="profile-page fade-in">
      <div className="profile-card">
        {isEditing ? (
            <div className="profile-edit-form">
                <h3>Edit Profil</h3>
                <input className="form-input" value={editedName} onChange={e=>setEditedName(e.target.value)} placeholder="Nama" />
                <select className="form-input" value={editedGrade} onChange={e=>setEditedGrade(e.target.value)}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Kelas {g}</option>)}
                </select>
                <button className="save-btn" onClick={handleSave}>Simpan</button>
                <button className="cancel-btn" onClick={()=>setIsEditing(false)}>Batal</button>
            </div>
        ) : (
            <>
                <div className="profile-top">
                    <div className="profile-avatar-large">{user.name.charAt(0).toUpperCase()}</div>
                    <h2>{user.name}</h2>
                    <p>{user.level}</p>
                </div>
                <div className="profile-actions">
                    <button className="edit-profile-btn" onClick={()=>setIsEditing(true)}>Edit Profil</button>
                    <button className="action-btn logout-btn" onClick={onLogout}>Logout</button>
                    <button className="action-btn delete-btn" onClick={onDeleteAccount}>Hapus Akun</button>
                </div>
            </>
        )}
      </div>
    </div>
  );
}