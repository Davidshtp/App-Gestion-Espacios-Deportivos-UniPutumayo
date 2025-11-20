import { useEffect, useState } from "react";
import { getUserData } from "../../Services/auth/authService";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import EstadisticasUsuario from "../../components/EstadisticasUsuario/EstadisticasUsuario";
import NoticiasSlider from "../../components/NoticiasSlider/NoticiasSlider";
import { FiCalendar, FiClock, FiMapPin } from "react-icons/fi";
import { MdEvent } from "react-icons/md";
import "./Inicio.css";

export default function Inicio() {
  const [usuario, setUsuario] = useState(null);
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    getUserData()
      .then((user) => setUsuario(user))
      .catch(() => setUsuario(null));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!usuario) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Cargando dashboard...</p>
    </div>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="dashboard-content">
      {/* Header de Bienvenida */}
      <div className="welcome-header">
        <div className="welcome-info">
          <h1 className="welcome-title">
            {getGreeting()}, {user?.nombreCompleto?.split(' ')[0] || 'Usuario'}
          </h1>
          <p className="welcome-subtitle">
            Bienvenido al Centro Deportivo UniPutumayo
          </p>
          <div className="datetime-info">
            <div className="date-display">
              <FiCalendar className="datetime-icon" />
              <span>{formatDate(currentTime)}</span>
            </div>
            <div className="time-display">
              <FiClock className="datetime-icon" />
              <span>{formatTime(currentTime)}</span>
            </div>
          </div>
        </div>
        <div className="welcome-actions">
          <Link to="/reservar" className="action-btn primary">
            <FiCalendar className="btn-icon" />
            <span>Reservar</span>
          </Link>
          <Link to="/espacios" className="action-btn secondary">
            <FiMapPin className="btn-icon" />
            <span>Espacios</span>
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <section className="content-section estadisticas-section">
        <div className="section-header">
          <h2>Tu Actividad Deportiva</h2>
        </div>
        <EstadisticasUsuario />
      </section>

      {/* Eventos y Noticias */}
      <section className="content-section">
        <div className="section-header">
          <MdEvent className="section-icon" />
          <h2>Eventos y Noticias</h2>
        </div>
        <NoticiasSlider />
      </section>
    </div>
  );
}
