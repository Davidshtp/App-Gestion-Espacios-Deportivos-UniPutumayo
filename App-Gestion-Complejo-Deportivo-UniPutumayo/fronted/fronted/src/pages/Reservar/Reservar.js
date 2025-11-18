import { useRef, useState, useEffect } from "react";
import CalendarioReserva from "../../components/CalendarioReserva/CalendarioReserva";
import HorasDelDia from "../../components/HorasDelDia/HorasDelDia";
import "./Reservar.css";
import useReservaSocket from "../../hooks/useReservaSocket";
import {obtenerTodosLosEspacios} from "../../Services/espacios/espaciosService"

export default function Reservar() {
  const [espacios, setEspacios] = useState([]);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const layoutRef = useRef(null);
  const contenedoresRef = useRef({});
  const horasRef = useRef({});

  useReservaSocket();

  // ⚡ Obtener espacios usando el servicio
  useEffect(() => {
    const fetchEspacios = async () => {
      try {
        const data = await obtenerTodosLosEspacios();
        setEspacios(data);
      } catch (error) {
        console.error("Error obteniendo espacios:", error);
      }
    };
    fetchEspacios();
  }, []);

  const toggleSeleccion = (nombre) => {
    setEspacioSeleccionado((prev) => (prev === nombre ? null : nombre));
    setFechaSeleccionada(null);
  };

  // Scroll suave al mostrar/ocultar horas
  useEffect(() => {
    const contenedor = contenedoresRef.current[espacioSeleccionado];
    const horas = horasRef.current[espacioSeleccionado];
    if (!contenedor) return;

    const duration = 800;
    const start = contenedor.scrollTop;
    const target = fechaSeleccionada && horas ? horas.offsetTop : 0;
    const distance = target - start;
    const startTime = performance.now();

    const animarScroll = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;

      contenedor.scrollTop = start + distance * eased;
      if (progress < 1) requestAnimationFrame(animarScroll);
    };

    const t = setTimeout(() => requestAnimationFrame(animarScroll), 300);
    return () => clearTimeout(t);
  }, [fechaSeleccionada, espacioSeleccionado]);

  // Cerrar tarjetas al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      const layout = layoutRef.current;
      if (!layout || !espacioSeleccionado) return;
      if (document.querySelector(".swal2-container")) return;

      const clickDentro = layout.contains(e.target);
      const permitido = e.target.closest(".calendario-container, .horas-animadas, button");

      if (!clickDentro || !permitido) {
        setEspacioSeleccionado(null);
        setFechaSeleccionada(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [espacioSeleccionado]);

  const renderContenido = (id, nombre) => (
    <div
      ref={(el) => (contenedoresRef.current[nombre] = el)}
      className={`contenido-reserva ${fechaSeleccionada ? "scroll-activo" : "scroll-desactivado"}`}
      onClick={(e) => e.stopPropagation()}
    >
      <CalendarioReserva espacioId={id} onSelectFecha={setFechaSeleccionada} />
      {fechaSeleccionada && (
        <div
          ref={(el) => (horasRef.current[nombre] = el)}
          className="horas-animadas"
        >
          <HorasDelDia espacioId={id} fecha={fechaSeleccionada} />
        </div>
      )}
    </div>
  );

  return (
    <div className="reserva-layout" ref={layoutRef}>
      {espacios.length === 0 && (
        <p className="no-espacios-msg">No hay espacios disponibles.</p>
      )}

      {espacios.map(({ id_espacio, espacio, imagen_url }) => (
        <div
          key={id_espacio}
          className={`tarjeta ${espacioSeleccionado === espacio ? "flipped" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleSeleccion(espacio);
          }}
        >
          <div className="tarjeta-inner">
            <div className="tarjeta-front">
              <h2>{espacio}</h2>
              <img src={imagen_url} alt={espacio} />
            </div>
            <div className="tarjeta-back">{renderContenido(id_espacio, espacio)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
