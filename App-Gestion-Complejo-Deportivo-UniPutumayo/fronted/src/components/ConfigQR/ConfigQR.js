import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerConfiguraciones,
  actualizarConfiguracion,
} from '../../Services/config/configService';
import './ConfigQR.css';

export default function ConfigQR() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [valores, setValores] = useState({});

  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  const cargarConfiguraciones = async () => {
    try {
      setLoading(true);
      const data = await obtenerConfiguraciones();
      setConfigs(data);
      // Inicializar valores con los actuales
      const valoresIniciales = {};
      data.forEach((config) => {
        valoresIniciales[config.clave] = config.valor;
      });
      setValores(valoresIniciales);
    } catch (error) {
      console.error('Error cargando configuraciones:', error);
      Swal.fire('Error', 'No se pudieron cargar las configuraciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (clave) => {
    setEditando(clave);
  };

  const handleCancelar = () => {
    setEditando(null);
    cargarConfiguraciones();
  };

  const handleGuardar = async (clave) => {
    const nuevoValor = parseInt(valores[clave], 10);

    if (!Number.isInteger(nuevoValor) || nuevoValor <= 0) {
      Swal.fire('Error', 'El valor debe ser un número positivo', 'error');
      return;
    }

    try {
      await actualizarConfiguracion(clave, nuevoValor);
      Swal.fire(
        'Éxito',
        'Configuración actualizada correctamente',
        'success'
      );
      setEditando(null);
      cargarConfiguraciones();
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      Swal.fire(
        'Error',
        error?.response?.data?.message || 'Error al actualizar',
        'error'
      );
    }
  };

  const handleInputChange = (clave, valor) => {
    setValores({
      ...valores,
      [clave]: valor,
    });
  };

  if (loading) {
    return <div className="config-loading">Cargando configuraciones...</div>;
  }

  return (
    <div className="config-qr-container">
      <h2>Configuración de Códigos QR</h2>
      <p className="config-description">
        Aquí puedes ajustar los tiempos para la generación y validación de códigos QR
      </p>

      <div className="config-grid">
        {configs.map((config) => (
          <div key={config.clave} className="config-card">
            <div className="config-header">
              <h3>{config.descripcion || config.clave}</h3>
            </div>

            <div className="config-content">
              {editando === config.clave ? (
                <div className="config-edit">
                  <input
                    type="number"
                    min="1"
                    value={valores[config.clave]}
                    onChange={(e) =>
                      handleInputChange(config.clave, e.target.value)
                    }
                    className="config-input"
                  />
                  <span className="config-unit">minutos</span>
                </div>
              ) : (
                <div className="config-display">
                  <span className="config-value">{config.valor}</span>
                  <span className="config-unit">minutos</span>
                </div>
              )}
            </div>

            <div className="config-footer">
              {editando === config.clave ? (
                <>
                  <button
                    className="btn btn-save"
                    onClick={() => handleGuardar(config.clave)}
                  >
                    Guardar
                  </button>
                  <button
                    className="btn btn-cancel"
                    onClick={handleCancelar}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-edit"
                  onClick={() => handleEditar(config.clave)}
                >
                  Editar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="config-info">
        <h4>ℹ️ Información:</h4>
        <ul>
          <li>
            <strong>Minutos Antes:</strong> Tiempo antes de la hora de inicio
            en que se genera el código QR para escanear
          </li>
          <li>
            <strong>Minutos Después:</strong> Tiempo después de la hora de
            inicio durante el cual el código QR sigue siendo válido
          </li>
        </ul>
      </div>
    </div>
  );
}
