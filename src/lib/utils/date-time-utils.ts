import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import {
  addDays,
  isToday,
  isAfter,
  parseISO,
} from "date-fns";

export const BC_TIMEZONE = "America/Vancouver";

/**
 * Creates a Vancouver date from a string
 */
export const createVancouverDateFromString = (dateString: string): Date => {
  return toZonedTime(parseISO(dateString), BC_TIMEZONE);
};

/**
 * Converts a date to Vancouver timezone string
 */
export const toVancouverDateString = (date: Date): string => {
  return formatInTimeZone(date, BC_TIMEZONE, "yyyy-MM-dd");
};

/**
 * Generates available Vancouver dates - today, tomorrow, and 10 more days
 */
export const generateVancouverDates = (): Array<{ value: string; label: string; date: Date }> => {
  const dates: Array<{ value: string; label: string; date: Date }> = [];
  const today = new Date();
  
  // Generate 12 days total (today + tomorrow + 10 more)
  for (let i = 0; i < 12; i++) {
    const date = addDays(today, i);
    const vancouverDate = toZonedTime(date, BC_TIMEZONE);
    
    // Simple format: "Today", "Tomorrow", or just "20 Sep"
    const dayMonth = formatInTimeZone(vancouverDate, BC_TIMEZONE, "d MMM");
    let label: string;
    if (i === 0) {
      label = "Today";
    } else if (i === 1) {
      label = "Tomorrow";
    } else {
      label = dayMonth; // Just "20 Sep" format for other dates
    }
    
    dates.push({
      value: formatInTimeZone(vancouverDate, BC_TIMEZONE, "yyyy-MM-dd"),
      label: label,
      date: vancouverDate,
    });
  }
  
  return dates;
};

/**
 * Generates available time slots for a given date in Vancouver timezone
 */
export const generateVancouverTimeSlots = (date: Date): Array<{ value: string; label: string }> => {
  const slots: Array<{ value: string; label: string }> = [];
  
  // Check if input date is valid
  if (!date || isNaN(date.getTime())) {
    return slots;
  }
  
  const vancouverDate = toZonedTime(date, BC_TIMEZONE);
  
  // Business hours: 9 AM to 5 PM (17:00)
  const startHour = 9;
  const endHour = 17;
  
  for (let hour = startHour; hour < endHour; hour++) {
    const timeSlot = new Date(vancouverDate);
    timeSlot.setHours(hour, 0, 0, 0);
    
    // Skip past time slots for today
    if (isVancouverToday(vancouverDate) && isPastVancouverBusinessHours(timeSlot)) {
      continue;
    }
    
    slots.push({
      value: formatInTimeZone(timeSlot, BC_TIMEZONE, "HH:mm"),
      label: formatTimeForDisplay(timeSlot),
    });
  }
  
  return slots;
};

/**
 * Formats a Vancouver date for display - simple format like "18 Sep"
 */
export const formatVancouverDateForDisplay = (date: Date): string => {
  return formatInTimeZone(date, BC_TIMEZONE, "d MMM");
};

/**
 * Formats a Vancouver day for display
 */
export const formatVancouverDayForDisplay = (date: Date): string => {
  return formatInTimeZone(date, BC_TIMEZONE, "EEEE");
};

/**
 * Formats time for display
 */
export const formatTimeForDisplay = (date: Date): string => {
  // Check if date is valid
  if (!date || isNaN(date.getTime())) {
    return "Invalid time";
  }
  return formatInTimeZone(date, BC_TIMEZONE, "h:mm a");
};

/**
 * Checks if a date is today in Vancouver timezone
 */
export const isVancouverToday = (date: Date): boolean => {
  const vancouverDate = toZonedTime(date, BC_TIMEZONE);
  const vancouverToday = toZonedTime(new Date(), BC_TIMEZONE);
  
  return isToday(vancouverDate) && 
         formatInTimeZone(vancouverDate, BC_TIMEZONE, "yyyy-MM-dd") === 
         formatInTimeZone(vancouverToday, BC_TIMEZONE, "yyyy-MM-dd");
};

/**
 * Checks if a time is past Vancouver business hours
 */
export const isPastVancouverBusinessHours = (date: Date): boolean => {
  // Check if date is valid
  if (!date || isNaN(date.getTime())) {
    return false;
  }
  
  const vancouverDate = toZonedTime(date, BC_TIMEZONE);
  const vancouverNow = toZonedTime(new Date(), BC_TIMEZONE);
  
  // Business hours end at 5 PM (17:00)
  const businessEnd = new Date(vancouverDate);
  businessEnd.setHours(17, 0, 0, 0);
  
  return isAfter(vancouverNow, businessEnd);
};

/**
 * Converts a date to Vancouver timezone
 */
export const toBCDate = (date: Date | string | number = new Date()) =>
  toZonedTime(date, BC_TIMEZONE);

/**
 * Converts from Vancouver timezone to UTC
 */
export const fromBCDate = (date: Date | string | number) =>
  fromZonedTime(date, BC_TIMEZONE);

/**
 * Formats a date in Vancouver timezone
 */
export const formatBCDate = (
  date: Date | string | number,
  pattern = "yyyy-MM-dd",
) => formatInTimeZone(date, BC_TIMEZONE, pattern);
