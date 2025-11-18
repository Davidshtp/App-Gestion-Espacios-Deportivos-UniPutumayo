import api from "../../config/axiosConfig";

export const obtenerTodosLosDeportes = async () => {
  try {
    const response = await api.get("/deportes/obtener-deportes");
    return response.data;
  } catch (err) {
    console.error("Error al obtener los deportes:", err);
    throw err;
  }
};

export const crearDeporte = async (deporte) => {
  try {
    const response = await api.post("/deportes/crear", deporte);
    return response.data;
  } catch (err) {
    console.error("Error al crear el deporte:", err);
    throw err;
  }
};

export const actualizarDeporte = async (id, deporte) => {
  try {
    const response = await api.put(`/deportes/editar/${id}`, deporte);
    return response.data;
  } catch (err) {
    console.error(`Error al actualizar el deporte con ID ${id}:`, err);
    throw err;
  }
};

export const eliminarDeporte = async (id) => {
  try {
    const response = await api.delete(`/deportes/eliminar/${id}`);
    return response.data;
  } catch (err) {
    console.error(`Error al eliminar el deporte con ID ${id}:`, err);
    throw err;
  }
};
