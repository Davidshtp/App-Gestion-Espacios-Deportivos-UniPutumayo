import React from "react";
import "./ModalDetalleEvento.css";
import Linkify from "linkify-react";

export default function ModalDetalleEvento({ evento, onClose }) {
  const opcionesLinkify = {
    target: "_blank",
    rel: "noopener noreferrer",
  };

  if (!evento) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="cerrar-modal" onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {evento.url_imagen_evento && (
            <img
              className="modal-imagen"
              src={evento.url_imagen_evento}
              alt={evento.nombre}
            />
          )}
          <h3>{evento.nombre}</h3>
          <p className="modal-fecha">
            {new Date(evento.fecha_hora_evento).toLocaleString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="modal-descripcion">
            <Linkify options={opcionesLinkify}>{evento.descripcion}</Linkify>
          </p>
        </div>
      </div>
    </div>
  );
}
