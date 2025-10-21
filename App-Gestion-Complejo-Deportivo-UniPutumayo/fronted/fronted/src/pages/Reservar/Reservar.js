import { useRef, useState, useEffect } from "react";
import CalendarioReserva from "../../components/CalendarioReserva/CalendarioReserva";
import HorasDelDia from "../../components/HorasDelDia/HorasDelDia";
import "./Reservar.css";
import sintetica from "../../assets/images/sintetica.jpg";
import polideportivo from "../../assets/images/polideportivo.png";
import useReservaSocket from '../../hooks/useReservaSocket'

export default function Reservar() {
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const contenedorRef = useRef(null);
  const horasRef = useRef(null);

  useReservaSocket()
  
  const toggleSeleccion = (espacio) => {
    if (espacioSeleccionado === null) {
      setEspacioSeleccionado(espacio);
    } else if (espacioSeleccionado === espacio) {
      setEspacioSeleccionado(null);
      setFechaSeleccionada(null);
    }
  };

  // Scroll cuando se selecciona una fecha (con timeout para asegurar render)
  useEffect(() => {
    if (fechaSeleccionada && horasRef.current && contenedorRef.current) {
      const timeout = setTimeout(() => {
        contenedorRef.current.scrollTo({
          top: horasRef.current.offsetTop,
          behavior: "smooth",
        });
      }, 50); // Delay corto para asegurar montaje
      return () => clearTimeout(timeout);
    }
  }, [fechaSeleccionada]);

  const renderContenido = (espacioId) => (
    <div className="contenido-reserva" ref={contenedorRef}>
      <CalendarioReserva
        espacioId={espacioId}
        onSelectFecha={setFechaSeleccionada}
      />
      {fechaSeleccionada && (
        <div ref={horasRef}>
          <HorasDelDia espacioId={espacioId} fecha={fechaSeleccionada} />
        </div>
      )}
    </div>
  );

  return (
    <div className="reserva-layout">
      

      {/* Polideportivo
      // Nota: la tarjeta opuesta es la que se voltea para mostrar el contenido
      // Ej: si selecciono "polideportivo", se voltea la tarjeta de "cancha"*/}
      <div
        className={`tarjeta ${espacioSeleccionado === "cancha" ? "flipped" : ""}`}
        onClick={() => {
          if (
            espacioSeleccionado === null ||
            espacioSeleccionado === "polideportivo"
          ) {
            toggleSeleccion("polideportivo");
          }
        }}
      >
        <div className="tarjeta-inner">
          <div className="tarjeta-front">
            <h2>Polideportivo</h2>
            <img src={polideportivo} alt="Polideportivo" />
          </div>
          <div className="tarjeta-back">
            {espacioSeleccionado === "cancha" && renderContenido(1)}
          </div>
        </div>
      </div>

      {/* Cancha Sintética */}
      <div
        className={`tarjeta ${espacioSeleccionado === "polideportivo" ? "flipped" : ""}`}
        onClick={() => {
          if (
            espacioSeleccionado === null ||
            espacioSeleccionado === "cancha"
          ) {
            toggleSeleccion("cancha");
          }
        }}
      >
        <div className="tarjeta-inner">
          <div className="tarjeta-front">
            <h2>Cancha Sintética</h2>
            <img src={sintetica} alt="Cancha Sintética" />
          </div>
          <div className="tarjeta-back">
            {espacioSeleccionado === "polideportivo" && renderContenido(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
