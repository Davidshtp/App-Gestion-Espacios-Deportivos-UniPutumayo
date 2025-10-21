// src/hooks/useEventoSocket.js
import { useEffect } from "react";
import socket from "../config/socket";

export default function useEventoSocket() {
  useEffect(() => {
    const handler = () => {
      const evento = new CustomEvent("novedad-evento");
      window.dispatchEvent(evento);
    };

    socket.on("novedad-evento", handler);

    return () => {
      socket.off("novedad-evento", handler);
    };
  }, []);
}
