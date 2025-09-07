import { apiClient } from "../api/index";
import { GetMessagesResponse, ChatConversation, Message } from '../types/index'

// -------- Message Types -----------------
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

// ----------------- API Functions -----------------

//  Get all conversations
export const getConversations = async (): Promise<ChatConversation[]> => {
  const res = await apiClient.get<ChatConversation[]>("/messages/conversations");
  return res.data;
};

// Get messages with a specific user
export const getMessagesBetweenUsers = async (
  partnerId: string
): Promise<GetMessagesResponse> => {
  const { data } = await apiClient.get<GetMessagesResponse>(
    `/messages/${partnerId}`
  );
  return data;
};

// Send a new message
export const sendMessage = async (
  receiverId: string,
  content: string
): Promise<Message> => {
  const res = await apiClient.post<{ success: boolean; message: Message }>(
    "/messages/send",
    { receiverId, content }
  );
  console.log("Resonpinse in Messge.ts", res)
  return res.data.message
};
