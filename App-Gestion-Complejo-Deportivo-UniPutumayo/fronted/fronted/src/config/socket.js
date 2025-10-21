// src/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5560/", {
  withCredentials: true,
  transports: ["polling", "websocket"],
  autoConnect: false,
});

export default socket;
