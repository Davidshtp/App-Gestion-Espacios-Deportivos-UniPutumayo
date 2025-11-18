import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import './ReservaQr.css';

export default function ReservaQr({ reserva }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dataUrl, setDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const closeTimerRef = useRef(null);
  const ANIMATION_DURATION = 160; // ms - debe coincidir con CSS

  // Desestructuramos de forma segura para que los hooks se llamen siempre
  const { id_reserva, qr_token, qr_available_from, qr_expires_at } = reserva || {};

  const qrValue = `${window.location.origin}/checkin/scan/${id_reserva}?t=${qr_token}`;

  useEffect(() => {
    let mounted = true;
    async function generate() {
      if (!qr_token) {
        setDataUrl(null);
        return;
      }
      setGenerating(true);
      try {
        const url = await QRCode.toDataURL(qrValue, { width: 300 });
        if (mounted) setDataUrl(url);
      } catch (err) {
        console.error('Error generando QR:', err);
        if (mounted) setDataUrl(null);
      } finally {
        if (mounted) setGenerating(false);
      }
    }

    // Solo generar cuando el modal se abre (evita trabajo innecesario)
    if (open) generate();

    return () => { mounted = false; };
  }, [open, qr_token, qrValue]);

  // Mantener el bloqueo de scroll mientras el modal está abierto o en proceso de cierre
  useEffect(() => {
    if (open || closing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open, closing]);

  // Cerrar modal con Escape cuando esté abierto o en proceso de cierre (accesibilidad)
  useEffect(() => {
    if (!open && !closing) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closing]);

  const handleOpen = () => {
    // Defer abrir el modal para que el click que lo dispara termine
    setTimeout(() => {
      // cancelar cualquier cierre pendiente
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setClosing(false);
      setOpen(true);
    }, 0);
  };

  const handleClose = () => {
    if (!open || closing) return;
    setClosing(true);
    // esperar a que termine la animación antes de desmontar
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
      closeTimerRef.current = null;
    }, ANIMATION_DURATION);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `reserva-${id_reserva}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Solo conservar la descarga y el cierre; eliminar abrir en nueva pestaña y copiar token

  if (!reserva) return null;

  return (
    <div className="reserva-qr-wrapper">
      <button className="btn-mostrar-qr" onClick={handleOpen} disabled={!qr_token}>
        {qr_token ? 'Mostrar QR' : 'QR no disponible'}
      </button>

      {(open || closing) && createPortal(
        <div className={`qr-modal-backdrop ${closing ? 'closing' : ''}`} onClick={handleClose}>
          <div className={`qr-modal ${closing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button className="qr-close-btn" onClick={handleClose} aria-label="Cerrar">×</button>
            <h3>Código QR - Reserva {id_reserva}</h3>

            {generating && <p>Generando código QR...</p>}
            {!generating && dataUrl && (
              <img src={dataUrl} alt="Código QR" />
            )}
            {!generating && !dataUrl && (
              <p>No se pudo generar el código QR.</p>
            )}

            <div className="qr-meta">
              {qr_available_from && (
                <small>Disponible desde: {new Date(qr_available_from).toLocaleString()}</small>
              )}
              {qr_expires_at && (
                <small>Expira: {new Date(qr_expires_at).toLocaleString()}</small>
              )}
            </div>

            <div className="qr-actions">
              <button className="btn" onClick={handleDownload} disabled={!dataUrl}>Descargar</button>
              <button className="btn btn-close" onClick={handleClose}>Cerrar</button>
            </div>
            <p className="qr-note">Este QR se genera localmente en tu navegador a partir del token almacenado.</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
