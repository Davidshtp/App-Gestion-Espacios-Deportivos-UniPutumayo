import React from 'react';
import './ModalDetalleEvento.css';
import Linkify from 'linkify-react';

export default function ModalDetalleEvento({ evento, onClose }) {
  const opcionesLinkify = {
    target: '_blank',
    rel: 'noopener noreferrer'
  };

  if (!evento) return null;

  return (
    <div className="modal-overlay-minimal" onClick={onClose}>
      <div className="modal-container-minimal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header minimalista */}
        <div className="modal-header-minimal">
          <h2 className="modal-title-minimal">{evento.nombre}</h2>
          <button className="modal-close-minimal" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="modal-content-minimal">
          
          {/* Imagen */}
          {evento.url_imagen_evento && (
            <div className="modal-image-wrapper">
              <img 
                className="modal-image-minimal" 
                src={evento.url_imagen_evento} 
                alt={evento.nombre}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Fecha */}
          <div className="modal-date-minimal">
            {new Date(evento.fecha_hora_evento).toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric", 
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </div>

          {/* Descripción */}
          <div className="modal-description-minimal">
            <Linkify options={opcionesLinkify}>{evento.descripcion}</Linkify>
          </div>

        </div>
      </div>
    </div>
  );
}
