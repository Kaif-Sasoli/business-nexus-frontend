import React, { useEffect, useState } from "react";
import { Plus, Users, Building2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

import { 
  getStartupByUserId, 
  createStartup, 
  updateStartup, 
  Startup, 
  TeamMember,
  StartupOverview 
} from '../../api/entrepreneur';

export const StartStartup: React.FC = () => {
  const { user } = useAuth();
  const id = user?.id;

  const [loading, setLoading] = useState(false);
  const [startupId, setStartupId] = useState<string | null>(null);

  // Form state
  const [startupName, setStartupName] = useState("");
  const [location, setLocation] = useState("");
  const [foundedAt, setFoundedAt] = useState("");
  const [totalFunds, setTotalFunds] = useState(0);
  const [industry, setIndustry] = useState("");
  const [overview, setOverview] = useState<StartupOverview>({
    problemStatement: "",
    solution: "",
    marketOpportunity: "",
    competitiveAdvantage: "",
  });
  const [team, setTeam] = useState<TeamMember[]>([]);

  // Fetch startup
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getStartupByUserId(id);
       if (res.success && res.data.startup) {
            const s = res.data.startup;
            setStartupId(s._id);
            setStartupName(s.startupName);
            setLocation(s.location);
            setFoundedAt(s.foundedAt?.slice(0, 10) || "");
            setIndustry(s.industry || "");
            setTotalFunds(s.totalFunds || 0);
            setOverview(s.overview || {
              problemStatement: "",
              solution: "",
              marketOpportunity: "",
              competitiveAdvantage: "",
          });
            setTeam(s.team || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    const startupData: Partial<Startup> = {
      entrepreneurId: id!,
      startupName,
      location,
      foundedAt,
      totalFunds,
      industry,
      overview,
      team,
    };
    setLoading(true);
    try {
      if (startupId) {
        await updateStartup(startupId, startupData);
        toast.success("Startup updated successfully!");
      } else {
        await createStartup(startupData);
        toast.success("Startup created successfully!")
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {startupId ? "Edit Your Startup" : "Create Your Startup"}
        </h1>
        <p className="text-gray-600">
          {startupId
            ? "Update details about your startup."
            : "Let’s get started with your startup profile."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardBody className="p-4 space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Building2 size={18} className="mr-2" /> Startup Info
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users size={18} className="mr-2" /> Team Members
            </Button>
          </CardBody>
        </Card>

        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Startup Info */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Startup Information
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <Input
                label="Startup Name"
                value={startupName}
                onChange={e => setStartupName(e.target.value)}
              />
              <Input
                label="Location"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
              <Input
                label="Founded At"
                type="date"
                value={foundedAt}
                onChange={e => setFoundedAt(e.target.value)}
              />
              <Input
                  label="Industry"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                />
              <Input
                label="Total Funds"
                type="number"
                value={totalFunds}
                onChange={e => setTotalFunds(Number(e.target.value))}
              />
            </CardBody>
          </Card>

          {/* Overview */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
            </CardHeader>
          <CardBody className="space-y-4">
              {(Object.keys(overview) as (keyof StartupOverview)[]).map(
                (field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {field.replace(/([A-Z])/g, " $1")}
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={overview[field]}
                      onChange={e =>
                        setOverview(prev => ({ ...prev, [field]: e.target.value }))
                      }
                    />
                  </div>
                )
              )}
            </CardBody>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              {startupId ? "Save Changes" : "Create Startup"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
