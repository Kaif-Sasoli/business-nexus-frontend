import { Calendar, dateFnsLocalizer } from "react-big-calendar";  
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Meeting } from "../../api/meetings";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export const MeetingsCalendar: React.FC<{ meetings: Meeting[] }> = ({ meetings }) => {
  const events = meetings.map((m) => ({
    id: m.id,
    title: m.title,
    start: new Date(m.startTime),
    end: new Date(m.endTime),
    resource: m,
  }));

  return (
    <div className="h-[600px] bg-white p-4 rounded-xl shadow">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
      />
    </div>
  );
};
