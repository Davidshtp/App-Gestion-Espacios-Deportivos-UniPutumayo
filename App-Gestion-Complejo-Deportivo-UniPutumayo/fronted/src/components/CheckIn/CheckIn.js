import React, { useEffect, useRef, useState } from 'react';
import api from '../../config/axiosConfig';
import './CheckIn.css';

export default function CheckIn() {
  const scannerRef = useRef(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setMessage('Inicializando cámara...');

    // Cargamos la librería dinámicamente para evitar problemas si no está instalada
    import('html5-qrcode')
      .then(({ Html5QrcodeScanner }) => {
        if (!mounted) return;
        const config = { fps: 10, qrbox: 280 };
        scannerRef.current = new Html5QrcodeScanner('qr-reader', config, false);

        const onScanSuccess = async (decodedText) => {
          // Evitar reentradas
          if (!mounted) return;
          
          // Activar loading y limpiar estados previos
          setLoading(true);
          setMessage(null);
          setError(null);
          setResult(null);

          try {
            // Esperamos que el QR sea una URL con /checkin/scan/{id}?t={token}
            const url = new URL(decodedText);
            const parts = url.pathname.split('/').filter(Boolean);
            const reservaIdStr = parts[parts.length - 1];
            const reservaId = parseInt(reservaIdStr, 10);
            const token = url.searchParams.get('t');

            if (!reservaId || !token) throw new Error('Formato de QR no reconocido');

            // Hacer la petición
            const resp = await api.post('/qr/validar', { reservaId, token });
            
            // Delay mínimo para mostrar el spinner (mejor UX)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (!mounted) return;
            
            setResult(resp.data);
            setError(null);
          } catch (err) {
            console.error(err);
            
            // Delay mínimo para mostrar el spinner incluso en errores
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (!mounted) return;
            
            setError(err?.response?.data?.message || err.message || 'Error validando QR');
            setResult(null);
          } finally {
            if (mounted) {
              setLoading(false);
              // detener y limpiar el scanner
              try {
                await scannerRef.current.clear();
              } catch (e) {
                // ignore
              }
            }
          }
        };

        const onScanError = (err) => {
          // no mostrar cada error menor
          // console.debug('scan error', err);
        };

        scannerRef.current.render(onScanSuccess, onScanError);
        setMessage('Apunta la cámara al código QR');
      })
      .catch((err) => {
        console.error('No se pudo cargar html5-qrcode', err);
        setError('No se pudo acceder a la cámara. Instala la dependencia `html5-qrcode` y recarga.');
        setMessage(null);
      });

    return () => {
      mounted = false;
      if (scannerRef.current) {
        // clear devuelve una promesa
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const handleRestart = () => {
    setResult(null);
    setError(null);
    setMessage(null);
    setLoading(false);
    // recargar la página del componente para re-iniciar el scanner
    window.location.reload();
  };

  return (
    <div className="checkin-wrapper">
      <h2>Check-in (escáner QR)</h2>
      <div id="qr-reader" className="qr-reader" />

      {message && <p className="ci-message">{message}</p>}
      {error && <p className="ci-error">{error}</p>}
      
      {loading && (
        <div className="ci-loading">
          <div className="ci-spinner"></div>
          <p className="ci-loading-text">Validando código QR...</p>
        </div>
      )}

      {result && (
        <div className="ci-result">
          <div className={`ci-status ${result.valido ? 'success' : 'error'}`}>
            <span className="ci-icon">{result.valido ? '✓' : '✗'}</span>
            <span className="ci-message">{result.mensaje}</span>
          </div>
          
          {result.valido && result.reservaId && (
            <div className="ci-details">
              <p>Reserva #{result.reservaId} • {result.estado?.replace('_', ' ')}</p>
              {result.fechaUso && (
                <p className="ci-timestamp">Procesado: {new Date(result.fechaUso).toLocaleString('es-CO')}</p>
              )}
            </div>
          )}
          
          {!result.valido && (
            <div className="ci-details">
              {result.mensaje?.includes('expirado') && (
                <div className="ci-expired">
                  <p>⏰ El código QR ha expirado</p>
                  <p className="ci-info">Los códigos QR son válidos por 20 minutos:</p>
                  <p className="ci-info">• Desde 5 min antes de la hora de inicio</p>
                  <p className="ci-info">• Hasta 15 min después de la hora de inicio</p>
                  <p className="ci-warning">La reserva se canceló automáticamente por no usar el QR a tiempo.</p>
                </div>
              )}
              {result.mensaje?.includes('no disponible todavía') && result.disponibleDesde && (
                <div className="ci-early">
                  <p>⏳ Demasiado temprano</p>
                  <p className="ci-info">Disponible desde: {new Date(result.disponibleDesde).toLocaleString('es-CO')}</p>
                </div>
              )}
              {result.mensaje?.includes('ya fue utilizado') && result.fechaUso && (
                <div className="ci-used">
                  <p>🔒 Ya fue escaneado</p>
                  <p className="ci-info">Usado el: {new Date(result.fechaUso).toLocaleString('es-CO')}</p>
                </div>
              )}
            </div>
          )}
          
          <button className="btn" onClick={handleRestart}>Escanear otro</button>
        </div>
      )}

      {!result && !error && (
        <p className="ci-hint">Asegúrate de permitir el acceso a la cámara y de usar un dispositivo con cámara (móvil recomendado).</p>
      )}
    </div>
  );
}
