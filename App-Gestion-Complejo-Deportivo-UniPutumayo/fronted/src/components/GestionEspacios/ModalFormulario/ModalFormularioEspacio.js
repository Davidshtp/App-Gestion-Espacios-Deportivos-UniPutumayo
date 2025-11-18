import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import "./ModalFormularioEspacio.css";
import { obtenerTodosLosDeportes } from "../../../Services/deportes/deportesService";

export default function ModalFormularioEspacio({
  visible,
  onClose,
  onSubmit,
  espacioInicial,
}) {
  const [espacio, setEspacio] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [deportesDisponibles, setDeportesDisponibles] = useState([]);
  const [deportesSeleccionados, setDeportesSeleccionados] = useState([]);
  const dropRef = useRef();

  // 🔹 Cargar todos los deportes disponibles
  useEffect(() => {
    const cargarDeportes = async () => {
      try {
        const data = await obtenerTodosLosDeportes();
        const options = data.map((d) => ({
          value: d.id_deporte,
          label: d.nombre,
        }));
        setDeportesDisponibles(options);
      } catch (err) {
        console.error("Error al cargar los deportes:", err);
        Swal.fire("Error", "No se pudieron cargar los deportes.", "error");
      }
    };
    cargarDeportes();
  }, []);

  // 🔹 Inicializar formulario al abrir (edición o creación)
  useEffect(() => {
    if (espacioInicial) {
      setEspacio(espacioInicial.espacio || "");
      setPreviewUrl(espacioInicial.imagen_url || "");
      setFile(null);

      // Si el backend trae deportes como [{ id_deporte, nombre }]
      if (espacioInicial.deportes && espacioInicial.deportes.length > 0) {
        const seleccionados = espacioInicial.deportes.map((d) => ({
          value: d.id_deporte,
          label: d.nombre || "Sin nombre",
        }));
        setDeportesSeleccionados(seleccionados);
      } else {
        setDeportesSeleccionados([]);
      }
    } else {
      // Si es un nuevo espacio
      setEspacio("");
      setFile(null);
      setPreviewUrl("");
      setDeportesSeleccionados([]);
    }
  }, [espacioInicial]);

  // 🔹 Manejar archivo e imagen
  const handleFile = (selected) => {
    if (!selected) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(selected.type)) {
      Swal.fire(
        "Tipo no permitido",
        "Solo se permiten PNG, JPG, WEBP o SVG.",
        "warning",
      );
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      Swal.fire(
        "Archivo muy grande",
        "El tamaño máximo permitido es de 2 MB.",
        "error",
      );
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(selected);
  };

  // 🔹 Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current.classList.remove("dragover");
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current.classList.add("dragover");
  };

  const handleDragLeave = () => {
    dropRef.current.classList.remove("dragover");
  };

  // 🔹 Validar y enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!espacio.trim()) {
      Swal.fire(
        "Campo obligatorio",
        "El nombre del espacio es obligatorio.",
        "warning",
      );
      return;
    }

    if (!espacioInicial && !file) {
      Swal.fire(
        "Campo obligatorio",
        "Debe subir una imagen para crear el espacio.",
        "warning",
      );
      return;
    }

    if (!deportesSeleccionados.length) {
      Swal.fire(
        "Campo obligatorio",
        "Debe seleccionar al menos un deporte.",
        "warning",
      );
      return;
    }

    const formData = new FormData();
    formData.append("espacio", espacio);
    if (file) formData.append("file", file);

    const idsDeportes = deportesSeleccionados.map((d) => d.value);
    formData.append("deportes", JSON.stringify(idsDeportes));

    onSubmit(formData);
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>{espacioInicial ? "Editar Espacio" : "Crear Nuevo Espacio"}</h2>

        <form className="modal-form" onSubmit={handleSubmit}>
          {/* 🔸 Nombre del espacio */}
          <div className="form-group">
            <label>Nombre del espacio</label>
            <input
              type="text"
              value={espacio}
              onChange={(e) => setEspacio(e.target.value)}
              placeholder="Ej: Cancha Sintética"
            />
          </div>

          {/* 🔸 Imagen */}
          <div className="form-group">
            <label>
              Imagen{" "}
              {espacioInicial ? (
                "(opcional)"
              ) : (
                <span className="obligatoria">(obligatoria)</span>
              )}
            </label>

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
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="preview-image"
                  />
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
          </div>

          {/* 🔸 Selector de deportes */}
          <div className="form-group">
            <label>Deportes asociados</label>
            <Select
              isMulti
              options={deportesDisponibles}
              value={deportesSeleccionados}
              onChange={setDeportesSeleccionados}
              placeholder="Selecciona uno o más deportes"
              className="select-deportes"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "8px",
                  borderColor: "#ccc",
                  minHeight: "42px",
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "#007bff20",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "#007bff",
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: "#007bff",
                  ":hover": { backgroundColor: "#007bff", color: "white" },
                }),
              }}
            />
          </div>

          {/* 🔸 Botones */}
          <div className="modal-actions">
            <button type="submit" className="btn-submit">
              {espacioInicial ? "Actualizar" : "Crear"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setEspacio("");
                setFile(null);
                setPreviewUrl("");
                setDeportesSeleccionados([]);
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
