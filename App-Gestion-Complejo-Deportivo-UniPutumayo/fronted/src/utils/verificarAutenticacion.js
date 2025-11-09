// src/utils/verificarAutenticacion.js
import api from "../config/axiosConfig";

export async function verificarAutenticacion() {
  try {
    await api.get("/auth/me", { withCredentials: true });
    return true;
  } catch (err) {
    return false;
  }
}
