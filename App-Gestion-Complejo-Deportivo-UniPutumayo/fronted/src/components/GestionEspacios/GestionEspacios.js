import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import ModalFormularioEspacio from "./ModalFormulario/ModalFormularioEspacio";
import {
  obtenerTodosLosEspacios,
  crearEspacio,
  actualizarEspacio,
  eliminarEspacio,
} from "../../Services/espacios/espaciosService";
import "./GestionEspacios.css";
import { mostrarCargando } from "../../utils/alerts";

export default function GestionEspacios() {
  const [espacios, setEspacios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [espacioEnEdicion, setEspacioEnEdicion] = useState(null);
  const { user } = useAuth();

  const cargarEspacios = useCallback(async () => {
    if (!user || user.rolId !== 1) {
      setEspacios([]);
      return;
    }
    try {
      const data = await obtenerTodosLosEspacios(); // <-- usando servicio
      setEspacios(data);
    } catch (error) {
      Swal.fire("Error", "No se pudieron cargar los espacios.", "error");
    }
  }, [user]);

  useEffect(() => {
    cargarEspacios();
  }, [cargarEspacios]);

  const handleEliminarEspacio = async (espacio) => {
    const confirmar = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Eliminarás el espacio "${espacio.espacio}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmar.isConfirmed) return;

    try {
      await eliminarEspacio(espacio.id_espacio); // <-- usando servicio
      Swal.fire("Eliminado", "Espacio eliminado correctamente.", "success");
      cargarEspacios();
    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar el espacio.", "error");
    }
  };

  const handleGuardarEspacio = async (formData) => {
    mostrarCargando(
      espacioEnEdicion ? "Actualizando espacio..." : "Creando espacio...",
    );
    try {
      if (espacioEnEdicion) {
        await actualizarEspacio(espacioEnEdicion.id_espacio, formData); // <-- usando servicio
        Swal.fire(
          "Actualizado",
          "Espacio actualizado correctamente.",
          "success",
        );
      } else {
        await crearEspacio(formData); // <-- usando servicio
        Swal.fire("Creado", "Espacio creado correctamente.", "success");
      }
      setMostrarModal(false);
      cargarEspacios();
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar el espacio.", "error");
    }
  };

  if (!user || user.rolId !== 1) {
    return (
      <p className="access-denied-message">
        Acceso denegado. Solo administradores.
      </p>
    );
  }

  return (
    <div className="gestion-espacios-container">
      <h1>Gestión de Espacios Deportivos</h1>
      <button
        className="btn-crear-espacio"
        onClick={() => {
          setEspacioEnEdicion(null);
          setMostrarModal(true);
        }}
      >
        Crear Nuevo Espacio
      </button>

      <ModalFormularioEspacio
        visible={mostrarModal}
        onClose={() => setMostrarModal(false)}
        onSubmit={handleGuardarEspacio}
        espacioInicial={espacioEnEdicion}
      />

      {espacios.length === 0 ? (
        <p className="no-espacios-msg">
          No hay espacios para mostrar. ¡Crea uno!
        </p>
      ) : (
        <div className="espacios-lista">
          {espacios.map((espacio) => (
            <div key={espacio.id_espacio} className="espacio-card">
              <div className="espacio-imagen">
                {espacio.imagen_url ? (
                  <img src={espacio.imagen_url} alt={espacio.espacio} />
                ) : (
                  <div className="placeholder-imagen">Sin Imagen</div>
                )}
              </div>
              <div className="espacio-info">
                <h3>{espacio.espacio}</h3>
              </div>
              <div className="espacio-acciones">
                <button
                  className="btn-editar"
                  onClick={() => {
                    setEspacioEnEdicion(espacio);
                    setMostrarModal(true);
                  }}
                >
                  Editar
                </button>
                <button
                  className="btn-eliminar"
                  onClick={() => handleEliminarEspacio(espacio)}
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
