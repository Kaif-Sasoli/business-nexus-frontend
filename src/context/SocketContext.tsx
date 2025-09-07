// SocketContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import { CallState } from '../types/index'

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  callState: CallState | null;
  setCallState: React.Dispatch<React.SetStateAction<CallState | null>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Call state lives here globally
  const [callState, setCallState] = useState<CallState | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const newSocket = io(import.meta.env.VITE_BASE_URL, {
        withCredentials: true,
        transports: ["websocket"],
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        setIsConnected(true);
        newSocket.emit("register", user.id);
        console.log("🟢 Socket connected:", newSocket.id);
      });

      // Incoming call handler
      newSocket.on("call:incoming", ({ fromUserId, callType }) => {
        setCallState({
          open: true,
          caller: false,
          type: callType,
          fromUserId,
          toUserId: user.id,
        });
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
        console.log("🔴 Socket disconnected");
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [isAuthenticated, user?.id]);

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, callState, setCallState }}
      >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};
