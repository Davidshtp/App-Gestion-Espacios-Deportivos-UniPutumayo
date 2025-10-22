import "./Sidebar.css";
import { logout } from "../../Services/auth/authService";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      {/* Botón hamburguesa */}
      <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
        <span className={isOpen ? "bar horizontal" : "bar vertical"}></span>
        <span className={isOpen ? "bar horizontal" : "bar vertical"}></span>
        <span className={isOpen ? "bar horizontal" : "bar vertical"}></span>
      </button>

      <h2 className="sidebar-title">Centro Deportivo</h2>
      <nav className="sidebar-nav">
        <Link to="/inicio" className={isActive("/inicio") ? "active" : ""} onClick={() => setIsOpen(false)}>
          🏠 <span className="link-text">Inicio</span>
        </Link>
        <Link to="/reservar" className={isActive("/reservar") ? "active" : ""} onClick={() => setIsOpen(false)}>
          📅 <span className="link-text">Reservar</span>
        </Link>
        <Link to="/mis-reservas" className={isActive("/mis-reservas") ? "active" : ""} onClick={() => setIsOpen(false)}>
          📖 <span className="link-text">Mis reservas</span>
        </Link>
        {user.rolId === 1 && (
          <>
            <Link to="/eventos" className={isActive("/eventos") ? "active" : ""} onClick={() => setIsOpen(false)}>
              📢 <span className="link-text">Eventos</span>
            </Link>
            <Link to="/espacios" className={isActive("/espacios") ? "active" : ""} onClick={() => setIsOpen(false)}>
              🏟️ <span className="link-text">Espacios Deportivos</span>
            </Link>
            <Link to="/deportes" className={isActive("/deportes") ? "active" : ""} onClick={() => setIsOpen(false)}>
              🏐 <span className="link-text">Deportes</span>
            </Link>
          </>

        )}
        <Link to="/perfil" className={isActive("/perfil") ? "active" : ""} onClick={() => setIsOpen(false)}>
          👤 <span className="link-text">Perfil</span>
        </Link>
        <Link to="/" onClick={handleLogout} className="logout-link">
          🚪 <span className="link-text">Cerrar sesión</span>
        </Link>
      </nav>
    </aside>
  );
}
