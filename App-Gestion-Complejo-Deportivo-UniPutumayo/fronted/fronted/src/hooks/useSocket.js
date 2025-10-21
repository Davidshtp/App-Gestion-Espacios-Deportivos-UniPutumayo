// src/hooks/useSocket.js
import { useEffect } from "react";
import socket from "../config/socket";
import { verificarAutenticacion } from "../utils/verificarAutenticacion";

export default function useSocket() {
  useEffect(() => {
    const conectar = async () => {
      const autenticado = await verificarAutenticacion();
      if (!autenticado) {
        console.warn("No autenticado, socket no conectado");
        return;
      }

      if (!socket.connected) {
        socket.connect();
        console.log("Socket conectado ✅");
      }
    };

    conectar();

    return () => {
      if (socket.connected) {
        socket.disconnect();
        console.log("Socket desconectado ❌");
      }
    };
  }, []);
}
