import { apiClient } from "./index";
import { 
         RequestResponse,
         Request,
         RequestListResponse,
         GetEntrepreneurRequestsResponse,
       } from "../types/index";


  export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
}

export interface CollaboratorsResponse {
  success: boolean;
  total: number;
  collaborators: Collaborator[];
}

  /* ----------------------------- REQUEST API ----------------------------- */
  // Investor sends request
export const sendRequest = async (
  investorId: string,
  entrepreneurId: string,
  startupId: string,
  message: string
): Promise<RequestResponse> => {
  console.log(investorId, entrepreneurId, startupId, message)
  const { data } = await apiClient.post<RequestResponse>("/request/send", {
    investorId,      
    entrepreneurId,
    startupId,
    message,
  });
  return data;
};

  // Entrepreneur responds (accept/reject)
  export const respondRequest = async (
    requestId: string,
    action: "accepted" | "rejected"
  ): Promise<RequestResponse> => {
    console.log("Responsed Reques:", requestId, action)
    const { data } = await apiClient.put<RequestResponse>(
      `/request/${requestId}/respond`,
      { action }
    );
    return data;
  };

  // Investor withdraws
  export const withdrawRequest = async (
    requestId: string
  ): Promise<RequestResponse> => {
    const { data } = await apiClient.put<RequestResponse>(
      `/request/${requestId}/withdraw`
    );
    return data;
  };

  // Fetch investor’s sent requests
  export const getInvestorRequests = async (
    investorId: string
  ): Promise<RequestListResponse> => {
    const { data } = await apiClient.get<RequestListResponse>(
      `/request/investor/${investorId}`
    );
    return data;
  };


// Check if investor already sent request
export const checkRequestExists = async (
  investorId: string,
  entrepreneurId: string,
  startupId: string
): Promise<{ success: boolean; exists: boolean; status: string; message: string; data?: Request }> => {
  const { data } = await apiClient.get(
    `/request/check`,
    { params: { investorId, entrepreneurId, startupId } }
  );
  return data;
};

// api/requestApi.ts
export const getEntrepreneurRequests = async (
  entrepreneurId: string
): Promise<GetEntrepreneurRequestsResponse> => { 
  const { data } = await apiClient.get<GetEntrepreneurRequestsResponse>(
    `request/entrepreneur/${entrepreneurId}`
  );
  return data;
};

// api/requestApi.ts
export const getCollaborators = async (
  entrepreneurId: string
): Promise<GetEntrepreneurRequestsResponse> => { 
  const { data } = await apiClient.get<GetEntrepreneurRequestsResponse>(
    `request/entrepreneur/${entrepreneurId}`
  );
  return data;
};

// Fetch entrepreneur collaborators (investors)
export const getEntrepreneurCollaborators = async (): Promise<CollaboratorsResponse> => {
  const { data } = await apiClient.get<CollaboratorsResponse>(
    "/request/entrepreneur/collaborators"
  );
  return data.data;
};