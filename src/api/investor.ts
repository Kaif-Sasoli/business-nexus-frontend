import { apiClient } from "./index";
import { InvestorUser,
         GetInvestorProfileResponse,
         UpdateInvestorProfileResponse,
         GetRecommendedInvestorsResponse,
         SearchInvestorsResponse,
         InvestorDashboardResponse,

         
 } from '../types/index'

  export interface Investor {
    id: string;
    name: string;
    isOnline: boolean;
    avatarUrl: string;
    bio: string;
    totalInvestments: number;
    investmentStage: string[];
    investmentInterests: string[];
    minimumInvestment: number;
    maximumInvestment: number;
  }

  
  /* ----------------------------- INVESTOR API ----------------------------- */
  // Fetch logged-in investor’s profile
  export const getInvestorProfile = async (
    id: string
  ): Promise<GetInvestorProfileResponse> => {
    const { data } = await apiClient.get<GetInvestorProfileResponse>(
      `/investor/me/${id}`
    );
    return data;
  };

  export const updateInvestorProfile = async (
    id: string,
    payload: Partial<InvestorUser>
  ): Promise<UpdateInvestorProfileResponse> => {
    const { data } = await apiClient.patch<UpdateInvestorProfileResponse>(
      `/investor/update-specific-detials/${id}`,
      payload
    );
    return data;
  };

  export const getRecommendedInvestors =
    async (): Promise<GetRecommendedInvestorsResponse> => {
      const { data } =
        await apiClient.get<GetRecommendedInvestorsResponse>(
          "/investor/recommended-investors"
        );
      return data;
    };

  //  Search Investors
  export const searchInvestors = async (params: {
    searchQuery?: string;
    industries?: string[];
    stages?: string[];
    minInvestment?: number;
    maxInvestment?: number;
    location?: string;
  }): Promise<SearchInvestorsResponse> => {
    const query = new URLSearchParams();

    if (params.searchQuery) query.append("searchQuery", params.searchQuery);
    if (params.industries) query.append("industries", params.industries.join(","));
    if (params.stages) query.append("stages", params.stages.join(","));
    if (params.minInvestment)
      query.append("minInvestment", params.minInvestment.toString());
    if (params.maxInvestment)
      query.append("maxInvestment", params.maxInvestment.toString());
    if (params.location) query.append("location", params.location);

    const { data } = await apiClient.get<SearchInvestorsResponse>(
      `/investor/search?${query.toString()}`
    );
    return data;
  };

  export const getInvestorDashboard = async (): Promise<InvestorDashboardResponse> => {
  const { data } = await apiClient.get<InvestorDashboardResponse>("/investor/get-dashboard");
  return data;
};

  