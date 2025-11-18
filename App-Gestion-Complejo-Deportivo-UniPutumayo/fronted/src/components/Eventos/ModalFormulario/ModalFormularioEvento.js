// src/components/GestionEventos/ModalFormularioEvento.jsx
import React, { useState, useEffect, useRef } from "react";
import CalendarioReserva from "../../CalendarioReserva/CalendarioReserva";
import "./ModalFormularioEvento.css";
import Swal from "sweetalert2";

export default function ModalFormularioEvento({
  visible,
  onClose,
  onSubmit,
  eventoInicial = null,
}) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const dropRef = useRef();

  useEffect(() => {
    if (eventoInicial) {
      setNombre(eventoInicial.nombre || "");
      setDescripcion(eventoInicial.descripcion || "");
      const fechaCompleta = new Date(eventoInicial.fecha_hora_evento);
      if (!isNaN(fechaCompleta)) {
        setFecha(fechaCompleta.toISOString().split("T")[0]);
        setHora(fechaCompleta.toTimeString().substring(0, 5));
      }
      setPreviewUrl(eventoInicial.url_imagen_evento || "");
    } else {
      setNombre("");
      setDescripcion("");
      setFecha(null);
      setHora("");
      setFile(null);
      setPreviewUrl("");
    }
  }, [eventoInicial]);

  const handleFile = (selected) => {
    if (!selected) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/webp",
    ];
    if (!allowedTypes.includes(selected.type)) {
      Swal.fire({
        icon: "warning",
        title: "Tipo de archivo no permitido",
        text: "Solo se permiten imágenes PNG, JPG, SVG o WEBP.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "Imagen demasiado grande",
        text: "El tamaño máximo permitido es 2MB.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(selected);
  };

  const resetFormulario = () => {
    setNombre("");
    setDescripcion("");
    setFecha(null);
    setHora("");
    setFile(null);
    setPreviewUrl("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current.classList.remove("dragover");
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current.classList.add("dragover");
  };

  const handleDragLeave = () => {
    dropRef.current.classList.remove("dragover");
  };

  const handleSubmit = () => {
    if (!nombre || !fecha || !hora) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor completa el título, la fecha y la hora del evento.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const fecha_hora_evento = new Date(`${fecha}T${hora}:00`);
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("descripcion", descripcion);
    formData.append("fecha_hora_evento", fecha_hora_evento.toISOString());
    if (file) formData.append("file", file);
    if (eventoInicial && !file && !previewUrl) {
      formData.append("url_imagen_evento", "");
    }

    onSubmit(formData);
    resetFormulario();
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-evento-wide">
        <div className="modal-left">
          <h3>Selecciona la Fecha</h3>
          <CalendarioReserva onSelectFecha={(f) => setFecha(f)} espacioId={0} />
        </div>

        <div className="modal-right">
          <h2>{eventoInicial ? "Editar Evento" : "Crear Evento"}</h2>

          <input
            type="text"
            placeholder="Título del Evento"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <textarea
            className="descripcion-input"
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <label>Hora:</label>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />

          <label>Imagen del evento:</label>
          <div
            ref={dropRef}
            className="drop-area"
            onClick={() => document.getElementById("fileInput").click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {previewUrl ? (
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <button
                  type="button"
                  className="remove-image-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreviewUrl("");
                  }}
                >
                  ✖
                </button>
              </div>
            ) : (
              <p className="preview-placeholder">
                Arrastra una imagen o haz clic aquí
              </p>
            )}

            <input
              id="fileInput"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          <div className="modal-botones">
            <button
              onClick={() => {
                handleSubmit();
              }}
            >
              {eventoInicial ? "Guardar Cambios" : "Crear Evento"}
            </button>
            <button
              className="btn-cancelar"
              onClick={() => {
                resetFormulario();
                onClose();
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
