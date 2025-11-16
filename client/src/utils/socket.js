
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.BACKEND_BASE_URL || "https://gd-web-rose.vercel.app/";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false, // Don't connect immediately
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

export default socket;