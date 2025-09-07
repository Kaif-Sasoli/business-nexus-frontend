import { apiClient } from "../api/index";
import { GetMessagesResponse, ChatConversation, Message } from '../types/index'

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
  const res = await apiClient.post<{ success: boolean; message: Message }>("/messages/send", { receiverId, content }
  );
  return res.data.message
};
