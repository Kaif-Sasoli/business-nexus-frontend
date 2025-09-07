import { apiClient } from "./index";
import { UpdateUserProfilePayload, UpdateUserResponse, GetUserResponse, User } from '../types/index'

// export interface UpdateUserProfilePayload {
//   name: string;
//   location?: string;
//   bio?: string;
//   avatar?: File; // optional file upload
// }

// export interface UpdateUserResponse {
//   success: boolean;
//   message: string;
//   user?: {
//     id: string;
//     name: string;
//     email: string;
//     avatar?: string;
//     location?: string;
//     bio?: string;
//   };
// }

export const updateUserProfile = async (
  payload: UpdateUserProfilePayload
): Promise<UpdateUserResponse> => {
   try {
    const formData = new FormData();
    formData.append("name", payload.name);

    if (payload.location) formData.append("location", payload.location);
    if (payload.bio) formData.append("bio", payload.bio);
    if (payload.avatar) formData.append("avatar", payload.avatar);

    const { data } = await apiClient.patch<UpdateUserResponse>(
      "/user/update",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return data;
  } catch (error: any) {
    // Axios error handling
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Something went wrong. Please try again.");
  }
};


export const getUserById = async (userId: string): Promise<GetUserResponse> => {
  try {
    const { data } = await apiClient.get<GetUserResponse>(`/user/${userId}`);
    return data; 
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to fetch user. Please try again.");
  }
};
