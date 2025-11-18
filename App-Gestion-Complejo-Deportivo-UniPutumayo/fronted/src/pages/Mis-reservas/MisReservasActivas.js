import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  getMisReservasActivas,
  cancelarReserva,
} from "../../Services/reservas/reservaService";
import "./MisReservasActivas.css";

function MisReservasActivas() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReservas = async () => {
    try {
      const data = await getMisReservasActivas();
      setReservas(data);
    } catch (error) {
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  const handleCancelar = async (reserva) => {
    const confirmar = await Swal.fire({
      title: "¿Cancelar reserva?",
      text: `Cancelarás tu reserva del ${new Date(
        reserva.fecha_hora,
      ).toLocaleString("es-CO")} en "${reserva.espacio}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });

    if (!confirmar.isConfirmed) return;

    try {
      await cancelarReserva({
        fecha_hora: reserva.fecha_hora,
        espacio_id: reserva.id_espacio,
      });

      Swal.fire(
        "Cancelada",
        "Tu reserva fue cancelada correctamente.",
        "success",
      );
      fetchReservas(); // Recargar lista
    } catch (error) {
      console.error("Error al cancelar reserva:", error);
      Swal.fire("Error", "No se pudo cancelar la reserva.", "error");
    }
  };

  if (loading) return <p className="no-reservas-msg">Cargando reservas...</p>;

  if (reservas.length === 0)
    return (
      <p className="no-reservas-msg">
        No tienes reservas activas en este momento.
      </p>
    );

  return (
    <div className="mis-reservas-container">
      <h2>Mis Reservas Activas</h2>

      <div className="reservas-lista">
        {reservas.map((r) => (
          <div key={r.id_reserva} className="reserva-card">
            <span className={`reserva-estado ${r.estado}`}>
              {r.estado.replace("_", " ").toUpperCase()}
            </span>
            <p>
              <strong>Espacio:</strong> {r.espacio || "Sin asignar"}
            </p>
            <p>
              <strong>Hora:</strong>{" "}
              {new Date(r.fecha_hora).toLocaleString("es-CO")}
            </p>
            <p>
              <strong>Deporte:</strong> {r.deporte || "No especificado"}
            </p>
            {r.evento && (
              <p>
                <strong>Evento:</strong> {r.evento}
              </p>
            )}
            <button
              className="btn-cancelar-reserva"
              onClick={() => handleCancelar(r)}
            >
              Cancelar Reserva
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MisReservasActivas;
