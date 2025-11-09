import { useAuth } from "../../context/AuthContext";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="profile-loading">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  const rolNombre = user.rolId === 1 ? "Administrador" : "Estudiante";

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <img
            src={user.urlImage || "https://i.pravatar.cc/40"}
            alt="Foto de perfil"
            className="profile-avatar"
          />
          <h2 className="profile-name">{user.nombreCompleto}</h2>
          <p className="profile-role">{rolNombre}</p>
        </div>

        <div className="profile-info">
          <div className="info-item">
            <span className="info-label">Correo electrónico</span>
            <span className="info-value">{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
