import "./Sidebar.css";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { FiHome, FiCalendar, FiBookmark, FiCheckSquare, FiMapPin, FiUser, FiLogOut, FiMenu, FiX, } from "react-icons/fi";
import { MdSportsBaseball, MdEvent } from "react-icons/md";

export default function Sidebar() {
  const location = useLocation();
  const { user, handleLogout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const sidebarRef = useRef(null);

  // Effect para manejar el redimensionado
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect separado para manejar clicks fuera del sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Solo cerrar si el sidebar está abierto y no estamos en proceso de toggle
      if (!isOpen || isToggling) return;

      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    // Agregar listeners inmediatamente, la protección está en isToggling
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, isToggling]);

  const isActive = (path) => location.pathname === path;

  const onLogoutClick = () => {
    handleLogout();
  };

  const handleLinkClick = () => {
    // Cerrar sidebar al seleccionar cualquier opción
    setIsOpen(false);
  };

  const handleToggleSidebar = () => {
    setIsToggling(true);
    setIsOpen(!isOpen);

    // Resetear la bandera después de un momento más corto
    setTimeout(() => {
      setIsToggling(false);
    }, 100);
  };

  return (
    <>
      {/* Overlay para móviles */}
      {isMobile && isOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Botón flotante para móviles */}
      {isMobile && (
        <button 
          className={`floating-menu-btn ${isOpen ? "open" : ""}`}
          onClick={handleToggleSidebar}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      )}

      <aside ref={sidebarRef} className={`sidebar ${isOpen ? "open" : "collapsed"} ${isMobile ? "mobile" : "desktop"}`}>
        {/* Botón hamburguesa */}
        <button className="hamburger" onClick={handleToggleSidebar}>
          {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>

        {/* Título del sidebar */}
        <div className="sidebar-header">
          <h2 className="sidebar-title">
            <span className="title-text">Centro Deportivo</span>
          </h2>
        </div>

        {/* Navegación principal */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <Link
              to="/inicio"
              className={`nav-link ${isActive("/inicio") ? "active" : ""}`}
              onClick={handleLinkClick}
            >
              <FiHome className="nav-icon" size={18} />
              <span className="link-text">Inicio</span>
            </Link>

            <Link
              to="/reservar"
              className={`nav-link ${isActive("/reservar") ? "active" : ""}`}
              onClick={handleLinkClick}
            >
              <FiCalendar className="nav-icon" size={18} />
              <span className="link-text">Reservar</span>
            </Link>

            <Link
              to="/mis-reservas"
              className={`nav-link ${isActive("/mis-reservas") ? "active" : ""}`}
              onClick={handleLinkClick}
            >
              <FiBookmark className="nav-icon" size={18} />
              <span className="link-text">Mis reservas</span>
            </Link>
          </div>

          {/* Sección de administración */}
          {user.rolId === 1 && (
            <div className="nav-section admin-section">
              <div className="section-divider">
                <span className="divider-text">Administración</span>
              </div>

              <Link
                to="/eventos"
                className={`nav-link ${isActive("/eventos") ? "active" : ""}`}
                onClick={handleLinkClick}
              >
                <MdEvent className="nav-icon" size={18} />
                <span className="link-text">Eventos</span>
              </Link>

              <Link
                to="/checkin"
                className={`nav-link ${isActive("/checkin") ? "active" : ""}`}
                onClick={handleLinkClick}
              >
                <FiCheckSquare className="nav-icon" size={18} />
                <span className="link-text">Check-in</span>
              </Link>

              <Link
                to="/espacios"
                className={`nav-link ${isActive("/espacios") ? "active" : ""}`}
                onClick={handleLinkClick}
              >
                <FiMapPin className="nav-icon" size={18} />
                <span className="link-text">Espacios</span>
              </Link>

              <Link
                to="/deportes"
                className={`nav-link ${isActive("/deportes") ? "active" : ""}`}
                onClick={handleLinkClick}
              >
                <MdSportsBaseball className="nav-icon" size={18} />
                <span className="link-text">Deportes</span>
              </Link>
            </div>
          )}

          {/* Sección de usuario */}
          <div className="nav-section user-section">
            <div className="spacer" />

            <Link
              to="/perfil"
              className={`nav-link ${isActive("/perfil") ? "active" : ""}`}
              onClick={handleLinkClick}
            >
              <FiUser className="nav-icon" size={18} />
              <span className="link-text">Perfil</span>
            </Link>

            <Link
              to="/"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick();
                onLogoutClick();
              }}
              className="nav-link logout-link"
            >
              <FiLogOut className="nav-icon" size={18} />
              <span className="link-text">Cerrar sesión</span>
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
