import api from "../../config/axiosConfig";

// Obtener todas las configuraciones
export const obtenerConfiguraciones = async () => {
  try {
    const response = await api.get("/config");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Actualizar una configuración (solo admin)
export const actualizarConfiguracion = async (clave, valor, descripcion) => {
  try {
    const response = await api.patch("/config", {
      clave,
      valor,
      descripcion,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
