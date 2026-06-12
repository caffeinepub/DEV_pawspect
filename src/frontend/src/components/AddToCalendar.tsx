import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { APP_NAME } from "../config/business";

interface CalendarEvent {
  title: string;
  startDate: bigint;
  endDate: bigint;
  description?: string;
  location?: string;
}

function formatICSDate(ts: bigint): string {
  const d = new Date(Number(ts / 1_000_000n));
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function buildICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${APP_NAME}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const ev of events) {
    lines.push(
      "BEGIN:VEVENT",
      `DTSTART:${formatICSDate(ev.startDate)}`,
      `DTEND:${formatICSDate(ev.endDate)}`,
      `SUMMARY:${ev.title.replace(/,/g, "\\,")}`,
      `DESCRIPTION:${(ev.description ?? "").replace(/\n/g, "\\n")}`,
      `LOCATION:${ev.location ?? ""}`,
      `UID:pawspect-${ev.startDate}-${Math.random().toString(36).slice(2)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

interface AddToCalendarProps {
  title: string;
  startDate: bigint;
  endDate: bigint;
  description?: string;
  location?: string;
  /** If provided, one event per day is generated */
  extraDays?: Array<{ startDate: bigint; endDate: bigint }>;
  size?: "sm" | "default";
  className?: string;
}

export default function AddToCalendar({
  title,
  startDate,
  endDate,
  description,
  location,
  extraDays,
  size = "sm",
  className = "",
}: AddToCalendarProps) {
  const handleDownload = () => {
    const events: CalendarEvent[] =
      extraDays && extraDays.length > 0
        ? extraDays.map((d) => ({
            title,
            startDate: d.startDate,
            endDate: d.endDate,
            description,
            location,
          }))
        : [{ title, startDate, endDate, description, location }];

    const icsContent = buildICS(events);
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      size={size}
      variant="outline"
      onClick={handleDownload}
      className={`rounded-full gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/30 ${className}`}
      data-ocid="calendar.add_button"
      title="Add to Calendar"
    >
      <CalendarPlus size={size === "sm" ? 11 : 14} />
      Add to Calendar
    </Button>
  );
}
