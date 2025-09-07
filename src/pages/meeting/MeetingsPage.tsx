// src/pages/meetings/MeetingsPage.tsx
import React, { useState, useEffect } from "react";
import { Plus, Clock, User } from "lucide-react";
import { Card, CardBody, CardFooter } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  getMeetings,
  createMeeting,
  acceptMeetingAPI,
  rejectMeetingAPI,
  cancelMeetingAPI,
  Meeting,
} from "../../api/meetings";
import { getEntrepreneurCollaborators } from "../../api/request";
import { startMeetingAPI } from "../../api/meetings";
import { useAuth } from "../../context/AuthContext";
import  { MeetingsCalendar }  from "../../components/calender/MeetingsCalendar";
import { RoomCallModal } from '../../components/call/RoomCall'


import toast from "react-hot-toast";
import { useSocket } from "../../context/SocketContext";


export const MeetingsPage: React.FC = () => {
  const { user } = useAuth(); 
  const { socket, isConnected } = useSocket();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // view: 'list' | 'calendar'
  const [view, setView] = useState<"list" | "calendar">("list");

  // Fetch meetings and collaborators
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const meetingsRes = await getMeetings();
        setMeetings(Array.isArray(meetingsRes) ? meetingsRes : []);

        if (user.role === "entrepreneur") {
          const collaboratorsRes = await getEntrepreneurCollaborators();
          const accepted = Array.isArray(collaboratorsRes)
            ? collaboratorsRes.filter((c) => c.status === "accepted")
            : [];
          setCollaborators(accepted);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setMeetings([]);
        setCollaborators([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.role]);

  // Filter meetings
  const filteredMeetings = meetings.filter((meeting) => {
    if (filter === "upcoming") return new Date(meeting.startTime) >= new Date();
    if (filter === "past") return new Date(meeting.startTime) < new Date();
    return true;
  });

  // Cancel Meeting
  const handleCancel = async (meetingId: string) => {
    try {
      setLoading(true);
      await cancelMeetingAPI(meetingId);
      toast.success("Meeting cancelled successfully!");

      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, status: "cancelled" } : m))
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel meeting");
    } finally {
      setLoading(false);
    }
  };

  // Save New Meeting
  const handleSaveMeeting = async () => {
    try {
      await createMeeting({
        title,
        description,
        participants,
        startTime,
        endTime,
      });

      setShowNewMeeting(false);
      setTitle("");
      setDescription("");
      setParticipants([]);
      setStartTime("");
      setEndTime("");

      const res = await getMeetings();
      setMeetings(Array.isArray(res) ? res : []);
      toast.success("Meeting created successfully!");
    } catch (err) {
      console.error("Error creating meeting:", err);
      toast.error("Failed to create meeting");
    }
  };

  // Accept Meeting
  const handleAccept = async (meetingId: string) => {
    try {
      await acceptMeetingAPI(meetingId);
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meetingId
            ? {
                ...m,
                participants: m.participants.map((p) =>
                  p.id === user.id ? { ...p, status: "accepted" } : p
                ),
              }
            : m
        )
      );
      toast.success("Meeting accepted");
    } catch (error) {
      console.error("Error accepting meeting:", error);
      toast.error("Failed to accept meeting");
    }
  };

      // Reject Meeting
      const handleReject = async (meetingId: string) => {
        try {
          await rejectMeetingAPI(meetingId);
          setMeetings((prev) =>
            prev.map((m) =>
              m.id === meetingId
                ? {
                    ...m,
                    participants: m.participants.map((p) =>
                      p.id === user.id ? { ...p, status: "rejected" } : p
                    ),
                  }
                : m
            )
          );
          toast.success("Meeting rejected");
        } catch (error) {
          console.error("Error rejecting meeting:", error);
          toast.error("Failed to reject meeting");
        }
      };
    
  
        useEffect(() => {
        if (!socket) return;
        
        const handleMeetingStarted = (data: any) => {
          setMeetings((prev) =>
            prev.map((m) =>
              m.id === data.meetingId
                ? { ...m, status: "live", roomId: data.roomId, roomUrl: data.roomUrl }
                : m
            )
          );
          toast.success("Meeting is live! You can now join.");
        };
      
        socket.on("meeting:started", handleMeetingStarted);
      
        return () => {
          socket.off("meeting:started", handleMeetingStarted);
        };
      }, [socket]);
    
  // Start Meeting
const handleStartMeeting = async (meetingId: string) => {
  try {
    const res = await startMeetingAPI(meetingId);

    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId
          ? { ...m, status: "live", roomId: res.meeting.roomId, roomUrl: res.meeting.roomUrl }
          : m
      )
    );

    toast.success("Meeting started");

    setActiveRoomId(res.meeting.roomId);
    setIsRoomOpen(true);
  } catch (error) {
    console.error("Error starting meeting:", error);
    toast.error("Failed to start meeting");
  }
};


  // when a calendar event is selected (optional)
  const handleSelectCalendarEvent = (meeting: Meeting) => {
    // open a modal or navigate to meeting detail - for now just log
    console.log("Selected meeting from calendar", meeting);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {activeRoomId && (
      <RoomCallModal
        isOpen={isRoomOpen}
        onClose={() => {
          setIsRoomOpen(false);
          setActiveRoomId(null);
        }}
        roomId={activeRoomId}
        meetingId={meetings.find((m) => m.roomId === activeRoomId)?.id || ""}
      />
    )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Organize and track your investor meetings</p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              onClick={() => setView("list")}
              variant={view === "list" ? "primary" : "ghost"}
              size="sm"
              className="rounded-md"
            >
              List View
            </Button>
            <Button
              onClick={() => setView("calendar")}
              variant={view === "calendar" ? "primary" : "ghost"}
              size="sm"
              className="rounded-md"
            >
              Calendar View
            </Button>
          </div>

          {/* Main Action */}
          {user.role === "entrepreneur" && (
            <Button
              variant="primary"
              leftIcon={<Plus size={18} />}
              onClick={() => setShowNewMeeting(true)}
              className="shadow-md rounded-lg"
            >
              Schedule Meeting
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {["all", "upcoming", "past"].map((f) => (
          <Badge
            key={f}
            variant={filter === (f as any) ? "primary" : "gray"}
            className="cursor-pointer"
            onClick={() => setFilter(f as any)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Badge>
        ))}
      </div>

      {/* Main content: list or calendar */}
      {view === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <p className="text-gray-500">Loading meetings...</p>
          ) : filteredMeetings.length === 0 ? (
            <p className="text-gray-500">No meetings found</p>
          ) : (
            filteredMeetings.map((meeting) => (
              <Card key={meeting.id} hoverable>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {meeting.title}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock size={14} /> {new Date(meeting.startTime).toLocaleString()} -{" "}
                        {new Date(meeting.endTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 flex flex-col gap-2 mt-2">
                        <span className="flex items-center gap-1">
                          <User size={14} /> Participants:
                        </span>
                        {meeting.participants.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-2 ml-5 bg-gray-50 p-2 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar src={p.avatar || ""} alt={p.name} size="xs" />
                              <span>{p.name}</span>
                            </div>
                            <Badge
                              className={
                                p.status === "accepted"
                                  ? "bg-green-100 text-green-800 text-xs"
                                  : p.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 text-xs"
                                  : "bg-red-100 text-red-800 text-xs"
                              }
                            >
                              {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                            </Badge>
                          </div>
                        ))}
                      </p>
                    </div>
                    <Badge variant="secondary">{meeting.status || "Scheduled"}</Badge>
                  </div>
                </CardBody>
                <CardFooter className="bg-gray-50 border-t flex justify-end gap-2">
                {user.role === "entrepreneur" ? (
                  <>
                    {meeting.status === "scheduled" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartMeeting(meeting.id)}
                    >
                      Start Meeting
                    </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => handleCancel(meeting.id)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    {meeting.status === "live" ? (
                      <Button
                        variant="primary"
                        size="sm"
                       onClick={() => {
                          if (!meeting?.roomId) {
                            toast.error("Meeting room not ready yet");
                            return;
                          }
                          toast.success("Joining meeting...");
                          setActiveRoomId(meeting.roomId);
                          setIsRoomOpen(true);
                        }}
                         >
                        Join Meeting
                      </Button>
                    ) : meeting.participants.find((p) => p.id === user.id)?.status ===
                      "pending" ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAccept(meeting.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => handleReject(meeting.id)}
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                  </>
                )}
              </CardFooter>
              </Card>
            ))
          )}
        </div>
      ) : (
        // Calendar view
        <div>
          <MeetingsCalendar
            meetings={filteredMeetings}
            onSelectEvent={handleSelectCalendarEvent}
          />
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {user.role === "entrepreneur" && (
        <Dialog open={showNewMeeting} onOpenChange={setShowNewMeeting}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Meeting Title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>

              <div className="space-y-2">
                <Label>Participants</Label>
                <Select
                  value=""
                  onValueChange={(value) =>
                    setParticipants((prev) =>
                      prev.includes(value)
                        ? prev.filter((p) => p !== value)
                        : [...prev, value]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select participants" />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborators.map((c) => (
                      <SelectItem key={c.investor?.id} value={c.investor?.id}>
                        {c.investor?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {participants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {participants.map((p) => {
                      const collaborator = collaborators.find(
                        (c) => c.investor?.id === p
                      );
                      return (
                        <Badge
                          key={p}
                          variant="secondary"
                          className="flex items-center gap-2"
                        >
                          <Avatar
                            src={collaborator?.investor?.avatar || ""}
                            alt={collaborator?.investor?.name || "Unknown"}
                            size="xs"
                          />
                          <span>{collaborator?.investor?.name || "Unknown"}</span>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewMeeting(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveMeeting}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
