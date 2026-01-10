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
  const startDateObj = new Date(startDate);
  if (!allDay && startTime) {
    const timeMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      startDateObj.setHours(hours, minutes, 0, 0);
    }
  }

  const endDateObj = new Date(startDate);
  if (!allDay && endTime) {
    const timeMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      endDateObj.setHours(hours, minutes, 0, 0);
    }
  }

  // Helper function for formatting dates in generateCalendarLinks scope
  function formatICalDateUTCForLinks(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  const iCalStart = formatICalDateUTCForLinks(startDateObj);
  const iCalEnd = formatICalDateUTCForLinks(endDateObj);

  // Note: Google Calendar URL doesn't support reminders directly
  // Both Apple and Google Calendar now use iCal file download which includes reminder (1 day before)
  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeText(title)}&dates=${startDateTime}/${endDateTime}&details=${encodeText(description)}&location=${encodeText(location)}`,
    
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeText(title)}&startdt=${startDateObj.toISOString()}&enddt=${endDateObj.toISOString()}&body=${encodeText(description)}&location=${encodeText(location)}`,
    
    yahoo: `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeText(title)}&st=${startDateTime}&dur=${allDay ? '0100' : '0400'}&desc=${encodeText(description)}&in_loc=${encodeText(location)}`,
    
    apple: generateAppleCalendarLink(title, description, location, startDateObj, endDateObj),
    
    microsoft365: `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeText(title)}&startdt=${startDateObj.toISOString()}&enddt=${endDateObj.toISOString()}&body=${encodeText(description)}&location=${encodeText(location)}`,
    
    microsoftTeams: `https://teams.microsoft.com/l/meeting/new?subject=${encodeText(title)}&startTime=${startDateObj.toISOString()}&endTime=${endDateObj.toISOString()}&content=${encodeText(description)}&location=${encodeText(location)}`,
    
    ical: generateICalFile(title, description, location, iCalStart, iCalEnd, allDay),
  };
}

/**
 * Formats date for iCal (UTC)
 */
function formatICalDateUTC(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generates Apple Calendar link (downloads .ics file)
 */
function generateAppleCalendarLink(title, description, location, startDate, endDate) {
  const icsContent = generateICalFile(title, description, location, 
    formatICalDateUTC(startDate), formatICalDateUTC(endDate), false);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  return url;
}

/**
 * Generates iCal file content with reminder (1 day before)
 */
function generateICalFile(title, description, location, startDate, endDate, allDay) {
  const uid = `wedding-${Date.now()}@wedding.com`;
  const formatDateForICal = (date) => {
    if (typeof date === 'string') return date;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateForICal(new Date())}`,
    `DTSTART:${allDay ? formatDate(new Date(startDate)) : startDate}`,
    `DTEND:${allDay ? formatDate(new Date(endDate)) : endDate}`,
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

