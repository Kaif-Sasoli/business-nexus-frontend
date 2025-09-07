// types/index.ts

/* ----------------------------- USER TYPES ----------------------------- */
export type UserRole = 'entrepreneur' | 'investor';

/* ----------------------------- USER TYPES ----------------------------- */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  isOnline?: boolean;
  createdAt: string;
  lastActiveAt?: string;
}

export interface GetUserResponse {
  success: boolean;
  user: User;
}

export interface Entrepreneur extends User {
  role: "entrepreneur";
  startupName?: string;
  pitchSummary?: string;
  fundingNeeded?: string;
  industry?: string;
  foundedYear?: number;
  teamSize?: number;
}

// export interface Investor extends User {
//   role: "investor";
//   investmentInterests?: string[];
//   investmentStage?: string[];
//   portfolioCompanies?: string[];
//   totalInvestments?: number;
//   minimumInvestment?: string;
//   maximumInvestment?: string;
// }

/* ----------------------------- UPDATE PROFILE ----------------------------- */
export interface UpdateUserProfilePayload {
  name: string;
  location?: string;
  bio?: string;
  avatar?: File;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    location?: string;
    bio?: string;
  };
}

/* ----------------------------- INVESTOR TYPES ----------------------------- */
export interface InvestorUser {
  id: string;
  name: string;
  email: string;
  role: "investor";
  bio: string;
  isEmailVerified: boolean;
  avatar: string;
  isOnline: boolean;
  lastActiveAt: string | null;
  location: string;
  industries: string[];
  investmentStages: string[];
  investmentCriteria: string[];
  totalInvestments: number;
  investmentRange: {
    min: number | null;
    max: number | null;
  };
  portfolioCompanies: string[];
}

export interface Investor extends User {
  role: "investor";
  isOnline: boolean;
  avatarUrl: string;
  bio: string;
  totalInvestments: number;
  investmentStage: string[];
  investmentInterests: string[];
  minimumInvestment: number;
  maximumInvestment: number;
}

export interface InvestorDashboardResponse {
  success: boolean;
  data: {
    collaborationsCount: number;
    dealsCount: number;
    totalInvestments: number;
    totalStartups: number;
    collaborations: any[];
    deals: any[];
  };
}


/* ----------------------------- INVESTOR RESPONSES ----------------------------- */
export interface GetInvestorProfileResponse {
  success: boolean;
  message: string;
  investor: InvestorUser;
}

export interface UpdateInvestorProfileResponse {
  success: boolean;
  message: string;
  investor: InvestorUser;
}

export interface GetRecommendedInvestorsResponse {
  success: boolean;
  count: number;
  data: Investor[];
}

export interface SearchInvestorsResponse {
  success: boolean;
  count: number;
  data: Investor[];
}


/* ----------------------------- STARTUP TYPES ----------------------------- */
export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  linkedin: string;
}

export interface StartupOverview {
  problemStatement: string;
  solution: string;
  marketOpportunity: string;
  competitiveAdvantage: string;
}

export interface Startup {
  _id: string;
  entrepreneurId: string;
  startupName: string;
  location: string;
  foundedAt: string; // ISO date string
  totalFunds: number;
  industry: string;
  overview: StartupOverview;
  team: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  role: string;
  location?: string;
  isEmailVerified: boolean;
}

export interface EntrepreneurCardData {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
  startupName: string | null;
  industry: string | null;
  location: string | null;
  foundedYear: number | null;
  pitchSummary: string | null;
  fundingNeeded: number;
  totalFunds: number;
  teamSize: number;
}

export interface EntrepreneurDashboardResponse {
  success: boolean;
  data: {
    totalConnections: number;
    pendingRequests: number;
    upcomingMeetings: number;
    profileViews: number;
    startup?: {
      id: string;
      name: string;
      stage: string;
      industry: string;
    } | null;
  };
}

export interface StartupAndUserResponse {
  success: boolean;
  data: {
    user: UserInfo | null;
    startup: Startup | null;
  };
  error?: string;
}



/* ----------------------------- REQUEST TYPES ----------------------------- */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  id: string;
  email: string;
  verificationCode: string;
}

/* ----------------------------- RESPONSE TYPES ----------------------------- */
export interface RegisterResponse {
  message: string;
  id: string;
  email: string;
}

export interface SignInResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    bio?: string;
    avatar?: string;
    location?: string;
    isOnline: boolean;
  };
  accessToken: string;
}

export interface VerifyEmailResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    bio?: string;
    avatar?: string;
    location?: string;
    isOnline: boolean;
  };
  accessToken: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message: string;
  data?: T;
}


/* ----------------------------- REQUEST TYPES ----------------------------- */
export interface Request {
  id: string;
  investorId: string;
  entrepreneurId: string;
  startupId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
  respondedAt?: string | null;
}

export interface RequestResponse {
  success: boolean;
  message: string;
  data?: Request;
}

export interface RequestListResponse {
  success: boolean;
  count: number;
  data: Request[];
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface GetEntrepreneurRequestsResponse {
  success: boolean;
  count: number;
  data: CollaborationRequest[];
}

/* ----------------------------- CHAT TYPES ----------------------------- */

export interface ChatPartner {
  id: string;
  name: string;
  isOnline: boolean;
  avatarUrl: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  partner: {
    id: string;
    name: string;
    avatarUrl: string;
    role?: string;
  };
  lastMessage?: Message;
  updatedAt: string;
  unreadCount: number;
}

// Chat Responsees
export interface GetMessagesResponse {
  success: boolean;
  messages: Message[];
  partner: ChatPartner;
}

/* ----------------------------- DOCUMENT TYPES ----------------------------- */
export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

/* ----------------------------- AUTH CONTEXT TYPES ----------------------------- */
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}
