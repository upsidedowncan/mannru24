export interface EventConfig {
  id: string;
  startDate: Date;
  endDate: Date;
  title: string;
}

export const EVENTS: Record<string, EventConfig> = {
  kurban: {
    id: "kurban",
    // May 26 to May 30, 2026
    startDate: new Date("2026-05-26T00:00:00Z"),
    endDate: new Date("2026-05-30T23:59:59Z"),
    title: "Курбан-байрам",
  },
};

export function isEventActive(eventId: string): boolean {
  const event = EVENTS[eventId];
  if (!event) return false;

  const now = new Date();
  // Using UTC to be consistent with the startDate/endDate definitions
  return now >= event.startDate && now <= event.endDate;
}
