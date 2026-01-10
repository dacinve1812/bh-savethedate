// Utility functions to generate calendar links for different services

/**
 * Formats a date for calendar services
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string (YYYYMMDD)
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Formats a datetime for calendar services
 * @param {Date} date - The date object
 * @param {string} timeStr - Time string like "7:00 PM"
 * @returns {string} Formatted datetime string (YYYYMMDDTHHmmss)
 */
function formatDateTime(date, timeStr) {
  const dateStr = formatDate(date);
  
  // Parse time string (e.g., "7:00 PM" or "7:00 AM")
  const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeMatch) return dateStr + 'T190000';
  
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const ampm = timeMatch[3].toUpperCase();
  
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  
  return `${dateStr}T${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}00`;
}

/**
 * URL encodes text for calendar links
 */
function encodeText(text) {
  return encodeURIComponent(text);
}

/**
 * Generates calendar links for different services
 */
export function generateCalendarLinks(eventDetails) {
  const {
    title = "Wedding Ceremony",
    description = "We can't wait to celebrate with you!",
    location = "",
    startDate = new Date(2026, 4, 30), // May 30, 2026 (month is 0-indexed)
    startTime = "7:00 PM",
    endTime = "11:00 PM",
    allDay = false
  } = eventDetails;

  const startDateTime = allDay 
    ? formatDate(startDate) 
    : formatDateTime(startDate, startTime);
  
  const endDateTime = allDay
    ? formatDate(new Date(startDate.getTime() + 24 * 60 * 60 * 1000))
    : formatDateTime(startDate, endTime);

  // For iCal format
  let iCalStart, iCalEnd;
  
  if (allDay) {
    // All-day events: use date only format (YYYYMMDD)
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    
    iCalStart = `${year}${month}${day}`;
    
    // End date for all-day events is the next day
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    iCalEnd = `${endYear}${endMonth}${endDay}`;
  } else {
    // Timed events: use local time (floating time without timezone)
    // Parse start time
    let startHours = 7; // default 7 AM
    let startMinutes = 0;
    if (startTime) {
      const timeMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        startHours = parseInt(timeMatch[1], 10);
        startMinutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3].toUpperCase();
        if (ampm === 'PM' && startHours !== 12) startHours += 12;
        if (ampm === 'AM' && startHours === 12) startHours = 0;
      }
    }

    // Parse end time
    let endHours = 23; // default 11 PM
    let endMinutes = 0;
    if (endTime) {
      const timeMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        endHours = parseInt(timeMatch[1], 10);
        endMinutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3].toUpperCase();
        if (ampm === 'PM' && endHours !== 12) endHours += 12;
        if (ampm === 'AM' && endHours === 12) endHours = 0;
      }
    }

    // Format for iCal (floating time - no timezone, no Z suffix)
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const hoursStr = String(startHours).padStart(2, '0');
    const minutesStr = String(startMinutes).padStart(2, '0');
    const endHoursStr = String(endHours).padStart(2, '0');
    const endMinutesStr = String(endMinutes).padStart(2, '0');
    
    iCalStart = `${year}${month}${day}T${hoursStr}${minutesStr}00`;
    iCalEnd = `${year}${month}${day}T${endHoursStr}${endMinutesStr}00`;
  }

  // For other calendar services, still use Date objects
  const startDateObj = allDay ? new Date(startDate) : (() => {
    const d = new Date(startDate);
    if (startTime) {
      const timeMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3].toUpperCase();
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        d.setHours(hours, minutes, 0, 0);
      }
    }
    return d;
  })();
  
  const endDateObj = allDay ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000) : (() => {
    const d = new Date(startDate);
    if (endTime) {
      const timeMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3].toUpperCase();
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        d.setHours(hours, minutes, 0, 0);
      }
    }
    return d;
  })();

  // Note: Google Calendar URL doesn't support reminders directly
  // Both Apple and Google Calendar now use iCal file download which includes reminder (1 day before)
  // For all-day events in Google Calendar, dates should be YYYYMMDD format and end date should be next day
  const googleStartDate = allDay ? formatDate(startDate) : startDateTime;
  const googleEndDate = allDay ? formatDate(new Date(startDate.getTime() + 24 * 60 * 60 * 1000)) : endDateTime;
  
  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeText(title)}&dates=${googleStartDate}/${googleEndDate}${allDay ? '&sf=true&output=xml' : ''}&details=${encodeText(description)}&location=${encodeText(location)}`,
    
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeText(title)}&startdt=${startDateObj.toISOString()}&enddt=${endDateObj.toISOString()}&body=${encodeText(description)}&location=${encodeText(location)}`,
    
    yahoo: `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeText(title)}&st=${startDateTime}&dur=${allDay ? '0100' : '0400'}&desc=${encodeText(description)}&in_loc=${encodeText(location)}`,
    
    apple: generateAppleCalendarLink(title, description, location, iCalStart, iCalEnd, allDay),
    
    microsoft365: `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeText(title)}&startdt=${startDateObj.toISOString()}&enddt=${endDateObj.toISOString()}&body=${encodeText(description)}&location=${encodeText(location)}`,
    
    microsoftTeams: `https://teams.microsoft.com/l/meeting/new?subject=${encodeText(title)}&startTime=${startDateObj.toISOString()}&endTime=${endDateObj.toISOString()}&content=${encodeText(description)}&location=${encodeText(location)}`,
    
    ical: generateICalFile(title, description, location, iCalStart, iCalEnd, allDay),
  };
}

/**
 * Generates Apple Calendar link (downloads .ics file)
 * startDate and endDate are strings in format YYYYMMDD (all-day) or YYYYMMDDTHHmmss (timed)
 */
function generateAppleCalendarLink(title, description, location, startDate, endDate, allDay) {
  const icsContent = generateICalFile(title, description, location, 
    startDate, endDate, allDay);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  return url;
}

/**
 * Generates iCal file content with reminder (1 day before)
 * For all-day events: startDate and endDate are strings in format YYYYMMDD
 * For timed events: startDate and endDate are strings in format YYYYMMDDTHHmmss (floating time, no timezone)
 */
function generateICalFile(title, description, location, startDate, endDate, allDay) {
  const uid = `wedding-${Date.now()}@wedding.com`;
  
  // Format current timestamp for DTSTAMP (UTC)
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}T${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}Z`;
  
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    // For all-day events, use DATE format (YYYYMMDD), for timed events use DATETIME (YYYYMMDDTHHmmss)
    allDay ? `DTSTART;VALUE=DATE:${startDate}` : `DTSTART:${startDate}`,
    allDay ? `DTEND;VALUE=DATE:${endDate}` : `DTEND:${endDate}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    // Reminder: 1 day before (P1D = Period 1 Day, -P1D means 1 day before)
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  return ics;
}

/**
 * Downloads an iCal file
 */
export function downloadICalFile(icsContent, filename = 'wedding.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

