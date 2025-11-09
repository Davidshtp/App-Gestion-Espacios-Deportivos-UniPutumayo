// src/services/espaciosService.js
import api from "../../config/axiosConfig";

// Obtener los deportes asociados a un espacio específico
export const obtenerDeportesDeEspacio = async (idEspacio) => {
  try {
    const response = await api.get(`/espacio/${idEspacio}/deportes`);
    return response.data;
  } catch (err) {
    console.error(
      `Error al obtener los deportes del espacio con ID ${idEspacio}:`,
      err,
    );
    throw err;
  }
};

export const obtenerTodosLosEspacios = async () => {
  try {
    const response = await api.get("/espacio");
    return response.data;
  } catch (err) {
    console.error("Error al obtener todos los espacios:", err);
    throw err;
  }
};

export const crearEspacio = async (formData) => {
  try {
    const response = await api.post("/espacio", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (err) {
    console.error("Error al crear el espacio:", err);
    throw err;
  }
};

export const actualizarEspacio = async (idEspacio, formData) => {
  try {
    const response = await api.put(`/espacio/${idEspacio}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (err) {
    console.error(`Error al actualizar el espacio con ID ${idEspacio}:`, err);
    throw err;
  }
};

export const eliminarEspacio = async (idEspacio) => {
  try {
    const response = await api.delete(`/espacio/${idEspacio}`);
    return response.data;
  } catch (err) {
    console.error(`Error al eliminar el espacio con ID ${idEspacio}:`, err);
    throw err;
  }
};

export const obtenerEspacioPorId = async (idEspacio) => {
  try {
    const response = await api.get(`/espacio/${idEspacio}`);
    return response.data;
  } catch (err) {
    console.error(`Error al obtener el espacio con ID ${idEspacio}:`, err);
    throw err;
  }
};
