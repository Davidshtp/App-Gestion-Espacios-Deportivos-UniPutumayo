import React, { useState, useEffect } from 'react';
import './HorasTotalesUsoUsuario.css';
import { obtenerHorasTotalesUso } from '../../../Services/reservas/reservaService'
import { FaClock } from 'react-icons/fa';
import useReservaSocket from '../../../hooks/useReservaSocket';

export default function HorasTotalesUsoUsuario() {
  const [horas, setHoras] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useReservaSocket();

  const fetchHoras = async () => {
    try {
      const response = await obtenerHorasTotalesUso();
      setHoras(response.totalHoras);
    } catch (err) {
      console.error("Error al cargar las horas totales de uso:", err);
      setError('No se pudo cargar el total de horas de uso.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoras();
    const handleNovedad = () => fetchHoras();
    window.addEventListener("novedad-reservas", handleNovedad);

    return () => {
      window.removeEventListener("novedad-reservas", handleNovedad);
    };
  }, []);

  if (loading) {
    return (
      <div className="stat-card naranja">
        <p className="loading-text">Cargando horas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stat-card naranja error-card">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="stat-card naranja">
      <div className="card-header">
        <FaClock className="card-icon" />
        <p className="stat-number">{horas} h</p>
      </div>
      <p className="stat-label">Total de horas de uso</p>
      <div className="eventos-detalle">
        {horas > 0 ? (
          <p>Has utilizado los espacios por {horas} horas.</p>
        ) : (
          <p>Aún no has utilizado ningún espacio.</p>
        )}
      </div>
    </div>
  );
}
