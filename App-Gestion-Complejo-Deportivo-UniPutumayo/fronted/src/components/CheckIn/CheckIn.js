import React, { useEffect, useRef, useState } from 'react';
import api from '../../config/axiosConfig';
import './CheckIn.css';

export default function CheckIn() {
  const scannerRef = useRef(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

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
          if (!mounted || isValidating) return;
          
          // Mostrar spinner inmediatamente
          setIsValidating(true);
          setMessage(null);
          setError(null);
          setResult(null);

          // Delay mínimo de 1.5 segundos para mostrar el spinner
          const startTime = Date.now();

          try {
            // Detener el scanner inmediatamente
            await scannerRef.current.clear();
            
            // Esperamos que el QR sea una URL con /checkin/scan/{id}?t={token}
            const url = new URL(decodedText);
            const parts = url.pathname.split('/').filter(Boolean);
            const reservaIdStr = parts[parts.length - 1];
            const reservaId = parseInt(reservaIdStr, 10);
            const token = url.searchParams.get('t');

            if (!reservaId || !token) throw new Error('Formato de QR no reconocido');

            // Realizar la validación
            const resp = await api.post('/qr/validar', { reservaId, token });
            
            // Calcular tiempo transcurrido y añadir delay si es necesario
            const elapsed = Date.now() - startTime;
            const minimumDelay = 1500; // 1.5 segundos
            
            if (elapsed < minimumDelay) {
              await new Promise(resolve => setTimeout(resolve, minimumDelay - elapsed));
            }
            
            // Mostrar resultado
            setResult(resp.data);
            setMessage(resp.data?.mensaje ?? 'Check-in procesado');
            setError(null);
            
          } catch (err) {
            // Añadir delay también para errores
            const elapsed = Date.now() - startTime;
            const minimumDelay = 1500;
            
            if (elapsed < minimumDelay) {
              await new Promise(resolve => setTimeout(resolve, minimumDelay - elapsed));
            }
            
            console.error(err);
            setError(err?.response?.data?.message || err.message || 'Error validando QR');
            setMessage(null);
            setResult(null);
          } finally {
            setIsValidating(false);
          }
        };

        const onScanError = (err) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestart = () => {
    setResult(null);
    setError(null);
    setMessage('Reiniciando cámara...');
    setIsValidating(false);
    window.location.reload();
  };

  return (
    <div className="checkin-wrapper">
      <h2>Check-in (escáner QR)</h2>
      <div id="qr-reader" className="qr-reader" />

      {/* Spinner de validación */}
      {isValidating && (
        <div className="validation-spinner">
          <div className="spinner"></div>
          <p className="validation-text">Validando código QR...</p>
        </div>
      )}

      {!isValidating && message && <p className="ci-message">{message}</p>}
      {!isValidating && error && <p className="ci-error">{error}</p>}

      {!isValidating && result && (
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

      {!result && !error && !isValidating && (
        <p className="ci-hint">Asegúrate de permitir el acceso a la cámara y de usar un dispositivo con cámara (móvil recomendado).</p>
      )}
    </div>
  );
}
