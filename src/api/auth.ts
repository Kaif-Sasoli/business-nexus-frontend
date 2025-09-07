// frontend/services/authService.ts
import { apiClient, publicApi } from "../api/index"; 
import { UserRole, 
         RegisterRequest,
         SignInRequest,
         VerifyEmailRequest,
         RegisterResponse,
         SignInResponse,
         VerifyEmailResponse,
         ApiResponse,

       } from "../types";


    export interface User {
      id: string;
      name: string;
      email: string;
      role: "investor" | "entrepreneur";
    }

    export const registerUser = async (
      data: RegisterRequest
    ): Promise<RegisterResponse> => {
      try {
        const response = await publicApi.post<RegisterResponse>("/auth/register", data);
        return response.data; 
      } catch (error: any) {
        const message = error.response?.data?.error || "Something went wrong";
        throw new Error(message);
      }
    };

    export const signInUser = async (
      data: SignInRequest
    ): Promise<SignInResponse> => {
      try {
        const response = await publicApi.post<SignInResponse>("/auth/signin", data, {
          withCredentials: true, 
        });
        return response.data;
      } catch (error: any) {
        const message = error.response?.data?.error || "Something went wrong";
        throw new Error(message);
      }
    };
    

    export const verifyEmail = async (
      data: VerifyEmailRequest
    ): Promise<VerifyEmailResponse> => {
      try {
        const response = await publicApi.post<VerifyEmailResponse>("/auth/verify-email",
          data
        );
        return response.data;
      } catch (error: any) {
        const message = error.response?.data?.error || "Something went wrong";
        throw new Error(message);
      }
    };

    export const logoutUser = async (): Promise<{ message: string }> => {
       try {
         const response = await apiClient.post<{ message: string }>(
           "/auth/logout",
           {} 
         );
         return response.data;
       } catch (error: any) {
         const message = error.response?.data?.error || "Something went wrong during logout";
         throw new Error(message);
       }
    };
