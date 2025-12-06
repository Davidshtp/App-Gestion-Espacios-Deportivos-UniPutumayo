// src/components/GestionEventos/GestionEventos.jsx
import React, { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { FiCalendar, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { obtenerTodosLosEventosParaAdmin, crearEvento, actualizarEvento, eliminarEvento } from '../../Services/eventos/eventosService';
import { useAuth } from '../../context/AuthContext';
import ModalFormularioEvento from './ModalFormulario/ModalFormularioEvento';
import './Eventos.css';
import { mostrarCargando} from '../../utils/alerts';
import ModalDetalleEvento from './ModalDetalleEvento/ModalDetalleEvento';

export default function GestionEventos() {
  const [eventos, setEventos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [eventoEnEdicion, setEventoEnEdicion] = useState(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const { user } = useAuth();

  const abrirModal = (evento) => setEventoSeleccionado(evento);
  const cerrarModal = () => setEventoSeleccionado(null);

  const cargarEventos = useCallback(async () => {
    if (!user || user.rolId !== 1) {
      setEventos([]);
      return;
    }
    try {
      const data = await obtenerTodosLosEventosParaAdmin();
      setEventos(data);
    } catch (error) {
      Swal.fire('Error', 'No se pudieron cargar los eventos.', 'error');
    }
  }, [user]);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);


  const handleEliminarEvento = async (evento) => {
    const confirmar = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás el evento "${evento.nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmar.isConfirmed) return;

    try {
      await eliminarEvento(evento.id_evento);
      Swal.fire('Eliminado', 'Evento eliminado correctamente.', 'success');
      cargarEventos();
    } catch (error) {
      Swal.fire('Error', 'No se pudo eliminar el evento.', 'error');
    }
  };

  const handleGuardarEvento = async (formData) => {

    mostrarCargando(eventoEnEdicion ? 'Actualizando evento...' : 'Creando evento...');
    try {
      if (eventoEnEdicion) {
        await actualizarEvento(eventoEnEdicion.id_evento, formData);
        Swal.fire('Actualizado', 'Evento actualizado correctamente.', 'success');
        setMostrarModal(false)

      } else {
        await crearEvento(formData);
        Swal.fire('Creado', 'Evento creado correctamente.', 'success');
        setMostrarModal(false)
      }
      cargarEventos();
    } catch (error) {
      Swal.fire('Error', 'No se pudo guardar el evento.', 'error');
    }
  };

  if (!user || user.rolId !== 1) {
    return <p className="access-denied-message">Acceso denegado. Solo administradores.</p>;
  }

  return (
    <div className="gestion-eventos-container">
      <h1>Gestión de Eventos</h1>
      <button className="btn-crear-evento" onClick={() => {
        setEventoEnEdicion(null);
        setMostrarModal(true);
      }}>
        <FiPlus size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Crear Nuevo Evento
      </button>

      <ModalFormularioEvento
        visible={mostrarModal}
        onClose={() => setMostrarModal(false)}
        onSubmit={handleGuardarEvento}
        eventoInicial={eventoEnEdicion}
      />

      {eventos.length === 0 ? (
        <p className="no-eventos-msg">No hay eventos para mostrar. ¡Crea uno!</p>
      ) : (
        <div className="eventos-lista">
          {eventos.map((evento) => (
            <div key={evento.id_evento} className={`evento-card`} onClick={() => abrirModal(evento)}>
              <div className="evento-imagen">
                {evento.url_imagen_evento ? (
                  <img src={evento.url_imagen_evento} alt={evento.nombre} />
                ) : (
                  <div className="placeholder-imagen">Sin Imagen</div>
                )}
              </div>
              <div className="evento-content">
                <div className="evento-info">
                  <h3 className="evento-titulo">{evento.nombre}</h3>
                  <div className="evento-fecha-container">
                    <FiCalendar className="icon-fecha" />
                    <p className="evento-fecha">
                      {evento.fecha_hora_evento
                        ? new Date(evento.fecha_hora_evento).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : 'Fecha no disponible'}
                    </p>
                  </div>
                  <p className="evento-descripcion">{evento.descripcion}</p>
                </div>
                <div className="evento-acciones">
                  <button
                    className="btn-editar"
                    title="Editar evento"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEventoEnEdicion(evento);
                      setMostrarModal(true);
                    }}
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button 
                    className="btn-eliminar" 
                    title="Eliminar evento"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarEvento(evento);
                    }}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {eventoSeleccionado && (
        <ModalDetalleEvento evento={eventoSeleccionado} onClose={cerrarModal} />
      )}
    </div>
  );
}
