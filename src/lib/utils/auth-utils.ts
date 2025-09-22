/**
 * Authentication utilities for patient onboarding
 */

export const AUTH_KEYS = {
  PHONE_NUMBER: 'patient-phone-number',
  OTP_VERIFIED: 'patient-otp-verified',
  OTP_VERIFIED_AT: 'patient-otp-verified-at',
} as const;

/**
 * Check if user is OTP verified
 */
export const isOtpVerified = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTH_KEYS.OTP_VERIFIED) === 'true';
};

/**
 * Get the phone number from localStorage
 */
export const getPhoneNumber = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_KEYS.PHONE_NUMBER);
};

/**
 * Get OTP verification timestamp
 */
export const getOtpVerifiedAt = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_KEYS.OTP_VERIFIED_AT);
};

/**
 * Logout user - clear all authentication data
 */
export const logout = (): void => {
  if (typeof window === 'undefined') return;
  
  // Clear all authentication-related localStorage items
  localStorage.removeItem(AUTH_KEYS.PHONE_NUMBER);
  localStorage.removeItem(AUTH_KEYS.OTP_VERIFIED);
  localStorage.removeItem(AUTH_KEYS.OTP_VERIFIED_AT);
  
  console.log('User logged out - all authentication data cleared');
};

/**
 * Check if user has an active session
 */
export const hasActiveSession = (): boolean => {
  return isOtpVerified() && getPhoneNumber() !== null;
};




