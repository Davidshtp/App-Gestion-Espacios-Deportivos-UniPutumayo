import api from "../../config/axiosConfig";

// Obtener reservas del día para un espacio
export const getReservasPorDia = async (fecha, espacioId) => {
  try {
    const response = await api.get("/reservas/reservas-por-dia", {
      params: { fecha, espacioId },
    });
    return response.data;
  } catch (err) {
    console.error("Error al obtener reservas del día:", err);
    throw err;
  }
};

// Crear reserva (usa fecha_hora completa como string ISO)
export const crearReserva = async ({ fecha_hora, espacio_id, deporte_id,evento_id }) => {
  try {
    const response = await api.post("/reservas/crear-reserva", {
      fecha_hora,
      espacio_id,
      deporte_id,
      evento_id,
    });
    return response.data;
  } catch (err) {
    console.error("Error al crear reserva:", err);
    throw err;
  }
};


// Cancelar reserva 
export const cancelarReserva = async ({ fecha_hora, espacio_id }) => {
  try {
    const response = await api.post("/reservas/cancelar", {
      fecha_hora,
      espacio_id,
    });
    return response.data;
  } catch (err) {
    console.error("Error al cancelar reserva:", err);
    throw err;
  }
};

// Marcar reserva como "en uso" (solo admin)
export const marcarReservaEnUso = async ({ fecha_hora, espacio_id }) => {
  try {
    const response = await api.post("/reservas/marcar-en-uso", {
      fecha_hora,
      espacio_id,
    });
    return response.data;
  } catch (error) {
    console.error("Error al marcar la reserva en uso:", error);
    throw error;
  }
};

// Liberar una reserva en uso (la cancela y la convierte en uso libre)
export const liberarReservaEnUso = async (fecha_hora, espacio_id) => {
  try {
    const response = await api.post("/reservas/liberar", {
      fecha_hora,
      espacio_id,
    });
    return response.data;
  } catch (error) {
    console.error("Error al liberar reserva en uso:", error);
    throw error;
  }
};


