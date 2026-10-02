import { io } from "socket.io-client";

const socket = io(
  import.meta.env.VITE_API_URL.replace("/api", ""),
  {
    withCredentials: true,
    autoConnect: false,

    auth: (callback) => {
      callback({
        token: localStorage.getItem("token"),
      });
    },
  }
);

export default socket;