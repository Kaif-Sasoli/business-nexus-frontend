import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { DollarSign, CreditCard, Wallet, ArrowLeft, Briefcase } from "lucide-react";
import { Card, CardHeader, CardBody, CardFooter } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge"; 
import { useAuth } from "../../context/AuthContext";
import { getStartupByUserId } from "../../api/entrepreneur";
import { investInStartup } from "../../api/account";
import { Startup } from "../../types";
import toast from "react-hot-toast";

export const InvestPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  
  // form state
  const [amount, setAmount] = useState<number>(0);
  const [equity, setEquity] = useState<number>(0);
  const [stage, setStage] = useState<"Seed" | "Series A" | "Series B" | "Series C" | "IPO">("Seed");
  const [method, setMethod] = useState<"stripe" | "paypal" | null>(null);

  // Fetch startup details
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getStartupByUserId(userId)
      .then((res) => setStartup(res.data.startup))
      .catch(() => setStartup(null))
      .finally(() => setLoading(false));
  }, [userId]);

  // Handle investment
  const handleInvest = async () => {
    if (!amount || amount <= 0) return toast.error("Please enter a valid amount");
    if (!equity || equity <= 0) return toast.error("Please enter equity %");
    if (!stage) return toast.error("Please select a funding stage");
    if (!method) return toast.error("Please select a payment method");

    if (!startup) return toast.error("Startup ID missing");
    if (!userId) return toast.error("Startup ID missing");
    try {
      const payload = {
        entrepreneurId: userId, 
        startupName: startup.startupName,
        industry: startup.industry, 
        amount,
        equity,
        stage,
        method,
      };

      const res = await investInStartup(payload);  
      if (res.success) {
        toast.success("Deal created successfully!");
       if (method === "stripe" && res.checkoutUrl) {
            window.location.href = res.checkoutUrl; 
        }
        if (method === "paypal" && res.transaction) {
          // redirect to PayPal if needed
        }
      } else {
        toast.error("Failed to create deal");
      }
    } catch (err: any) {
      toast.error(err?.response?.data.error || "Something went wrong while creating deal");
    }
  };


  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!startup) {
    return (
      <div className="w-full h-[calc(100vh-120px)] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900">Startup Not Found</h2>
        <p className="text-gray-600 mt-2">This startup doesn’t exist.</p>
        <Link to="/dashboard/investor" className="mt-4">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Invest in {startup.startupName}
          </h1>
          <p className="text-gray-600 mt-1">{startup.industry}</p>
        </div>
        <Link to={`/profile/entrepreneur/${userId}`}>
          <Button variant="outline">View Profile</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left side: Investment Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                Make Your Investment
              </h2>
              <p className="text-sm text-gray-600">
                Enter investment details and choose your preferred payment method.
              </p>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Amount */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Investment Amount (USD)
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-2"
                />
              </div>

              {/* Equity */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Equity (%)
                </label>
                <Input
                  type="number"
                  placeholder="Enter equity %"
                  value={equity || ""}
                  onChange={(e) => setEquity(Number(e.target.value))}
                  className="mt-2"
                />
              </div>

              {/* Stage */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Funding Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as "Seed" | "Series A" | "Series B" | "Series C" | "IPO")}
                  className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Seed">Seed</option>
                  <option value="Series A">Series A</option>
                  <option value="Series B">Series B</option>
                  <option value="Series C">Series C</option>
                  <option value="IPO">IPO</option>
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <div className="mt-3 flex gap-3">
                  <Button
                    variant={method === "stripe" ? "default" : "outline"}
                    onClick={() => setMethod("stripe")}
                  >
                    <CreditCard className="mr-2 h-4 w-4" /> Stripe
                  </Button>
                  <Button
                    variant={method === "paypal" ? "default" : "outline"}
                    onClick={() => setMethod("paypal")}
                  >
                    <Wallet className="mr-2 h-4 w-4" /> PayPal
                  </Button>
                </div>
              </div>
            </CardBody>
            <CardFooter>
              <Button
                className="w-full"
                leftIcon={<DollarSign className="h-4 w-4" />}
                onClick={handleInvest}
              >
                Confirm Investment & Create Deal
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right side: Startup Funding Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-indigo-600" />
                Funding Info
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Raised so far</span>
                <span className="font-semibold text-gray-900">
                  ${startup.totalFunds}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Valuation</span>
                <span className="font-semibold text-gray-900">$8M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Round</span>
                <Badge variant="secondary">
                  {startup.fundingRound || "Seed"}
                </Badge>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
