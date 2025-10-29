import "./EstadisticasUsuario.css";
import EventosActivos from "./EventosActivos/EventosActivos";
import ReservasActivasUsuario from "./ReservasActivas/ReservasActivasUsuario";
import HorasTotalesUsoUsuario from "./HorasTotalesUso/HorasTotalesUsoUsuario";

export default function EstadisticasUsuario() {
  return (
    <div className="estadisticas-grid">
      <ReservasActivasUsuario />
      <HorasTotalesUsoUsuario />
      <EventosActivos />
    </div>
  );
}
