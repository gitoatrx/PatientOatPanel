/**
 * Phone number utility functions
 */

/**
 * Formats a phone number with country code
 * @param phone - The phone number to format
 * @returns The formatted phone number with country code
 */
export function formatPhoneWithCountryCode(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If the phone number already starts with a country code, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // If the phone number is 10 digits, assume it's US/Canada and add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If the phone number is 11 digits and starts with 1, add + prefix
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // For other cases, return the cleaned number with + prefix
  return `+${cleaned}`;
}

/**
 * Validates if a phone number is in a valid format
 * @param phone - The phone number to validate
 * @returns True if the phone number is valid, false otherwise
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (10-15 digits is typical for international numbers)
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Formats a phone number for display (e.g., +1 (555) 123-4567)
 * @param phone - The phone number to format
 * @returns The formatted phone number for display
 */
export function formatPhoneForDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  // US/Canada format: +1 (555) 123-4567
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // 10-digit US/Canada format: (555) 123-4567
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // For other formats, return with + prefix if not already present
  return phone.startsWith('+') ? phone : `+${cleaned}`;
}

/**
 * Masks a phone number showing only the last 2 digits for privacy
 * @param phone - The phone number to mask
 * @returns The masked phone number (e.g., +1 (***) ***-**67)
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  // US/Canada format: +1 (***) ***-**67
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const lastTwo = cleaned.slice(-2);
    return `+1 (***) ***-**${lastTwo}`;
  }
  
  // 10-digit US/Canada format: (***) ***-**67
  if (cleaned.length === 10) {
    const lastTwo = cleaned.slice(-2);
    return `(***) ***-**${lastTwo}`;
  }
  
  // For other formats, mask all but last 2 digits
  if (cleaned.length > 2) {
    const lastTwo = cleaned.slice(-2);
    const masked = '*'.repeat(cleaned.length - 2);
    return phone.startsWith('+') ? `+${masked}${lastTwo}` : `${masked}${lastTwo}`;
  }
  
  // If too short, return as is
  return phone;
}
