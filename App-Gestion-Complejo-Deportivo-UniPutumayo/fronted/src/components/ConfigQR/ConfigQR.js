import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FiEdit2, FiSave, FiX, FiInfo, FiSettings } from 'react-icons/fi';
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
    return (
      <div className="config-loading-container">
        <div className="config-spinner"></div>
        <p>Cargando configuraciones...</p>
      </div>
    );
  }

  return (
    <div className="config-qr-wrapper">
      <div className="config-qr-container">
        <div className="config-header-section">
          <div className="config-header-content">
            <h1>Configuración QR</h1>
            <p className="config-subtitle">
              Ajusta los tiempos para la generación y validación de códigos QR
            </p>
          </div>
          <div className="config-header-icon">
            <FiSettings size={56} />
          </div>
        </div>

        <div className="config-grid">
          {configs.map((config) => (
            <div key={config.clave} className={`config-card ${editando === config.clave ? 'editing' : ''}`}>
              <div className="config-card-body">
                <div className="config-label-section">
                  <h3>{config.descripcion || config.clave}</h3>
                  <p className="config-label-hint">Tiempo en minutos</p>
                </div>

                <div className="config-value-section">
                  {editando === config.clave ? (
                    <div className="config-edit-mode">
                      <div className="input-wrapper">
                        <input
                          type="number"
                          min="1"
                          value={valores[config.clave]}
                          onChange={(e) =>
                            handleInputChange(config.clave, e.target.value)
                          }
                          className="config-input"
                          autoFocus
                        />
                        <span className="input-unit">min</span>
                      </div>
                    </div>
                  ) : (
                    <div className="config-display-mode">
                      <span className="config-value">{config.valor}</span>
                      <span className="config-unit">minutos</span>
                    </div>
                  )}
                </div>

                <div className="config-actions">
                  {editando === config.clave ? (
                    <>
                      <button
                        className="btn btn-save"
                        onClick={() => handleGuardar(config.clave)}
                        title="Guardar cambios"
                      >
                        <FiSave size={16} />
                        Guardar
                      </button>
                      <button
                        className="btn btn-cancel"
                        onClick={handleCancelar}
                        title="Cancelar edición"
                      >
                        <FiX size={16} />
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-edit"
                      onClick={() => handleEditar(config.clave)}
                      title="Editar configuración"
                    >
                      <FiEdit2 size={16} />
                      Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="config-info-section">
          <div className="info-card">
            <div className="info-icon">
              <FiInfo size={24} />
            </div>
            <div className="info-content">
              <h4>Información</h4>
              <ul>
                <li>
                  <strong>Minutos Antes:</strong> Tiempo previo a la hora de inicio para generar el código QR
                </li>
                <li>
                  <strong>Minutos Después:</strong> Duración de validez del código QR después de iniciada la hora
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
