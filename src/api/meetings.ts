import { apiClient } from "../api/index";

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  status: "pending" | "accepted" | "rejected";
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
  roomId?: string | null;
  roomUrl?: string | null;
  organizer: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  participants: Participant[];
}


// Fetch all meetings for the user
export const getMeetings = async (): Promise<Meeting[]> => {
    
  const res = await apiClient.get<{ message: string; meetings: Meeting[] }>(
    "/meetings/get-meetings"
  );
  return res.data.meetings;
};

//  Create a new meeting
export const createMeeting = async (meetingData: {
  participants: string[];
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
}): Promise<Meeting> => {
  console.log("meetingData: ", meetingData);
  const res = await apiClient.post<Meeting>("/meetings/create", meetingData);
  return res.data;
};

// Invertor Accept the meeting
export const acceptMeetingAPI = async (meetingId: string): Promise<{ message: string }> => {
  const res = await apiClient.put<{ message: string }>(`/meetings/accept/${meetingId}`);
  console.log("Why reject: ", res)
  return res.data;
};

// Investor Reject the meeting
export const rejectMeetingAPI = async (meetingId: string): Promise<{ message: string }> => {
    console.log("UserId:", meetingId)
  const res = await apiClient.put<{ message: string }>(`/meetings/reject/${meetingId}`);
  return res.data;
};


// Organizer Cancel Meeting
export const cancelMeetingAPI = async (meetingId: string): Promise<{ message: string }> => {
  const res = await apiClient.put<{ message: string }>(`/meetings/cancel/${meetingId}`);
  return res.data;
};


// Organizer Start Meeting
export const startMeetingAPI = async (meetingId: string): Promise<{ message: string }> => {
  const res = await apiClient.put<{ message: string }>(`/meetings/start/${meetingId}`);
  return res.data;
};


// Organizer or system marks meeting completed
export const endMeetingAPI = async (
  meetingId: string
): Promise<{ message: string; meeting: Meeting }> => {
  const res = await apiClient.put<{ message: string; meeting: Meeting }>(
    `/meetings/end/${meetingId}`
  );
  return res.data;
};