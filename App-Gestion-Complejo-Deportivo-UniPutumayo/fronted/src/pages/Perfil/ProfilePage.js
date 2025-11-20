import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateEmail } from "../../Services/auth/authService";
import Swal from "sweetalert2";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="profile-loading">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  const rolNombre = user.rolId === 1 ? "Administrador" : "Estudiante";
  
  // Verificar si ya tiene correo asignado
  const hasEmail = user.email && user.email.trim() !== '';

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      Swal.fire("Error", "Por favor ingresa un correo electrónico válido", "error");
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire("Error", "El formato del correo electrónico no es válido", "error");
      return;
    }

    setLoading(true);
    try {
      await updateEmail(email);
      
      Swal.fire({
        title: "¡Éxito!",
        text: "Correo electrónico actualizado correctamente",
        icon: "success"
      });

      // Refrescar datos del usuario
      await refreshUser();
      setIsEditing(false);
      setEmail("");
    } catch (error) {
      console.error("Error actualizando correo:", error);
      const errorMessage = error.response?.data?.message || "Error al actualizar el correo electrónico";
      Swal.fire("Error", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEmail("");
  };

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
            <div className="email-section">
              {!isEditing ? (
                <div className="email-display">
                  <span className="info-value">
                    {hasEmail ? user.email : "No asignado"}
                  </span>
                  
                  {/* Mostrar botón para agregar correo solo si no tiene correo asignado */}
                  {!hasEmail && (
                    <button 
                      className="btn-add-email"
                      onClick={() => setIsEditing(true)}
                    >
                      Agregar correo
                    </button>
                  )}
                </div>
              ) : (
                <div className="email-edit">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ingresa tu correo electrónico"
                    className="email-input"
                    disabled={loading}
                  />
                  <div className="email-buttons">
                    <button 
                      className="btn-save"
                      onClick={handleUpdateEmail}
                      disabled={loading}
                    >
                      {loading ? "Guardando..." : "Guardar"}
                    </button>
                    <button 
                      className="btn-cancel"
                      onClick={handleCancelEdit}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
