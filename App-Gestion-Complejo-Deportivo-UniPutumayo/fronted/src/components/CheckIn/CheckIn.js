import React, { useEffect, useRef, useState } from 'react';
import api from '../../config/axiosConfig';
import './CheckIn.css';

export default function CheckIn() {
  const scannerRef = useRef(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);

  useEffect(() => {
    let mounted = true;
    let scanner = null;
    setMessage('Inicializando cámara...');

    // Cargamos la librería dinámicamente
    import('html5-qrcode')
      .then(({ Html5QrcodeScanner }) => {
        if (!mounted) return;
        
        // Configuración mejorada para mejor detección
        const config = { 
          fps: 30,  // Aumentado más para mejor detección
          qrbox: { width: 300, height: 300 },  // Aumentado tamaño
          aspectRatio: 1.0,
          disableFlip: false,
          verbose: true  // Para debugging
        };
        
        scanner = new Html5QrcodeScanner('qr-reader', config, false);
        scannerRef.current = scanner;

        const onScanSuccess = async (decodedText) => {
          // Evitar múltiples escaneos simultáneos
          if (!mounted || isValidating || qrScanned) return;
          
          setQrScanned(true);
          setIsValidating(true);
          setMessage(null);
          setError(null);
          setResult(null);

          const startTime = Date.now();

          try {
            console.log('QR decodificado:', decodedText);
            
            // Parsear el QR - Esperamos: http://localhost:3000/checkin/scan/123?t=token
            let reservaId, token;
            
            // Intentar extraer con regex
            const idMatch = decodedText.match(/\/scan\/(\d+)/);
            const tokenMatch = decodedText.match(/[?&]t=([a-f0-9]+)/);
            
            if (idMatch && tokenMatch) {
              reservaId = parseInt(idMatch[1], 10);
              token = tokenMatch[1];
            } else {
              // Si no encuentra el formato esperado, intentar parsear como URL
              try {
                const url = new URL(decodedText);
                const parts = url.pathname.split('/').filter(Boolean);
                // parts será: ['checkin', 'scan', '123']
                if (parts.length >= 3 && parts[0] === 'checkin' && parts[1] === 'scan') {
                  reservaId = parseInt(parts[2], 10);
                  token = url.searchParams.get('t');
                }
              } catch (e) {
                console.error('No se pudo parsear como URL:', decodedText);
              }
            }

            if (!reservaId || !token) {
              throw new Error(`Código QR inválido. Decodificado: "${decodedText}"`);
            }

            console.log('Validando QR - reservaId:', reservaId, 'token:', token);

            // Realizar la validación
            const resp = await api.post('/qr/validar', { reservaId, token });
            
            // Mantener spinner mínimo 1.5 segundos
            const elapsed = Date.now() - startTime;
            const minimumDelay = 1500;
            
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
            
            console.error('Error en validación:', err);
            setError(err?.response?.data?.message || err.message || 'Error validando QR');
            setMessage(null);
            setResult(null);
          } finally {
            setIsValidating(false);
            setQrScanned(false);
          }
        };

        const onScanError = (err) => {
          // Ignorar errores de detección normales
          // console.log('Scan error:', err);
        };

        scanner.render(onScanSuccess, onScanError);
        setMessage('Apunta la cámara al código QR');
      })
      .catch((err) => {
        console.error('No se pudo cargar html5-qrcode', err);
        setError('No se pudo acceder a la cámara. Verifica los permisos y recarga la página.');
        setMessage(null);
      });

    return () => {
      mounted = false;
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestart = async () => {
    // Limpiar resultado primero (para animar la salida)
    setResult(null);
    setError(null);
    setIsValidating(false);
    
    // Pequeño delay para que se vea la transición
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Reconstruir completamente el scanner
    const qrReaderElement = document.getElementById('qr-reader');
    if (qrReaderElement) {
      // Limpiar todo el contenido del scanner
      qrReaderElement.innerHTML = '';
      
      // Reinicializar el scanner
      import('html5-qrcode')
        .then(({ Html5QrcodeScanner }) => {
          const config = { 
            fps: 30,
            qrbox: { width: 300, height: 300 },
            aspectRatio: 1.0,
            disableFlip: false,
            verbose: true
          };
          
          const newScanner = new Html5QrcodeScanner('qr-reader', config, false);
          scannerRef.current = newScanner;
          
          const onScanSuccess = async (decodedText) => {
            if (!qrScanned) {
              setQrScanned(true);
              setIsValidating(true);
              setMessage(null);
              setError(null);
              setResult(null);

              const startTime = Date.now();

              try {
                console.log('QR decodificado:', decodedText);
                
                let reservaId, token;
                
                const idMatch = decodedText.match(/\/scan\/(\d+)/);
                const tokenMatch = decodedText.match(/[?&]t=([a-f0-9]+)/);
                
                if (idMatch && tokenMatch) {
                  reservaId = parseInt(idMatch[1], 10);
                  token = tokenMatch[1];
                } else {
                  try {
                    const url = new URL(decodedText);
                    const parts = url.pathname.split('/').filter(Boolean);
                    if (parts.length >= 3 && parts[0] === 'checkin' && parts[1] === 'scan') {
                      reservaId = parseInt(parts[2], 10);
                      token = url.searchParams.get('t');
                    }
                  } catch (e) {
                    console.error('No se pudo parsear como URL:', decodedText);
                  }
                }

                if (!reservaId || !token) {
                  throw new Error(`Código QR inválido. Decodificado: "${decodedText}"`);
                }

                console.log('Validando QR - reservaId:', reservaId, 'token:', token);

                const resp = await api.post('/qr/validar', { reservaId, token });
                
                const elapsed = Date.now() - startTime;
                const minimumDelay = 1500;
                
                if (elapsed < minimumDelay) {
                  await new Promise(resolve => setTimeout(resolve, minimumDelay - elapsed));
                }
                
                setResult(resp.data);
                setMessage(resp.data?.mensaje ?? 'Check-in procesado');
                setError(null);
                
              } catch (err) {
                const elapsed = Date.now() - startTime;
                const minimumDelay = 1500;
                
                if (elapsed < minimumDelay) {
                  await new Promise(resolve => setTimeout(resolve, minimumDelay - elapsed));
                }
                
                console.error('Error en validación:', err);
                setError(err?.response?.data?.message || err.message || 'Error validando QR');
                setMessage(null);
                setResult(null);
              } finally {
                setIsValidating(false);
                setQrScanned(false);
              }
            }
          };

          const onScanError = (err) => {
            // Ignorar errores de detección normales
          };

          newScanner.render(onScanSuccess, onScanError);
        })
        .catch((err) => {
          console.error('Error reinicializando scanner:', err);
        });
    }
    
    setQrScanned(false);
    setMessage('Apunta la cámara al código QR');
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
