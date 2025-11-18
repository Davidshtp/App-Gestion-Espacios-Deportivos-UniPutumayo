import React, { useState, useEffect } from 'react';
import './EventosActivos.css';
import { obtenerEventosActivos } from '../../../Services/eventos/eventosService';
import { FaCalendarAlt } from 'react-icons/fa';
import useEventoSocket from '../../../hooks/useEventoSocket';

export default function EventosActivos() {
  const [eventos, setEventos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEventoSocket();

  const fetchEventos = async () => {
    try {
      const response = await obtenerEventosActivos();
      setEventos(response.total);
    } catch (err) {
      console.error("Error al cargar los eventos activos:", err);
      setError('Ocurrió un error. No se pudo cargar el conteo de eventos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
    const handleNovedad = () => fetchEventos();
    window.addEventListener("novedad-evento", handleNovedad);

    return () => {
      window.removeEventListener("novedad-evento", handleNovedad);
    };
  }, []);

  if (loading) {
    return (
      <div className="stat-card">
        <p className="loading-text">Cargando eventos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stat-card verde error-card">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="stat-card  morado">
      <div className="card-header">
        <FaCalendarAlt className="card-icon" />
        <p className="stat-number">{eventos}</p>
      </div>
      <p className="stat-label">Eventos y noticias activos</p>
      <div className="eventos-detalle">
        {eventos > 0 ? (
          <p>¡Hay {eventos} oportunidades esperando por ti!</p>
        ) : (
          <p>No hay eventos activos en este momento.</p>
        )}
      </div>
    </div>
  );
}
