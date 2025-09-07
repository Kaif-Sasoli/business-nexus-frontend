import { apiClient } from "./index";
import { TeamMember,
         StartupOverview,
         Startup,
         UserInfo,
         EntrepreneurCardData,
         StartupAndUserResponse,
         EntrepreneurDashboardResponse
} from "../types/index";



//  Get startup profile + user details by entrepreneur userId

export const getStartupByUserId = async (id: string): 
Promise<StartupAndUserResponse> => {
  try {
    const res = await apiClient.get<StartupAndUserResponse>(`/entrepreneur/startup/${id}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching startup:", error);
    return { success: false, data: { user: null, startup: null }, error: error.message || "Failed to fetch startup" };
  }
};


//  Create a new startup
export const createStartup = async (startupData: Partial<Startup>): 
Promise<{ success: boolean; data: Startup | null; error?: string }> => {
  try {
    const res = await apiClient.post<{ success: boolean; data: Startup }>(
      "/entrepreneur/createStartup",
      startupData
    );
    return res.data;
  } catch (error: any) {
    console.error("Error creating startup:", error);
    return { success: false, data: null, error: error.message || "Failed to create startup" };
  }
};


  // Update existing startup by startup ID
export const updateStartup = async (id: string, startupData: Partial<Startup>):
 Promise<{ success: boolean; data: Startup | null; error?: string }> => {
  try {
    const res = await apiClient.put<{ success: boolean; data: Startup }>(
      `/entrepreneur/startup/${id}`,
      startupData
    );
    return res.data;
  } catch (error: any) {
    console.error("Error updating startup:", error);
    return { success: false, data: null, error: error.message || "Failed to update startup" };
  }
};


export const getAllEntrepreneurs = async (): 
Promise<{ success: boolean; entrepreneurs: EntrepreneurCardData[] }> => {
  try {
    const res = await apiClient.get<{ success: boolean; entrepreneurs: EntrepreneurCardData[] }>(
      "/entrepreneur/all"
    );
    return res.data;
  } catch (error: any) {
    console.error("Error fetching entrepreneurs:", error);
    return { success: false, entrepreneurs: [] };
  }
};

// Search Startups
export const searchEntrepreneursAPI = async (params: {
  searchQuery?: string;
  industries?: string[];
  fundingRanges?: string[];
  locations?: string[];
}): Promise<{ success: boolean; results: EntrepreneurCardData[] }> => {
  try {
    const res = await apiClient.get<{ success: boolean; results: EntrepreneurCardData[] }>(
      "/entrepreneur/search",
      { params }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error searching entrepreneurs:", error);
    return { success: false, results: [] };
  }
};

 export const getEntrepreneurDashboard = async (): Promise<EntrepreneurDashboardResponse> => {
  const { data } = await apiClient.get<EntrepreneurDashboardResponse>("/entrepreneur");
  return data;
};



