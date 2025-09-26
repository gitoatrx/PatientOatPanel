/**
 * Utility functions for generating patient telehealth magic links
 */

export interface TelehealthLinkParams {
  followupToken: string;
  appointmentId: string;
  baseUrl?: string;
}

/**
 * Generate a patient telehealth magic link
 * @param params - The parameters for the link
 * @returns The complete telehealth session URL
 */
export function generatePatientTelehealthLink({
  followupToken,
  appointmentId,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}: TelehealthLinkParams): string {
  return `${baseUrl}/patient/telehealth/${followupToken}/${appointmentId}`;
}

/**
 * Parse a telehealth URL to extract parameters
 * @param url - The telehealth URL
 * @returns The extracted parameters or null if invalid
 */
export function parseTelehealthUrl(url: string): { followupToken: string; appointmentId: string } | null {
  const regex = /\/patient\/telehealth\/([^\/]+)\/([^\/]+)/;
  const match = url.match(regex);
  
  if (!match) {
    return null;
  }
  
  return {
    followupToken: match[1],
    appointmentId: match[2]
  };
}

/**
 * Validate telehealth URL format
 * @param url - The URL to validate
 * @returns True if the URL format is valid
 */
export function isValidTelehealthUrl(url: string): boolean {
  return parseTelehealthUrl(url) !== null;
}

// Example usage:
/*
// Generate a magic link
const magicLink = generatePatientTelehealthLink({
  followupToken: 'abc123def456',
  appointmentId: 'appt_789',
  baseUrl: 'https://yourdomain.com'
});
// Result: https://yourdomain.com/patient/telehealth/abc123def456/appt_789

// Parse a URL
const params = parseTelehealthUrl('https://yourdomain.com/patient/telehealth/abc123def456/appt_789');
// Result: { followupToken: 'abc123def456', appointmentId: 'appt_789' }
*/






