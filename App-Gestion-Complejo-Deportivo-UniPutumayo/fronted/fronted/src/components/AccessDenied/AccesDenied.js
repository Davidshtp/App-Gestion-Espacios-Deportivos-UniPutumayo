// src/components/AccessDenied.jsx
import { useNavigate } from 'react-router-dom';
import './AccessDenied.css';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="access-icon">🔒</div>
        <h2>Acceso restringido</h2>
        <p>No tienes los permisos necesarios para ver esta página.</p>
        <button onClick={() => navigate(-1)}>Volver</button>
      </div>
    </div>
  );
}
