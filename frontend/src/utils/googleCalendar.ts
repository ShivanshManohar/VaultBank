/**
 * Google Calendar & iCalendar export utility for VaultBank
 */

export interface CalendarEventParams {
  title: string;
  description: string;
  startDate: Date | string;
  endDate?: Date | string;
  location?: string;
}

// Format date to UTC string format required by Google Calendar: YYYYMMDDTHHmmssZ
function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
}

/**
 * Generates a direct Google Calendar Web URL to add an event with 1 click
 */
export function getGoogleCalendarUrl({
  title,
  description,
  startDate,
  endDate,
  location = 'VaultBank Private Reserve',
}: CalendarEventParams): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000); // default 1 hour

  const datesParam = `${formatGoogleDate(start)}/${formatGoogleDate(end)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details: description,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Downloads an .ics file for Outlook / Apple Calendar users
 */
export function downloadIcsFile({
  title,
  description,
  startDate,
  endDate,
  location = 'VaultBank Private Reserve',
}: CalendarEventParams): void {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VaultBank//Wealth Intelligence Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:vaultbank-${Date.now()}@vaultbank.com`,
    `DTSTAMP:${formatGoogleDate(new Date())}`,
    `DTSTART:${formatGoogleDate(start)}`,
    `DTEND:${formatGoogleDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
