// src/Services/auth.js
import api from "../../config/axiosConfig";

// ✅ Verifica si el usuario está autenticado
export const isAuthenticated = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.status === 200;
  } catch (error) {
    if (error.response?.status === 401) await logout();
    console.error("Error comprobando autenticación:", error);
    return false;
  }
};

// ✅ Obtiene los datos del usuario autenticado
export const getUserData = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) await logout();
    console.error("Error obteniendo datos del usuario:", error);
    return null;
  }
};

// ✅ Cierra sesión eliminando la cookie
export const logout = async () => {
  try {
    const response = await api.post("/auth/logout");
    return response.status === 200;
  } catch (error) {
    console.error("Error cerrando sesión:", error);
    return false;
  }
};

// ✅ Registra un nuevo usuario
export const register = async (data) => {
  try {
    const response = await api.post("/auth/register", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Inicia sesión con identificación y contraseña
export const login = async (identificacion, contrasena) => {
  try {
    const response = await api.post("/auth/login", {
      identificacion,
      contrasena,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Inicia sesión con Google
export const loginWithGoogle = async (credential) => {
  try {
    const response = await api.post("/auth/google-login", { credential });
    return response.data;
  } catch (error) {
    throw error;
  }
};
