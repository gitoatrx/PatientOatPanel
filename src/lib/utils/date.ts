import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import {
  format,
  differenceInYears,
  differenceInMonths,
  differenceInDays,
} from "date-fns";

export const BC_TIMEZONE = "America/Vancouver";

export const toBCDate = (date: Date | string | number = new Date()) =>
  toZonedTime(date, BC_TIMEZONE);

export const fromBCDate = (date: Date | string | number) =>
  fromZonedTime(date, BC_TIMEZONE);

export const formatBCDate = (
  date: Date | string | number,
  pattern = "yyyy-MM-dd",
) => formatInTimeZone(date, BC_TIMEZONE, pattern);

/**
 * Calculates age in appropriate units (years, months, or days)
 * @param birthDate - Date of birth
 * @param today - Current date (defaults to today)
 * @returns Formatted age string
 */
const calculateAge = (birthDate: Date, today: Date = new Date()): string => {
  const years = differenceInYears(today, birthDate);

  if (years >= 1) {
    return years === 1 ? "1 year old" : `${years} years old`;
  }

  const months = differenceInMonths(today, birthDate);

  if (months >= 1) {
    return months === 1 ? "1 month old" : `${months} months old`;
  }

  const days = differenceInDays(today, birthDate);

  if (days === 0) {
    return "Less than 1 day old";
  }

  return days === 1 ? "1 day old" : `${days} days old`;
};

/**
 * Formats a date of birth with age calculation
 * @param dateOfBirth - Date of birth as Date object, string, or number
 * @returns Formatted string like "Mar 31, 1982 (43 years old)" or "Jan 15, 2024 (2 months old)"
 */
export const formatDateOfBirth = (
  dateOfBirth: Date | string | number,
): string => {
  try {
    const birthDate = new Date(dateOfBirth);

    // Check if the date is valid
    if (isNaN(birthDate.getTime())) {
      return "Invalid date";
    }

    // Format the date as "Mar 31, 1982"
    const formattedDate = format(birthDate, "MMM d, yyyy");

    // Calculate age with appropriate units
    const ageText = calculateAge(birthDate);

    return `${formattedDate} (${ageText})`;
  } catch {
    return "Invalid date";
  }
};

/**
 * Formats a date of birth with age calculation (alternative format)
 * @param dateOfBirth - Date of birth as Date object, string, or number
 * @returns Formatted string like "March 31, 1982 (43 years old)" or "January 15, 2024 (2 months old)"
 */
export const formatDateOfBirthLong = (
  dateOfBirth: Date | string | number,
): string => {
  try {
    const birthDate = new Date(dateOfBirth);

    // Check if the date is valid
    if (isNaN(birthDate.getTime())) {
      return "Invalid date";
    }

    // Format the date as "March 31, 1982"
    const formattedDate = format(birthDate, "MMMM d, yyyy");

    // Calculate age with appropriate units
    const ageText = calculateAge(birthDate);

    return `${formattedDate} (${ageText})`;
  } catch {
    return "Invalid date";
  }
};

/**
 * Formats a date in the format "23 Aug 2025"
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDateShort = (date: Date | string | number): string => {
  try {
    const dateObj = new Date(date);

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid date";
    }

    // Format as "23 Aug 2025"
    return format(dateObj, "dd MMM yyyy");
  } catch {
    return "Invalid date";
  }
};

/**
 * Formats a date of birth with age calculation in "23 Aug 2025" format
 * @param dateOfBirth - Date of birth as Date object, string, or number
 * @returns Formatted string like "23 Aug 2025 (43 years old)"
 */
export const formatDateOfBirthShort = (
  dateOfBirth: Date | string | number,
): string => {
  try {
    const birthDate = new Date(dateOfBirth);

    // Check if the date is valid
    if (isNaN(birthDate.getTime())) {
      return "Invalid date";
    }

    // Format the date as "23 Aug 2025"
    const formattedDate = format(birthDate, "dd MMM yyyy");

    // Calculate age with appropriate units
    const ageText = calculateAge(birthDate);

    return `${formattedDate} (${ageText})`;
  } catch {
    return "Invalid date";
  }
};
