// src/axiosConfig.js
import axios from "axios";
import { logout } from "../Services/auth/authService";

const api = axios.create({
  baseURL: "http://localhost:5560",
  withCredentials: true, 
});
api.interceptors.response.use(
  res => res,
  async error => {
    const reqUrl = error?.config?.url;

    // 🔒 Solo redirige si el error 401 viene de /auth/me
    if (error.response?.status === 401 && reqUrl.includes("/auth/me")) {
      await logout();
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);


export default api;
