import { apiClient } from ".";

export type ConnectAccountResponse = {
  success: boolean;
  onboardingUrl?: string; 
};

export type InvestPayload = {
  entrepreneurId: string;
  startupName: string;
  industry: string;
  amount: number;
  equity: number;
  stage: "Seed" | "Series A" | "Series B" | "Series C" | "IPO";
  method: "stripe" | "paypal";
};

export type InvestResponse = {
  success: boolean;
  deal?: any;
  paymentIntent?: any; 
  transaction?: any;  
  checkoutUrl?: any; 
};



export const connectAccount = async (data: {
  provider: 'stripe' | 'paypal';
  paypalEmail?: string;
  paypalMerchantId?: string;
}): Promise<ConnectAccountResponse> => {
  const res = await apiClient.post('/payments/connect', data);
  return res.data;
};

export const getAccount = async () => {
  const res = await apiClient.get("/payments/me", { withCredentials: true });
  return res.data;
};

export const investInStartup = async (data: InvestPayload): Promise<InvestResponse> => {
    console.log(data.entrepreneurId)
  const res = await apiClient.post("/investments/invest", data, { withCredentials: true });
  console.log("Acc:", res)
  return res.data;
};
