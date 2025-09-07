import React, { useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import { Phone, XCircle, Maximize2, Minimize2, Video } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCaller: boolean;
  callType: "video" | "audio";
  toUserId: string;
  fromUserId?: string;
}

Modal.setAppElement("#root");

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  isCaller,
  callType,
  toUserId,
  fromUserId,
}) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [currentCallType, setCurrentCallType] = useState(callType);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [isRinging, setIsRinging] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const targetId = isCaller ? toUserId : fromUserId;
  

  /** Create Peer Connection */
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (e) => setRemoteStream(e.streams[0]);
    pc.onicecandidate = (e) => {
      if (e.candidate && targetId) {
        socket?.emit("webrtc:ice", {
          toUserId: targetId,
          fromUserId: user?.id,
          candidate: e.candidate,
        });
      }
    };

    return pc;
  };

  /** Start Call */
  const startCall = async (initiator: boolean) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: currentCallType === "video",
    });
    setLocalStream(stream);

    const pc = createPeerConnection();
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit("webrtc:offer", {
        toUserId: targetId,
        fromUserId: user?.id,
        sdp: offer,
      });
    }
  };

  /** Toggle Video During Call */
  const toggleVideo = async () => {
    if (!pcRef.current || !localStream) return;

    if (currentCallType === "audio") {
      const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = vStream.getVideoTracks()[0];

      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(videoTrack);
      else pcRef.current.addTrack(videoTrack, vStream);

      setLocalStream(new MediaStream([...localStream.getTracks(), videoTrack]));
      setCurrentCallType("video");
    } else {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((t) => {
        t.stop();
        const sender = pcRef.current?.getSenders().find((s) => s.track === t);
        if (sender) pcRef.current?.removeTrack(sender);
      });

      setLocalStream(new MediaStream(localStream.getAudioTracks()));
      setCurrentCallType("audio");
    }

    // Re-offer after track change
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socket?.emit("webrtc:offer", { toUserId: targetId, fromUserId: user?.id, sdp: offer });
  };

  /** Accept / Decline */
  const handleAccept = async () => {
    setCallAccepted(true);
    stopRingtone();
    socket?.emit("call:accept", { fromUserId: user?.id, toUserId: fromUserId });

    if (incomingOffer && fromUserId) {
      await handleRemoteOffer(incomingOffer, fromUserId);
      setIncomingOffer(null);
    } else {
      await startCall(false);
    }
  };

  const handleDecline = () => {
    stopRingtone();
    socket?.emit("call:decline", { fromUserId: user?.id, toUserId: fromUserId });
    endCall();
  };

  /** Unified End Call */
 const endCall = () => {
  stopRingtone();

  // Stop local tracks
  localStream?.getTracks().forEach((t) => t.stop());
  setLocalStream(null);

  // Stop remote tracks
  remoteStream?.getTracks().forEach((t) => t.stop());
  setRemoteStream(null);

  // Remove srcObject from any video elements
  const videos = document.querySelectorAll('video');
  videos.forEach((v) => {
    (v as HTMLVideoElement).srcObject = null;
  });

  // Close peer connection
  pcRef.current?.close();
  pcRef.current = null;

  // Reset state
  setCallAccepted(false);
  setCurrentCallType(callType);
  setIncomingOffer(null);

  // Notify server
  if (socket && targetId) socket.emit("call:end", { fromUserId: user?.id, toUserId: targetId });

  // Close modal
  onClose();
};

  const handleRemoteOffer = async (sdp: RTCSessionDescriptionInit, fromId: string) => {
    if (!pcRef.current) await startCall(false);
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);
    socket.emit("webrtc:answer", { toUserId: fromId, fromUserId: user?.id, sdp: answer });
  };

  /** Ringtone */
  const playRingtone = () => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio("/ringtone.mp3");
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(() => {});
    }
    setIsRinging(true);
  };
  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    setIsRinging(false);
  };

  /** Socket Events */
  useEffect(() => {
    if (!socket || !isOpen) return;

    if (isCaller) startCall(true);

    socket.on("call:accepted", () => {
      setCallAccepted(true);
      stopRingtone();
    });

    socket.on("webrtc:offer", async ({ fromUserId, sdp }) => {
      if (!callAccepted) {
        setIncomingOffer(sdp);
        playRingtone();
        return;
      }
      await handleRemoteOffer(sdp, fromUserId);
    });

    socket.on("webrtc:answer", async ({ sdp }) => {
      if (pcRef.current) await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("webrtc:ice", ({ candidate }) => pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)));

    socket.on("call:declined", () => {
      toast.error("Call declined");
      endCall();
    });

    socket.on("call:ended", () => {
      toast.error("Call ended");
      endCall();
    });

    return () => {
      socket.off("call:accepted");
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice");
      socket.off("call:declined");
      socket.off("call:ended");
    };
  }, [socket, isOpen, callAccepted]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={endCall}
      style={{
        content: {
          top: isFullscreen ? "0" : "50%",
          left: isFullscreen ? "0" : "50%",
          transform: isFullscreen ? "none" : "translate(-50%, -50%)",
          width: isFullscreen ? "100%" : "400px",
          height: isFullscreen ? "100%" : "550px",
          background: "#1c1c1c",
          padding: 0,
          borderRadius: isFullscreen ? 0 : 16,
          overflow: "hidden",
        },
        overlay: { background: "rgba(0,0,0,0.7)", zIndex: 1000 },
      }}
    >
      <div style={{ 
        position: 
        "relative", 
        width: "100%", 
        height: "100%", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center" 
        }}>
        {currentCallType === "video" && callAccepted ? (
          <>
            {callAccepted && currentCallType === "video" && remoteStream && (
              <video 
                autoPlay 
                playsInline 
                ref={(el) => el && (el.srcObject = remoteStream)} 
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  background: "#000", 
                  objectFit: "cover" 
                }} 
              />
            )}
            
            {/* Local preview only for video */}
            {localStream && callAccepted && currentCallType === "video" && (
              <video 
                autoPlay 
                playsInline 
                muted 
                ref={(el) => el && (el.srcObject = localStream)} 
                style={{ 
                  position: 
                  "absolute", 
                  bottom: 20, 
                  right: 20, 
                  width: 140, 
                  borderRadius: 12, 
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)" 
                }} 
              />
            )}
          </>
        ) : (
          <h2 style={{ 
            color: "#fff", 
            fontSize: "22px" 
          }}>
            {isCaller ? "Calling..." : "Incoming Call"}
          </h2>
        )}

        <div 
        style={{ 
          position: "absolute", 
          bottom: 30, left: "50%", 
          transform: "translateX(-50%)", 
          display: "flex", gap: "18px", 
          justifyContent: "center" 
          }}>
          {!callAccepted && !isCaller ? (
            <>
              <button 
              style={callButtonStyle("#25D366")} 
              onClick={handleAccept}>
                <Phone size={28} 
              color="#fff" />
              </button>
              <button 
              style={callButtonStyle("#FF3B30")} 
              onClick={handleDecline}>
                <XCircle 
              size={28} color="#fff" /></button>
            </>
          ) : (
            <>
              <button 
              style={callButtonStyle("#FF3B30", 80)} 
              onClick={endCall}>
                <XCircle size={28} 
              color="#fff" />
              </button>
              <button 
              style={callButtonStyle("#007AFF")} 
              onClick={toggleVideo}>{currentCallType === "audio" ? 
              <Video size={28} 
              color="#fff" /> : <Phone size={28} color="#fff" />}</button>
            </>
          )}
        </div>

        <button onClick={() => setIsFullscreen((s) => !s)} 
        style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.5)", borderRadius: 10, padding: 8 }}>
          {isFullscreen ? <Minimize2 color="#fff" size={20} /> : <Maximize2 color="#fff" size={20} />}
        </button>
      </div>
    </Modal>
  );
};

const callButtonStyle = (bg: string, size = 70): React.CSSProperties => ({
  background: bg,
  borderRadius: "50%",
  width: size,
  height: size,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
  transition: "transform 0.2s ease-in-out",
  cursor: "pointer",
});

export default CallModal;
