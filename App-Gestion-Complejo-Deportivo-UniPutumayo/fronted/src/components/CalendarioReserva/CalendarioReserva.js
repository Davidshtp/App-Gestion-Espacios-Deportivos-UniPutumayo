import React, { useState, useEffect } from "react";
import "./CalendarioReserva.css";
import { getDiasCompletamenteReservados } from "../../Services/reservas/reservaService";

const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function CalendarioReserva({ espacioId, onSelectFecha }) {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [seleccionada, setSeleccionada] = useState(null);
  const [diasCompletos, setDiasCompletos] = useState([]);

  // Función para cargar los días completamente reservados del espacio
  const fetchDiasCompletos = async () => {
    try {
      if (!espacioId) return;
      const data = await getDiasCompletamenteReservados(espacioId);
      setDiasCompletos(data);
    } catch (error) {}
  };

  useEffect(() => {
    fetchDiasCompletos();
  }, [espacioId, fechaActual.getMonth(), fechaActual.getFullYear()]);

  useEffect(() => {
    const handleNovedad = () => {
      fetchDiasCompletos();
    };

    window.addEventListener("novedad-reservas", handleNovedad);
    return () => window.removeEventListener("novedad-reservas", handleNovedad);
  }, [espacioId]);

  const cambiarMes = (meses) => {
    const nueva = new Date(fechaActual);
    nueva.setMonth(nueva.getMonth() + meses);
    setFechaActual(nueva);
  };

  const generarDiasDelMes = () => {
    const inicioMes = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth(),
      1,
    );
    const finMes = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth() + 1,
      0,
    );

    const dias = [];
    for (let i = 0; i < inicioMes.getDay(); i++) dias.push(null);
    for (let i = 1; i <= finMes.getDate(); i++) {
      dias.push(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), i));
    }

    return dias;
  };

  const diasDelMes = generarDiasDelMes();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return (
    <div className="calendario-container">
      <div className="calendario-header">
        <button onClick={() => cambiarMes(-1)}>‹</button>
        <span>
          {fechaActual.toLocaleDateString("es-CO", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button onClick={() => cambiarMes(1)}>›</button>
      </div>

      <div className="calendario-grid dias-semana">
        {diasSemana.map((dia) => (
          <div key={dia} className="cal-dia-semana">
            {dia}
          </div>
        ))}
      </div>

      <div className="calendario-grid dias-del-mes">
        {diasDelMes.map((dia, idx) => {
          if (!dia) return <div key={idx} className="cal-dia-vacio" />;

          const isoFecha = `${dia.getFullYear()}-${String(
            dia.getMonth() + 1,
          ).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`;

          const isToday =
            dia.getDate() === hoy.getDate() &&
            dia.getMonth() === hoy.getMonth() &&
            dia.getFullYear() === hoy.getFullYear();

          const isSelected = isoFecha === seleccionada;
          const esPasado = dia < hoy;
          const estaLleno = diasCompletos.includes(isoFecha);

          return (
            <div key={idx} className="cal-dia">
              <button
                className={`${isToday ? "hoy" : ""} 
                            ${isSelected ? "seleccionada" : ""} 
                            ${estaLleno ? "lleno" : ""}`}
                disabled={esPasado}
                onClick={() => {
                  if (!esPasado) {
                    setSeleccionada(isoFecha);
                    onSelectFecha(isoFecha);
                  }
                }}
              >
                {dia.getDate()}
                {isSelected && <div className="overlay-seleccionada" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
