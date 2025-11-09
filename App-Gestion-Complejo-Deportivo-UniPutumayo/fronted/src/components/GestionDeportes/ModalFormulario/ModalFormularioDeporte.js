import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "./ModalFormularioDeporte.css";

export default function ModalFormularioDeporte({
  visible,
  onClose,
  onSubmit,
  deporteInicial,
}) {
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (deporteInicial) setNombre(deporteInicial.nombre);
    else setNombre("");
  }, [deporteInicial, visible]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      Swal.fire("Error", "El nombre del deporte es obligatorio.", "error");
      return;
    }
    onSubmit({ nombre: nombre.trim() });
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>{deporteInicial ? "Editar Deporte" : "Crear Deporte"}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nombre del deporte</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Fútbol"
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn-submit">
              {deporteInicial ? "Actualizar" : "Crear"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setNombre("");
                onClose();
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
