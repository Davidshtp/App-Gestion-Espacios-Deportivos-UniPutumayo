// src/Services/eventos/eventosService.js
import api from "../../config/axiosConfig";

export const obtenerTodosLosEventosParaAdmin = async () => {
  try {
    const response = await api.get("/eventos/admin");
    return response.data;
  } catch (err) {
    console.error("Error al obtener todos los eventos para el admin:", err);
    throw err;
  }
};

export const crearEvento = async (datosEvento) => {
  try {
    const response = await api.post("/eventos", datosEvento); // Endpoint POST /eventos
    return response.data;
  } catch (err) {
    console.error("Error al crear el evento:", err);
    throw err;
  }
};

export const actualizarEvento = async (idEvento, datosEvento) => {
  try {
    const response = await api.put(`/eventos/${idEvento}`, datosEvento);
    return response.data;
  } catch (err) {
    console.error(`Error al actualizar el evento con ID ${idEvento}:`, err);
    throw err;
  }
};

export const eliminarEvento = async (idEvento) => {
  try {
    const response = await api.patch(`/eventos/${idEvento}/eliminar`);
    return response.data;
  } catch (err) {
    console.error(`Error al eliminar el evento con ID ${idEvento}:`, err);
    throw err;
  }
};


export const obtenerEventosPublicos = async () => {
  try {
    const response = await api.get("/eventos"); // Endpoint GET /eventos
    return response.data;
  } catch (err) {
    console.error("Error al obtener los eventos públicos:", err);
    throw err;
  }
};

export const obtenerEventosActivos =async ()=>{
  try{
    const response=await api.get('/eventos/count-activos')
    return response.data;
  }catch(err){
    console.error('Error al obtener el numero de eventos activos',err);
    throw err;
  }
  
}
