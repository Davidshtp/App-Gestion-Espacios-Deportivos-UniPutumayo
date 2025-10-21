
import "./EstadisticasUsuario.css";
import EventosActivos from "./EventosActivos/EventosActivos"; 

export default function EstadisticasUsuario() {
  return (
    <div className="estadisticas-grid">
      <div className="stat-card azul">
        <p className="stat-number">12</p>
        <p className="stat-label">Reservas activas</p>
      </div>
      <div className="stat-card morado">
        <p className="stat-number">38 horas</p>
        <p className="stat-label">Total de uso</p>
      </div>
      {/* Reemplaza este div con el nuevo componente */}
      <EventosActivos />
    </div>
  );
}