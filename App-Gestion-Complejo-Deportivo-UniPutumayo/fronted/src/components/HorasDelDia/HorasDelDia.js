import "./HorasDelDia.css";
import Swal from "sweetalert2";
import useHorasDelDia from "./hooks/useHorasDelDia";
import { reservarTodoElDia } from "../../Services/reservas/reservaService";
import { useState } from "react";
import { MdCalendarMonth } from "react-icons/md";

export default function HorasDelDia({ fecha, espacioId }) {
  const {
    reservas,
    user,
    HORAS_DEL_DIA,
    esHoraPasada,
    handleCrearReserva,
    handleCancelarReserva,
    handleMarcarEnUso,
    handleLiberarReserva,
    actualizarReservasLocalmente,
  } = useHorasDelDia(fecha, espacioId);

  const [cargando, setCargando] = useState(false);
  const fechaFormateada = fecha.split("-").reverse().join("/");
  const esAdministrador = user && user.rolId === 1;

  // 👇 Botón admin para reservar todo el día
  const handleReservarTodoElDia = async () => {
    if (!espacioId || !fecha) return;

    const confirmacion = await Swal.fire({
      title: `¿Reservar todo el día ${fechaFormateada}?`,
      text: "Esto cancelará reservas existentes y bloqueará todas las horas disponibles.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, reservar todo el día",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      setCargando(true);
      const resultado = await reservarTodoElDia(espacioId, fecha);

      await Swal.fire({
        title: "¡Hecho!",
        text: resultado.message || "Se reservaron todas las horas disponibles.",
        icon: "success",
      });

      // 🔄 refresca desde el hook sin recargar página
      await actualizarReservasLocalmente();
    } catch (err) {
      console.error("Error al reservar todo el día:", err);
      await Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "No se pudo reservar todo el día.",
        icon: "error",
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="horas-container">
      <div className="header-horas">
        <h2>Disponibilidad del {fechaFormateada}</h2>

        {esAdministrador && (
          <button
            className="icono-reservar-dia"
            onClick={handleReservarTodoElDia}
            disabled={cargando}
            title="Reservar todo el día"
          >
            <MdCalendarMonth size={22} />
          </button>
        )}
      </div>

      <div className="horas-grid">
        {HORAS_DEL_DIA.map((hora) => {
          const pasada = esHoraPasada(fecha, hora);
          const reserva = reservas[hora];
          const estado = reserva?.estado || "disponible";
          const clase = pasada ? "pasada" : estado;
          const esLibre = !pasada && !reserva;

          const esMiReserva =
            user && reserva && reserva.usuario_id === user.userId;
          const esAdmin = user && user.rolId === 1;

          const mostrarBotonCancelar =
            !pasada &&
            reserva &&
            (estado === "reservado" || estado === "esperando") &&
            (esMiReserva || esAdmin);

          const mostrarBotonEnUso =
            !pasada &&
            reserva &&
            (estado === "esperando" || estado === "uso_libre") &&
            esAdmin;

          const mostrarBotonLiberar =
            !pasada && reserva && estado === "en_uso" && esAdmin;

          return (
            <div
              key={hora}
              className={`hora-card ${clase}`}
              onClick={() => {
                if (esLibre) handleCrearReserva(hora);
              }}
              style={{ pointerEvents: pasada ? "none" : "auto" }}
            >
              <div className="hora-header">{hora}</div>

              {!pasada && reserva && (
                <>
                  <div className="hora-estado">
                    {estado === "esperando" ? (
                      <span className="animando">
                        Esperando<span className="puntos">...</span>
                      </span>
                    ) : (
                      estado.replace("_", " ")
                    )}
                  </div>
                  <div className="hora-usuario">
                    {reserva.evento ||
                      reserva.usuario ||
                      "Puedes jugar sin reserva"}
                  </div>

                  <div className="acciones">
                    {mostrarBotonCancelar && (
                      <button
                        className="boton cancelar"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelarReserva(hora, hora);
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                    {mostrarBotonEnUso && (
                      <button
                        className="boton en-uso"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarcarEnUso(hora, hora);
                        }}
                      >
                        En uso
                      </button>
                    )}
                    {mostrarBotonLiberar && (
                      <button
                        className="boton liberar"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLiberarReserva(hora, hora);
                        }}
                      >
                        Liberar
                      </button>
                    )}
                  </div>
                </>
              )}

              {esLibre && (
                <div className="hora-estado disponible">Disponible</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
