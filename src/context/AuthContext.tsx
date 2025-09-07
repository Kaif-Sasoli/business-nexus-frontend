import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { RegisterResponse, VerifyEmailResponse, signInUser, SignInResponse } from "../api/auth";
import { logoutUser } from "../api/auth";
import { toast } from "react-hot-toast"; 
import { UserRole } from "../types"; 
import { apiClient, publicApi } from '../api/index'

  const USER_STORAGE_KEY = import.meta.env.VITE_USER_STORAGE_KEY; 
  const ACCESS_KEY = import.meta.env.VITE_ACCESS_KEY

  interface AuthContextType {
    user: any | null;
    setUser: React.Dispatch<React.SetStateAction<any | null>>;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, role: UserRole) => Promise<SignInResponse>;
    register: (
      name: string,
      email: string,
      password: string,
      role: UserRole
    ) => Promise<RegisterResponse>;
    verifyAndLogin: (data: VerifyEmailResponse) => void;
    logout: () => void;
  }

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const storedToken = localStorage.getItem(ACCESS_KEY);

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  //  Auto-sync user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  // ✅ Auto-sync token too
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem(ACCESS_KEY, accessToken);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      localStorage.removeItem(ACCESS_KEY);
      delete apiClient.defaults.headers.common["Authorization"];
    }
  }, [accessToken]);

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      const response = await signInUser({ email, password });
      setUser(response.user);
      setAccessToken(response.accessToken);
      toast.success("Login successful");
      return response;
    } catch (err: any) {
      toast.error(err.message || "Login failed");
      throw err;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<RegisterResponse> => {
    return { message: "", id: "", email: "" };
  };

  const verifyAndLogin = (data: VerifyEmailResponse) => {
    const { user, accessToken } = data;
    setUser(user);
    setAccessToken(accessToken);
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setAccessToken(null);
      toast.success("Logged out");
    } catch (err: any) {
      toast.error(err.message || "Logout failed");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        accessToken,
        isAuthenticated: !!accessToken,
        isLoading,
        login,
        register,
        verifyAndLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
