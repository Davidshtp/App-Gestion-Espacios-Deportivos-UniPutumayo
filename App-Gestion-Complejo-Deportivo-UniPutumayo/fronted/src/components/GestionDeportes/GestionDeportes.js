import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import ModalFormularioDeporte from "./ModalFormulario/ModalFormularioDeporte"
import {obtenerTodosLosDeportes,crearDeporte,actualizarDeporte,eliminarDeporte,} from "../../Services/deportes/deportesService";
import { mostrarCargando } from "../../utils/alerts";
import "./GestionDeportes.css";

export default function GestionDeportes() {
  const [deportes, setDeportes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [deporteEnEdicion, setDeporteEnEdicion] = useState(null);
  const { user } = useAuth();

  const cargarDeportes = useCallback(async () => {
    if (!user || user.rolId !== 1) return;
    try {
      const data = await obtenerTodosLosDeportes();
      setDeportes(data);
    } catch (error) {
      Swal.fire("Error", "No se pudieron cargar los deportes.", "error");
    }
  }, [user]);

  useEffect(() => {
    cargarDeportes();
  }, [cargarDeportes]);

  const handleEliminar = async (deporte) => {
    const confirmar = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Eliminarás el deporte "${deporte.nombre}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmar.isConfirmed) return;

    try {
      await eliminarDeporte(deporte.id_deporte);
      Swal.fire("Eliminado", "Deporte eliminado correctamente.", "success");
      cargarDeportes();
    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar el deporte.", "error");
    }
  };

  const handleGuardar = async (deporte) => {
    mostrarCargando(deporteEnEdicion ? "Actualizando deporte..." : "Creando deporte...");
    try {
      if (deporteEnEdicion) {
        await actualizarDeporte(deporteEnEdicion.id_deporte, deporte);
        Swal.fire("Actualizado", "Deporte actualizado correctamente.", "success");
      } else {
        await crearDeporte(deporte);
        Swal.fire("Creado", "Deporte creado correctamente.", "success");
      }
      setMostrarModal(false);
      cargarDeportes();
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar el deporte.", "error");
    }
  };

  if (!user || user.rolId !== 1)
    return <p className="access-denied-message">Acceso denegado. Solo administradores.</p>;

  return (
    <div className="gestion-deportes-container">
      <h1>Gestión de Deportes</h1>
      <button
        className="btn-crear"
        onClick={() => {
          setDeporteEnEdicion(null);
          setMostrarModal(true);
        }}
      >
        Crear Nuevo Deporte
      </button>

      <ModalFormularioDeporte
        visible={mostrarModal}
        onClose={() => setMostrarModal(false)}
        onSubmit={handleGuardar}
        deporteInicial={deporteEnEdicion}
      />

      {deportes.length === 0 ? (
        <p className="no-items-msg">No hay deportes para mostrar. ¡Crea uno!</p>
      ) : (
        <div className="deportes-lista">
          {deportes.map((deporte) => (
            <div key={deporte.id_deporte} className="deporte-card">
              <h3>{deporte.nombre}</h3>
              <div className="deporte-acciones">
                <button
                  className="btn-editar"
                  onClick={() => {
                    setDeporteEnEdicion(deporte);
                    setMostrarModal(true);
                  }}
                >
                  Editar
                </button>
                <button
                  className="btn-eliminar"
                  onClick={() => handleEliminar(deporte)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
