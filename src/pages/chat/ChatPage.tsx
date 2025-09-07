import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Phone, Video, Info, Smile } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { useAuth } from '../../context/AuthContext';
import { ChatConversation } from '../../types';
// import { Message } from '../../types';
// import { findUserById } from '../../data/users';
// import { getMessagesBetweenUsers, sendMessage, getConversationsForUser } from '../../data/messages';
// import { getUserById } from '../../api/user'
import { ChatPartner } from '../../types';
import { getMessagesBetweenUsers, sendMessage, getConversations, Message } from "../../api/message";
import { MessageCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { CallModal } from '../../components/call/CallModal';


export const ChatPage: React.FC = () => {

  const { socket } = useSocket();

  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  const [chatPartner, setChatPartner] = useState<ChatPartner>();
  const [callState, setCallState] = useState<{
  open: boolean;
  caller: boolean;
  type: "video" | "audio";
} | null>(null);
const [incomingFrom, setIncomingFrom] = useState<string | null>(null);


    useEffect(() => {
      if (!socket) return;
    
      socket.on("call:incoming", ({ fromUserId, callType }) => {
        setCallState({
          open: true,
          caller: false,
          type: callType,
        });
        setIncomingFrom(fromUserId);
      });
    
      return () => {
        socket.off("call:incoming");
      };
    }, [socket]);

    useEffect(() => {
  if (!socket) return;

  // When you receive a message from the other user
  socket.on("receiveMessage", (message) => {
    setMessages((prev) => [...prev, message]);
  });

  // When your message is confirmed as sent by the server
  socket.on("messageSent", (message) => {
    setMessages((prev) => {
      
      if (prev.find((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  });

  return () => {
    socket.off("receiveMessage");
    socket.off("messageSent");
  };
}, [socket]);



   // Load conversations from backend
  useEffect(() => {
    if (currentUser) {
      getConversations().then((data) => {
        setConversations(data?.conversations)
      }).catch(console.error);
    }
  }, [currentUser]);
  
   // Load messages with selected partner
  useEffect(() => {
    if (currentUser && userId) {
      getMessagesBetweenUsers(userId)
        .then((data) =>{ 
          setChatPartner(data?.partner)
          setMessages(data?.messages)
        })
        .catch(console.error);
    }
  }, [currentUser, userId]);
  
  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userId) return;

    try {
      const message = await sendMessage(userId, newMessage);

      // Optimistic update
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };
  
  if (!currentUser) return null;
  
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      <CallModal
        isOpen={callState?.open || false}
        onClose={() => {
          setCallState(null);
          setIncomingFrom(null);
        }}
        isCaller={callState?.caller || false}
        callType={callState?.type || "video"}
        toUserId={userId || ""}
        fromUserId={incomingFrom || undefined}
      />
      
      {/* Conversations sidebar */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        <ChatUserList conversations={conversations} />
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        {chatPartner ? (
          <>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar
                  src={chatPartner.avatarUrl}
                  alt={chatPartner.name}
                  size="md"
                  status={chatPartner.isOnline ? 'online' : 'offline'}
                  className="mr-3"
                />
                
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{chatPartner.name}</h2>
                  <p className="text-sm text-gray-500">
                    {chatPartner.isOnline ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Voice call"
                  onClick={() => {
                    setCallState({ open: true, caller: true, type: "audio" });
                    socket?.emit("call:invite", {
                      fromUserId: currentUser?.id,
                      toUserId: userId,
                      callType: "audio",
                    });
                  }}
                >
                  <Phone size={18} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Video call"
                  onClick={() => {
                    setCallState({ open: true, caller: true, type: "video" });
                    socket?.emit("call:invite", {
                      fromUserId: currentUser?.id,
                      toUserId: userId,
                      callType: "video",
                    });
                  }}
                >
                  <Video size={18} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Info"
                >
                  <Info size={18} />
                </Button>
              </div>
            </div>
            
            {/* Messages container */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.length >= 0 ? (
                <div className="space-y-4">
                 {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isCurrentUser={message.senderId === currentUser.id}
                  />
                ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <MessageCircle size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
                  <p className="text-gray-500 mt-1">Send a message to start the conversation</p>
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Add emoji"
                >
                  <Smile size={20} />
                </Button>
                
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  fullWidth
                  className="flex-1"
                />
                
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim()}
                  className="rounded-full p-2 w-10 h-10 flex items-center justify-center"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <MessageCircle size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-700">Select a conversation</h2>
            <p className="text-gray-500 mt-2 text-center">
              Choose a contact from the list to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};