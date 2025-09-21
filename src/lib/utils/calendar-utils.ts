/**
 * Calendar and sharing utility functions
 */

export interface AppointmentData {
  appointment_id: number;
  doctor: { name: string };
  date: string;
  time: string;
}

/**
 * Format date and time for calendar events
 */
export const formatDateForCalendar = (dateString: string, timeString: string): Date => {
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(dateString);
    date.setHours(hours, minutes);
    return date;
  } catch {
    return new Date();
  }
};

/**
 * Format date for ICS files
 */
export const formatDateForICS = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generate ICS file content for calendar events
 */
export const generateICSContent = (appointment: AppointmentData): string => {
  const startDate = formatDateForCalendar(appointment.date, appointment.time);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes duration

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PatientOatPanel//Appointment//EN
BEGIN:VEVENT
UID:${appointment.appointment_id}@patientoatpanel.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:Appointment with ${appointment.doctor.name}
DESCRIPTION:Follow-up appointment with ${appointment.doctor.name}
LOCATION:OAT Clinic
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
};

/**
 * Generate Google Calendar URL
 */
export const generateGoogleCalendarURL = (appointment: AppointmentData): string => {
  const startDate = formatDateForCalendar(appointment.date, appointment.time);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Appointment with ${appointment.doctor.name}`,
    dates: `${formatDateForICS(startDate)}/${formatDateForICS(endDate)}`,
    details: `Follow-up appointment with ${appointment.doctor.name}`,
    location: 'OAT Clinic',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook Calendar URL
 */
export const generateOutlookCalendarURL = (appointment: AppointmentData): string => {
  const startDate = formatDateForCalendar(appointment.date, appointment.time);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: `Appointment with ${appointment.doctor.name}`,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: `Follow-up appointment with ${appointment.doctor.name}`,
    location: 'OAT Clinic',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Download ICS file
 */
export const downloadICSFile = (appointment: AppointmentData): void => {
  const icsContent = generateICSContent(appointment);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `appointment-${appointment.appointment_id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Format date for sharing
 */
export const formatDateForSharing = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

/**
 * Format time for sharing
 */
export const formatTimeForSharing = (timeString: string): string => {
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return timeString;
  }
};

/**
 * Generate share text
 */
export const generateShareText = (appointment: AppointmentData): string => {
  return `I have an appointment scheduled with ${appointment.doctor.name} on ${formatDateForSharing(appointment.date)} at ${formatTimeForSharing(appointment.time)}.`;
};

/**
 * Generate share URL
 */
export const generateShareURL = (appointment: AppointmentData): string => {
  const baseURL = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseURL}/appointment/${appointment.appointment_id}`;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Check if Web Share API is supported
 */
export const isWebShareSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'share' in navigator;
};
