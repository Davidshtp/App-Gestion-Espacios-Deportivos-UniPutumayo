import React, { useState, useEffect } from 'react';
import './ReservasActivasUsuario.css';
import { obtenerReservasActivasDelUsuario } from '../../../Services/reservas/reservaService';
import { FaClipboardCheck } from 'react-icons/fa';
import useReservaSocket from '../../../hooks/useReservaSocket';

export default function ReservasActivasUsuario() {
  const [reservas, setReservas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useReservaSocket();

  const fetchReservas = async () => {
    try {
      const response = await obtenerReservasActivasDelUsuario();
      setReservas(response.total);
    } catch (err) {
      console.error("Error al cargar las reservas activas:", err);
      setError('Ocurrió un error. No se pudo cargar el conteo de reservas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
    const handleNovedad = () => fetchReservas();
    window.addEventListener("novedad-reservas", handleNovedad);

    return () => {
      window.removeEventListener("novedad-reservas", handleNovedad);
    };
  }, []);

  if (loading) {
    return (
      <div className="stat-card">
        <p className="loading-text">Cargando reservas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stat-card error-card">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="stat-card azul">
      <div className="card-header">
        <FaClipboardCheck className="card-icon" />
        <p className="stat-number">{reservas}</p>
      </div>
      <p className="stat-label">Reservas activas</p>
      <div className="eventos-detalle">
        {reservas > 0 ? (
          <p>Actualmente tienes {reservas} reservas activas.</p>
        ) : (
          <p>No tienes reservas activas en este momento.</p>
        )}
      </div>
    </div>
  );
}
