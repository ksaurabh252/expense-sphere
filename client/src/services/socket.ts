import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let socket: Socket | null = null;

/** One shared connection for the whole app, created on first use. */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(API_URL);
  }
  return socket;
};

/** Ask the server to put this connection into the group's room. */
export const joinGroup = (groupId: string) => {
  getSocket().emit("join-group", groupId);
};
