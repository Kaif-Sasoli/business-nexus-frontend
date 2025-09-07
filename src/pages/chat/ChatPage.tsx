import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Phone, Video, Info, Smile } from 'lucide-react';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { useAuth } from '../../context/AuthContext';
import { ChatConversation } from '../../types';
import { ChatPartner } from '../../types';
import { getMessagesBetweenUsers, sendMessage, getConversations } from "../../api/message";
import { Message } from '../../types/index'
import { MessageCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { CallModal } from '../../components/call/CallModal';


export const ChatPage: React.FC = () => {

  const { socket, setCallState } = useSocket();

  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  const [chatPartner, setChatPartner] = useState<ChatPartner>();

    useEffect(() => {
  if (!socket) return;

  // When you receive a message from the other user
  socket.on("receiveMessage", (message) => {
    setMessages((prev) => [...prev, message]);
      if (chatPartner) {
     updateConversationList(message, chatPartner); 
  }
  });

    // When your message is confirmed as sent by the server
     socket.on("messageSent", (message) => {
      if (message.senderId === currentUser?.id) return; 
      setMessages((prev) => [...prev, message]);
      if (chatPartner) {
      updateConversationList(message, chatPartner); 
    }
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
        if (chatPartner) {
         updateConversationList(message, chatPartner); 
       }
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

    const updateConversationList = (message: Message, partner: ChatPartner) => {
     setConversations((prev) => {
      // Check if conversation exists
      const existing = prev.find((c) => c.partner.id === partner.id);
      
      if (existing) {
        // Update lastMessage + unreadCount
        const updated = {
          ...existing,
          lastMessage: message,
          updatedAt: message.createdAt,
          unreadCount:
            message.senderId !== currentUser?.id
              ? existing.unreadCount + 1
              : existing.unreadCount,
        };
      
        // Move to top
        return [updated, ...prev.filter((c) => c.id !== existing.id)];
      } else {
        // New conversation
        const newConv: ChatConversation = {
          id: `${currentUser?.id}-${partner.id}`,
          participants: [currentUser?.id || "", partner.id],
          partner,
          lastMessage: message,
          updatedAt: message.createdAt,
          unreadCount: message.senderId !== currentUser?.id ? 1 : 0,
        };
        return [newConv, ...prev];
      }
    });
  };
  
  if (!currentUser) return null;
  
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      
      {/* Conversations sidebar */}
      <div className="hidden md:block w-1/3 lg:w-64 border-r border-gray-200">
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
                    setCallState({ open: true, caller: true, type: "audio", toUserId: userId ||
                       "", fromUserId: currentUser?.id 
                      });
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
                    setCallState({ open: true, caller: true, type: "video", toUserId: userId || 
                      "", fromUserId: currentUser?.id });
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
                
                 <div className="relative">
                   <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     className="rounded-full p-2"
                     aria-label="Add emoji"
                     onClick={() => setShowEmojiPicker((prev) => !prev)}
                   >
                     <Smile size={20} />
                   </Button>
                         

                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-50  h-72
                     overflow-hidden rounded-lg shadow-lg bg-white">
                      <Picker
                        data={data}
                        onEmojiSelect={(emoji: any) =>
                          setNewMessage((prev) => prev + emoji.native)
                        }
                        theme="light" // optional
                        previewPosition="none" 
                      />
                    </div>
                  )}
                 </div>

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