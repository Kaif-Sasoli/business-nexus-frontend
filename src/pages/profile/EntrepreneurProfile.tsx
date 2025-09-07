import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Users, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign, Send } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { entrepreneurs, findUserById } from '../../data/users';
import { createCollaborationRequest, getRequestsFromInvestor } from '../../data/collaborationRequests';
import { Entrepreneur } from '../../types';
import { getStartupByUserId, Startup, UserInfo   } from '../../api/entrepreneur';
import { sendRequest, checkRequestExists } from '../../api/request';
import { useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";

export const EntrepreneurProfile: React.FC = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRequestedCollaboration, setHasRequestedCollaboration] = useState(false);
  const [requestStatus, setRequestStatus] = useState('no')

  const isCurrentUser = currentUser?._id === startup?.entrepreneurId;
  const isInvestor = currentUser?.role === "investor";
     
      // Fetch Startup
      useEffect(() => {
        if (!id) return;
        setLoading(true);
      
        getStartupByUserId(id)
          .then((res) => {
            setStartup(res.data.startup);
            setUserInfo(res.data.user);
          })
          .catch(() => {
            setStartup(null);
          })
          .finally(() => {
            setLoading(false);
          });
      }, [id]);

      // Check Request Exists
     useEffect(() => {
      if (!isInvestor || !currentUser || !id || !startup) return;   

      checkRequestExists(currentUser.id, id, startup._id)
        .then((res) => {
          setHasRequestedCollaboration(res.success && res.exists);
          console.log("Boyr", res.status);
          setRequestStatus(res.status || "none");
        })
        .catch(() => {
          setRequestStatus("none");
        });
    }, [isInvestor, currentUser, id, startup]);

      const handleInvestButton = () => {
             navigate(`/invest/${id}`)
      }

  const handleSendRequest = async () => {
     if (!isInvestor || !currentUser || !id || !startup) return;
     try {
       const res = await sendRequest(
         currentUser.id,  
         id,                  
         startup._id,         
         `I'm interested in learning more about ${startup.startupName}
          and would like to explore potential investment opportunities.`
       );

       if (res.success) {
         setHasRequestedCollaboration(true);
         toast.success(res.message);
       } else {
           toast.success(res.message);
       }
     } catch (err: any) {
       toast.error(err.response.data.message || "Failed to send request");
     }
   };

  // Loader
  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!startup && user?.role === 'entrepreneur') {
    return (
      <div className="w-full h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          No Startup Found
        </h2>
        <p className="text-gray-600 mt-2 max-w-md">
          You haven’t created your startup profile yet. Start your journey by
          creating your startup now.
        </p>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <Link to="/start-startup" state={{ id: currentUser?.id }}>
            <Button>🚀 Start a Startup</Button>
          </Link>

          <Link to="/dashboard/entrepreneur">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={userInfo.avatar}
              alt={userInfo.name}
              size="xl"
              status={userInfo?.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />
            
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{userInfo?.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Founder at {startup.startupName}
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                <Badge variant="primary">{startup.industry}</Badge>
                <Badge variant="gray">
                  <MapPin size={14} className="mr-1" />
                  {startup?.location}
                </Badge>
                <Badge variant="accent">
                  <Calendar size={14} className="mr-1" />
                  Founded {new Date(startup?.foundedAt).getFullYear()}
                </Badge>
                <Badge variant="secondary">
                  <Users size={14} className="mr-1" />
                  {startup.team.length} team members
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${id}`}>
                  <Button
                    variant="outline"
                    leftIcon={<MessageCircle size={18} />}
                  >
                    Message
                  </Button>
                </Link>
                
               {isInvestor && (
                  <>
                    {requestStatus?.toLowerCase() === "accepted" ? (
                      <Button
                        leftIcon={<DollarSign size={18} />}
                        onClick={handleInvestButton}
                      >
                        Invest / Make Deal
                      </Button>
                    ) : (
                      <Button
                        leftIcon={<Send size={18} />}
                        disabled={hasRequestedCollaboration}
                        onClick={handleSendRequest}
                      >
                        {hasRequestedCollaboration ? "Request Sent" : "Request Collaboration"}
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
            
            {isCurrentUser && (
              <Button
                variant="outline"
                leftIcon={<UserCircle size={18} />}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - left side */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">About</h2>
            </CardHeader>
            <CardBody>
            <p className="text-gray-700">
              {userInfo.bio && userInfo.bio.trim() !== "" ? userInfo.bio : "No bio provided"}
            </p>
            </CardBody>
          </Card>
          
          {/* Startup Description */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Startup Overview</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900">Problem Statement</h3>
                  <p className="text-gray-700 mt-1">
                    {startup?.overview?.problemStatement}.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900">Solution</h3>
                  <p className="text-gray-700 mt-1">
                    {startup?.overview?.solution}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900">Market Opportunity</h3>
                  <p className="text-gray-700 mt-1">
                     {startup?.overview?.marketOpportunity} 
                  </p>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900">Competitive Advantage</h3>
                  <p className="text-gray-700 mt-1">
                   {startup?.overview?.competitiveAdvantage}
                   </p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Team */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Team</h2>
              <span className="text-sm text-gray-500">{startup.team?.length} members</span>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar
                    src={userInfo?.avatar}
                    alt={userInfo?.name}
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{userInfo?.name}</h3>
                    <p className="text-xs text-gray-500">Founder & CEO</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar
                    src="https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg"
                    alt="Team Member"
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Alex Johnson</h3>
                    <p className="text-xs text-gray-500">CTO</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar
                    src="https://images.pexels.com/photos/773371/pexels-photo-773371.jpeg"
                    alt="Team Member"
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Jessica Chen</h3>
                    <p className="text-xs text-gray-500">Head of Product</p>
                  </div>
                </div>
                
                {startup.team?.length > 3 && (
                  <div className="flex items-center justify-center p-3 border border-dashed border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500">+ {startup.team?.length - 3} more team members</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Sidebar - right side */}
        <div className="space-y-6">
          {/* Funding Details */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Funding</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Current Round</span>
                  <div className="flex items-center mt-1">
                    <DollarSign size={18} className="text-accent-600 mr-1" />
                    <p className="text-lg font-semibold text-gray-900">{startup?.totalFunds}</p>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Valuation</span>
                  <p className="text-md font-medium text-gray-900">$8M - $12M</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Previous Funding</span>
                  <p className="text-md font-medium text-gray-900">$750K Seed (2022)</p>
                </div>
                
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Funding Timeline</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Pre-seed</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Seed</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Series A</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">In Progress</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Documents */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Documents</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 mb-2">
                <div className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-primary-50 rounded-md mr-3">
                    <FileText size={18} className="text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Pitch Deck</h3>
                    <p className="text-xs text-gray-500">Updated 2 months ago</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                
                <div className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-primary-50 rounded-md mr-3">
                    <FileText size={18} className="text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Business Plan</h3>
                    <p className="text-xs text-gray-500">Updated 1 month ago</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                
                <div className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-primary-50 rounded-md mr-3">
                    <FileText size={18} className="text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Financial Projections</h3>
                    <p className="text-xs text-gray-500">Updated 2 weeks ago</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
              
             {isInvestor && ( 
                <Button
                  leftIcon={<Send size={18} />}
                  disabled={hasRequestedCollaboration}
                  onClick={handleSendRequest}
                >
                  {hasRequestedCollaboration ? "Request Sent" : "Request Collaboration"}
                </Button>
              )}
              
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};