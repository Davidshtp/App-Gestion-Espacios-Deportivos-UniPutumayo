import "./HorasDelDia.css";
import useHorasDelDia from "./hooks/useHorasDelDia";

export default function HorasDelDia({ fecha, espacioId }) {
  const { reservas, user, HORAS_DEL_DIA, esHoraPasada, handleCrearReserva, handleCancelarReserva, handleMarcarEnUso, handleLiberarReserva, } = useHorasDelDia(fecha, espacioId);

  const fechaFormateada = fecha.split("-").reverse().join("/");

  return (
    <div className="horas-container">
      <h2>Disponibilidad del {fechaFormateada}</h2>
      <div className="horas-grid">
        {HORAS_DEL_DIA.map((hora) => {
          const pasada = esHoraPasada(fecha, hora);
          const reserva = reservas[hora];
          const estado = reserva?.estado || "disponible";
          const clase = pasada ? "pasada" : estado;
          const esLibre = !pasada && !reserva;

          // Variables de control para permisos
          const esMiReserva = user && reserva && reserva.usuario_id === user.userId;
          const esAdministrador = user && user.rolId === 1; // Ajusta el ID si tu admin tiene otro rolId

          // Condición para mostrar el botón de cancelar
          const mostrarBotonCancelar =
            !pasada &&
            reserva &&
            (estado === "reservado" || estado === "esperando") &&
            (esMiReserva || esAdministrador);

          // Condición para mostrar el botón de "En uso"
          const mostrarBotonEnUso =
            !pasada &&
            reserva &&
            (estado === "esperando" || estado === "uso_libre") &&
            esAdministrador;


          // Condición para mostrar el botón de "Liberar"
          const mostrarBotonLiberar =
            !pasada &&
            reserva &&
            estado === "en_uso" &&
            esAdministrador;

          return (
            <div
              key={hora}
              className={`hora-card ${clase}`}
              onClick={() => {
                if (esLibre) handleCrearReserva(hora);
              }}
              style={{
                pointerEvents: pasada ? "none" : "auto",
              }}
            >
              <div className="hora-header">{hora}
              </div>

              {!pasada && reserva && (
                <>
                  <div className="hora-estado">
                    {estado === "esperando" ? (
                      <span className="animando">Esperando<span className="puntos">...</span></span>
                    ) : estado.replace("_", " ")}
                  </div>
                  <div className="hora-usuario">
                    {reserva.evento || reserva.usuario || 'Puedes jugar sin reserva'}
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
                      <button className="boton en-uso" onClick={(e) => {
                        e.stopPropagation();
                        handleMarcarEnUso(hora, hora);
                      }}>
                        En uso
                      </button>
                    )}

                    {mostrarBotonLiberar && (
                      <button className="boton liberar" onClick={(e) => {
                        e.stopPropagation();
                        handleLiberarReserva(hora, hora);
                      }}>
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