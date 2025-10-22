import "./Header.css";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const location = useLocation();
  const [titulo, setTitulo] = useState("");
  const [animar, setAnimar] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const obtenerTitulo = () => {
      switch (location.pathname) {
        case "/inicio":
          return "Inicio";
        case "/reservar":
          return "Reservar";
        case "/mis-reservas":
          return "Mis Reservas";
        case "/perfil":
          return "Perfil";
        case "/eventos":
          return "Eventos";
        case "/espacios":
          return "Espacios";
        case "/deportes":
          return "Deportes";
        default:
          return "";
      }
    };

    const nuevoTitulo = obtenerTitulo();
    setTitulo(nuevoTitulo);
    setAnimar(true);
    const timeout = setTimeout(() => setAnimar(false), 500); // Reinicia animación

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <header className="header">
      <h2 className={`header-title ${animar ? "animar-titulo" : ""}`}>
        {titulo}
      </h2>
      <div className="user-info">
        <span>
          {user.nombreCompleto}
        </span>
        <img
          src={user.urlImage || "https://i.pravatar.cc/40"}
          alt="Foto de usuario"
          className="user-avatar"
        />
      </div>
    </header>
  );
}
