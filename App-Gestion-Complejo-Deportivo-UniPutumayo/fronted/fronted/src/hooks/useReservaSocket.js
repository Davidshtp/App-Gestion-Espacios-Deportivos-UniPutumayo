// src/hooks/useReservaSocket.js
import { useEffect } from "react";
import socket from "../config/socket";

export default function useReservaSocket() {
  useEffect(() => {
    const handler = () => {
      const evento = new CustomEvent("novedad-reservas");
      window.dispatchEvent(evento);
    };

    socket.on("novedad-reserva", handler);

    return () => {
      socket.off("novedad-reserva", handler);
    };
  }, []);
}
