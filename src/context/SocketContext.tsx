// SocketContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Create socket instance
      const newSocket = io(import.meta.env.VITE_BASE_URL, {
        withCredentials: true,
        transports: ["websocket"],
      });

      setSocket(newSocket);

      // Register user when connected
      newSocket.on("connect", () => {
        setIsConnected(true);
        newSocket.emit("register", user.id);
        console.log("🟢 Socket connected:", newSocket.id);
      });

      // Handle offline messages
      newSocket.on("offlineMessages", (messages) => {
        console.log("Received offline messages:", messages);
        toast.success(`You have ${messages.length} new messages`);
        // Here you can store messages in state or redux if you want
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
        console.log("🔴 Socket disconnected");
      });

      //  on logout/unmount
      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [isAuthenticated, user?._id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};
