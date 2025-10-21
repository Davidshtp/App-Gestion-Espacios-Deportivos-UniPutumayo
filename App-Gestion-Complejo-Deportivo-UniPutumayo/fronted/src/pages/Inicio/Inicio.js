import { useEffect, useState } from "react";
import { getUserData } from "../../Services/auth/authService";
import EstadisticasUsuario from "../../components/EstadisticasUsuario/EstadisticasUsuario";
import NoticiasSlider from "../../components/NoticiasSlider/NoticiasSlider";
import "./Inicio.css";

export default function Inicio() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    getUserData()
      .then((user) => setUsuario(user))
      .catch(() => setUsuario(null));
  }, []);

  if (!usuario) return null;

  return (
    <div className="dashboard-content">
      <EstadisticasUsuario />
      <NoticiasSlider />
    </div>
  );
}
