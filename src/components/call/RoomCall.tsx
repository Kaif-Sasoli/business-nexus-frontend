// src/components/call/RoomCallModal.tsx
import React, { useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import { XCircle, Maximize2, Minimize2 } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { endMeetingAPI } from "../../api/meetings";

Modal.setAppElement("#root");

interface RoomCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  meetingId: string; 
}

interface RemoteStream {
  socketId: string;
  stream: MediaStream;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const RoomCallModal: React.FC<RoomCallModalProps> = ({
  isOpen,
  onClose,
  roomId,
  meetingId,
}) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const peersRef = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const remoteStreamsRef = useRef<RemoteStream[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Unified cleanup + backend call */
  const endRoomCall = async () => {
    // Close peers
    Object.keys(peersRef.current).forEach((id) => {
      try {
        peersRef.current[id].close();
      } catch {}
      delete peersRef.current[id];
    });

    // Stop local media
    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    localStreamRef.current = null;

    // Reset streams
    remoteStreamsRef.current = [];
    setRemoteStreams([]);

    // Call backend to mark meeting completed
    try {
      if (meetingId) {
        await endMeetingAPI(meetingId);
      }
    } catch (err) {
      console.error("Failed to end meeting on server:", err);
    }

    onClose();
  };

  const createPeer = (socketId: string) => {
    if (peersRef.current[socketId]) return peersRef.current[socketId];
    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        socket?.emit("webrtc:ice", {
          roomId,
          fromUserId: user?.id,
          candidate: ev.candidate,
          toSocketId: socketId,
        });
      }
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams && ev.streams[0];
      if (!stream) return;

      const found = remoteStreamsRef.current.find((r) => r.socketId === socketId);
      if (found) {
        remoteStreamsRef.current = remoteStreamsRef.current.map((r) =>
          r.socketId === socketId ? { socketId, stream } : r
        );
      } else {
        remoteStreamsRef.current = [...remoteStreamsRef.current, { socketId, stream }];
      }
      setRemoteStreams([...remoteStreamsRef.current]);
    };

    pc.onconnectionstatechange = () => {
      console.debug(`[pc ${socketId}] state:`, pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        closePeer(socketId);
      }
    };

    peersRef.current[socketId] = pc;
    return pc;
  };

  const closePeer = (socketId: string) => {
    const pc = peersRef.current[socketId];
    if (pc) {
      try {
        pc.close();
      } catch {}
      delete peersRef.current[socketId];
    }
    remoteStreamsRef.current = remoteStreamsRef.current.filter((r) => r.socketId !== socketId);
    setRemoteStreams([...remoteStreamsRef.current]);
  };

  useEffect(() => {
    if (!socket || !user?.id || !isOpen) return;
    let mounted = true;

    const handleRoomUsers = async ({ users }: { users: string[] }) => {
      const localStream = localStreamRef.current;
      if (!localStream || !Array.isArray(users)) return;

      for (const otherSocketId of users) {
        if (peersRef.current[otherSocketId]) continue;
        const pc = createPeer(otherSocketId);

        try {
          const existingSenders = pc.getSenders().map((s) => s.track);
          localStream.getTracks().forEach((track) => {
            if (!existingSenders.includes(track)) pc.addTrack(track, localStream);
          });
        } catch (err) {
          console.warn("Error adding senders before offer:", err);
        }

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc:offer", {
            roomId,
            fromUserId: user.id,
            sdp: pc.localDescription,
            toSocketId: otherSocketId,
          });
        } catch (err) {
          console.error("Failed to create/send offer:", err);
        }
      }
    };

    const handleUserJoined = (payload: any) => {
      console.debug("user joined:", payload?.socketId);
    };

    const handleOffer = async ({ sdp, fromSocketId }: any) => {
      if (!fromSocketId || !sdp) return;
      let pc = peersRef.current[fromSocketId];
      if (!pc) pc = createPeer(fromSocketId);

      const localStream = localStreamRef.current;
      if (localStream) {
        try {
          const existingSenders = pc.getSenders().map((s) => s.track);
          localStream.getTracks().forEach((track) => {
            if (!existingSenders.includes(track)) pc.addTrack(track, localStream);
          });
        } catch (err) {
          console.warn("Error adding local tracks:", err);
        }
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (err) {
        console.warn("setRemoteDescription (offer) failed:", err);
      }

      try {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", {
          roomId,
          fromUserId: user.id,
          sdp: pc.localDescription,
          toSocketId: fromSocketId,
        });
      } catch (err) {
        console.error("Failed to send answer:", err);
      }
    };

    const handleAnswer = async ({ sdp, fromSocketId }: any) => {
      if (!fromSocketId || !sdp) return;
      const pc = peersRef.current[fromSocketId];
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (err) {
        console.warn("setRemoteDescription (answer) failed:", err);
      }
    };

    const handleIce = async ({ candidate, fromSocketId }: any) => {
      if (!candidate || !fromSocketId) return;
      const pc = peersRef.current[fromSocketId];
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Failed to add ICE candidate", err);
      }
    };

    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      closePeer(socketId);
    };

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        socket.off("room:users");
        socket.off("room:user-joined");
        socket.off("webrtc:offer");
        socket.off("webrtc:answer");
        socket.off("webrtc:ice");
        socket.off("room:user-left");

        socket.on("room:users", handleRoomUsers);
        socket.on("room:user-joined", handleUserJoined);
        socket.on("webrtc:offer", handleOffer);
        socket.on("webrtc:answer", handleAnswer);
        socket.on("webrtc:ice", handleIce);
        socket.on("room:user-left", handleUserLeft);

        socket.emit("room:join", { roomId, userId: user.id });
      } catch (err) {
        console.error("Failed to get user media", err);
      }
    };

    init();

    return () => {
      mounted = false;
      try {
        socket.emit("room:leave", { roomId, userId: user.id });
      } catch {}
      socket.off("room:users", handleRoomUsers);
      socket.off("room:user-joined", handleUserJoined);
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice", handleIce);
      socket.off("room:user-left", handleUserLeft);

      Object.keys(peersRef.current).forEach((id) => {
        try {
          peersRef.current[id].close();
        } catch {}
        delete peersRef.current[id];
      });

      try {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      localStreamRef.current = null;
      remoteStreamsRef.current = [];
      setRemoteStreams([]);
    };
  }, [isOpen, socket, user?.id, roomId]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={endRoomCall}
      style={{
        content: {
          top: isFullscreen ? "0" : "50%",
          left: isFullscreen ? "0" : "50%",
          transform: isFullscreen ? "none" : "translate(-50%, -50%)",
          width: isFullscreen ? "100%" : "90%",
          height: isFullscreen ? "100%" : "90%",
          background: "#1c1c1c",
          borderRadius: isFullscreen ? 0 : 16,
          overflow: "hidden",
        },
        overlay: { background: "rgba(0,0,0,0.7)", zIndex: 1000 },
      }}
    >
      <div className="w-full h-full flex flex-col items-center relative">
        {/* Remote videos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 w-full h-full overflow-auto">
          {remoteStreams.map(({ socketId, stream }) => (
            <video
              key={socketId}
              autoPlay
              playsInline
              ref={(el) => {
                if (el && stream) el.srcObject = stream;
              }}
              className="w-full h-48 object-cover rounded-lg bg-black"
            />
          ))}
        </div>

        {/* Local video */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 w-40 rounded-lg shadow-lg border-2 border-white"
        />

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6">
          <button onClick={endRoomCall} className="bg-red-600 p-4 rounded-full shadow-lg">
            <XCircle size={32} color="#fff" />
          </button>
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={() => setIsFullscreen((s) => !s)}
          className="absolute top-4 right-4 bg-black/50 p-2 rounded-lg"
        >
          {isFullscreen ? <Minimize2 color="#fff" size={20} /> : <Maximize2 color="#fff" size={20} />}
        </button>
      </div>
    </Modal>
  );
};

export default RoomCallModal;
