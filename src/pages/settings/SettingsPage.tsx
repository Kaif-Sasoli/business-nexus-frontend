import React, { useEffect } from 'react';
import { User, Lock, Bell, Globe, Palette, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../api/user'
import { updateInvestorProfile } from '../../api/investor'
import { connectAccount, getAccount } from '../../api/account'
import { useState } from 'react';
import { toast } from 'react-hot-toast'

export const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuth(); // assuming setUser updates context
   const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "language" | "appearance" | "billing">("profile");
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || ""); // email is not editable
  const [location, setLocation] = useState(user?.location || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(user?.avatar || null);
  const [isLoading, setLoading] = useState(false);
  // Billing (UI-only; no API calls)
  const [billingProvider, setBillingProvider] = useState<'stripe' | 'paypal'>('stripe');
  const [stripeAccountId, setStripeAccountId] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalMerchantId, setPaypalMerchantId] = useState('');
  // Billing 
  const [isBillingConnected, setIsBillingConnected] = useState(false);



  const handleSave = async () => {
      setLoading(true);
      try {
        const updated = await updateUserProfile({
          name,
          location,
          bio,
          avatar: avatar || undefined,
        });
      
        if (updated.user) {
          setUser(updated.user);
          toast.success("Profile updated successfully.");
        }
      } catch (err: any) {
        toast.error(err.message); 
      } finally {
        setLoading(false);
      }
};

    const handleInvestorSave = async () => {
      if (!user?.id) return;
    
      setLoading(true);
      try {
        const updated = await updateInvestorProfile(user.id, {
          industries: user.industries || [],
          investmentStages: user.investmentStages || [],
          investmentCriteria: user.investmentCriteria || [],
          totalInvestments: user.totalInvestments || 0,
          investmentRange: {
            min: user.investmentRange?.min || 0,
            max: user.investmentRange?.max || 0,
          },
          portfolioCompanies: user.portfolioCompanies || [],
        });
      
        // console.log("Updated Investor Profile: ", updated.investor);
      
        if (updated.investor) {
          setUser(updated.investor);
          toast.success("Investor details updated successfully.");
        }
         } catch (err: any) {
           toast.error(err.message);
         } finally {
           setLoading(false);
         }
    };

       useEffect(() => {
        const fetchAccount = async () => {
          try {
            const res = await getAccount();
            if (res.success && res.account) {
              const account = res.account;
            
              // Pre-fill form based on provider
              if (account.provider === 'stripe') {
                setBillingProvider('stripe');
                setStripeAccountId(account.stripeAccountId || '');
                setIsBillingConnected(true);
              } else if (account.provider === 'paypal') {
                setBillingProvider('paypal');
                setPaypalEmail(account.paypalEmail || '');
                setPaypalMerchantId(account.paypalMerchantId || '');
                setIsBillingConnected(true);
              }
            }
          } catch (err: any) {
            console.error('Failed to fetch billing account:', err);
          }
        };
      
        fetchAccount();
     }, []);



  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings navigation */}
        {/* Settings navigation */}
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              {[
                { key: "profile", label: "Profile", icon: User },
                { key: "security", label: "Security", icon: Lock },
                { key: "notifications", label: "Notifications", icon: Bell },
                { key: "language", label: "Language", icon: Globe },
                { key: "appearance", label: "Appearance", icon: Palette },
                { key: "billing", label: "Billing", icon: CreditCard },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md
                    ${activeTab === key 
                      ? "text-primary-700 bg-primary-50" 
                      : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <Icon size={18} className="mr-3" />
                  {label}
                </button>
              ))}
            </nav>
          </CardBody>
        </Card>
        
        {/* Main settings content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
                </CardHeader>
                  <CardBody className="space-y-6">
                    {/* your profile form here */}
                     <div className="flex items-center gap-6">
                            <Avatar
                              src={preview || user.avatar} 
                              alt={user.name}
                              size="xl"
                            />
                            
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="avatar-upload"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setAvatar(file);
                                    setPreview(URL.createObjectURL(file));
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById("avatar-upload")?.click()}
                              >
                                Change Photo
                              </Button>
                              <p className="mt-2 text-sm text-gray-500">
                                JPG, GIF or PNG. Max size of 800K
                              </p>
                            </div>
                          </div>
                              
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                              label="Full Name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                            />
                            
                            <Input
                              label="Email"
                              type="email"
                              disabled
                              value={email}
                            />
                            
                            <Input
                              label="Role"
                              value={user.role}
                              disabled
                            />
                            
                            <Input
                              label="Location"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                            />
                          </div>
                              
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bio
                            </label>
                            <textarea
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              rows={4}
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}          
                              
                            ></textarea>
                          </div>
                              
                          <div className="flex justify-end gap-3">
                            <Button variant="outline">Cancel</Button>
                            <Button
                            type="button"   
                            isLoading={isLoading}
                            onClick={handleSave} 
                          >
                            Save changes
                          </Button>
                          </div>
                  </CardBody>
              </Card>
            )}
        
          {/* Investor-specific settings */}
            {user.role === 'investor' && activeTab === 'profile'  && (
              <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Investor Settings</h2>
              </CardHeader>
              <CardBody className="space-y-6">          

                {/* Industries */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industries</label>
                  <Input
                    placeholder="e.g. FinTech, SaaS, AI/ML"
                    value={user.industries?.join(', ') || ''}
                    onChange={(e) =>
                      setUser({
                        ...user,
                        industries: e.target.value.split(',').map((i) => i.trim())
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated values</p>
                </div>          

                {/* Investment Stages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Investment Stages</label>
                  <Input
                    placeholder="e.g. Seed, Series A"
                    value={user.investmentStages?.join(', ') || ''}
                    onChange={(e) =>
                      setUser({
                        ...user,
                        investmentStages: e.target.value.split(',').map((s) => s.trim())
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated values</p>
                </div>          

                {/* Investment Criteria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Investment Criteria</label>
                  <textarea
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    rows={3}
                    value={user.investmentCriteria?.join('\n') || ''}
                    onChange={(e) =>
                      setUser({
                        ...user,
                        investmentCriteria: e.target.value.split('\n').map((c) => c.trim())
                      })
                    }
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">One criterion per line</p>
                </div>          

                {/* Total Investments */}
                <div>
                  <Input
                    label="Total Investments"
                    type="number"
                    value={user.totalInvestments || 0}
                    onChange={(e) =>
                      setUser({ ...user, totalInvestments: Number(e.target.value) })
                    }
                  />
                </div>          

                    {/* Investment Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Investment Range Min ($)"
                        type="number"
                        value={user.investmentRange?.min || ''}
                        onChange={(e) =>
                          setUser({
                            ...user,
                            investmentRange: {
                              ...user.investmentRange,
                              min: Number(e.target.value)
                            }
                          })
                        }
                      />
                      <Input
                        label="Investment Range Max ($)"
                        type="number"
                        value={user.investmentRange?.max || ''}
                        onChange={(e) =>
                          setUser({
                            ...user,
                            investmentRange: {
                              ...user.investmentRange,
                              max: Number(e.target.value)
                            }
                          })
                        }
                      />
                    </div>
                      
                    <div className="flex justify-end gap-3">
                      <Button variant="outline">Cancel</Button>
                      <Button
                       type="button"
                       isLoading={isLoading}
                       onClick={handleInvestorSave}
                      >
                        Save Investor Details
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              )}
          
         

          {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
                </CardHeader>
                <CardBody className="space-y-6">
                  {/* your security fields here */}
                   <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Add an extra layer of security to your account
                              </p>
                              <Badge variant="error" className="mt-1">Not Enabled</Badge>
                            </div>
                            <Button variant="outline">Enable</Button>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                          <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
                          <div className="space-y-4">
                            <Input
                              label="Current Password"
                              type="password"
                            />

                            <Input
                              label="New Password"
                              type="password"
                            />

                            <Input
                              label="Confirm New Password"
                              type="password"
                            />

                            <div className="flex justify-end">
                              <Button>Update Password</Button>
                            </div>
                          </div>
                        </div>
                </CardBody>
              </Card>
              )}

              

         {/* Billing */}
          {activeTab === 'billing' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Billing</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <p className="text-gray-600">
                  Connect your billing account to receive or send money.
                </p>

                {/* Provider selector */}
                <div className="flex items-center gap-3">
                {/* Provider selector */}
               <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant={billingProvider === 'stripe' ? 'default' : 'outline'}
                    onClick={() => setBillingProvider('stripe')}
                    disabled={!!stripeAccountId} // disable if user has Stripe
                  >
                    Stripe
                  </Button>
                  <Button
                    type="button"
                    variant={billingProvider === 'paypal' ? 'default' : 'outline'}
                    onClick={() => setBillingProvider('paypal')}
                    disabled={!!paypalEmail} 
                  >
                    PayPal
                  </Button>
                </div>
                 </div>

                {/* Stripe fields */}
                {billingProvider === 'stripe' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                      You’ll be redirected to Stripe onboarding when you save.
                    </p>
                  </div>
                )}

                {/* PayPal fields */}
                {billingProvider === 'paypal' && (
                  <div className="space-y-4">
                    <Input
                      label="PayPal Email"
                      type="email"
                      placeholder="you@example.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                    />
                    <Input
                      label="PayPal Merchant ID (optional)"
                      placeholder="e.g., ABCDEFGH12345"
                      value={paypalMerchantId}
                      onChange={(e) => setPaypalMerchantId(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex justify-end">
                 <Button
                  type="button"
                  isLoading={isLoading}
                  disabled={
                    (billingProvider === 'stripe' && !!stripeAccountId) ||
                    (billingProvider === 'paypal' && !!paypalEmail)
                  }
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await connectAccount({
                        provider: billingProvider,
                        paypalEmail,
                        paypalMerchantId,
                      });
                    
                      if (billingProvider === 'stripe' && res.onboardingUrl) {
                        window.location.href = res.onboardingUrl;
                      } else {
                        toast.success('Billing info saved!');
                        setIsBillingConnected(true);
                      }
                    } catch (err: any) {
                      toast.error(err.response?.data?.error || err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {billingProvider === 'stripe' && !!stripeAccountId
                    ? 'Stripe Connected'
                    : billingProvider === 'paypal' && !!paypalEmail
                    ? 'PayPal Connected'
                    : 'Save Billing'}
                </Button>
                </div>
              </CardBody>
            </Card>
          )}

              {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
                </CardHeader>
                <CardBody>
                  <p>Notification settings coming soon...</p>
                </CardBody>
              </Card>
            )}

            {activeTab === "language" && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">Language</h2>
                </CardHeader>
                <CardBody>
                  <p>Language settings coming soon...</p>
                </CardBody>
              </Card>
            )}

            {activeTab === "appearance" && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">Appearance</h2>
                </CardHeader>
                <CardBody>
                  <p>Appearance settings coming soon...</p>
                </CardBody>
              </Card>
            )}

        </div>
      </div>
    </div>
  );
};