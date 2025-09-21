// Country Code Configuration
// Development uses +91 (India), Production uses +1 (Canada/US)

export const COUNTRY_CODE_CONFIG = {
  // Development environment - India
  DEVELOPMENT: {
    CODE: '+91',
    NAME: 'India',
    DESCRIPTION: 'Development environment - India country code'
  },

  // Production environment - Canada/US
  PRODUCTION: {
    CODE: '+1',
    NAME: 'Canada/US',
    DESCRIPTION: 'Production environment - Canada/US country code'
  }
} as const;

// Get the appropriate country code based on environment
export const getCountryCode = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? COUNTRY_CODE_CONFIG.DEVELOPMENT.CODE : COUNTRY_CODE_CONFIG.PRODUCTION.CODE;
};

// Get country code info for display purposes
export const getCountryCodeInfo = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? COUNTRY_CODE_CONFIG.DEVELOPMENT : COUNTRY_CODE_CONFIG.PRODUCTION;
};

// Format phone number with appropriate country code
export const formatPhoneWithCountryCode = (phoneNumber: string): string => {
  const countryCode = getCountryCode();

  // Remove any existing formatting and country codes
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  // If it already has a country code, use as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }

  // Remove leading 1 if present (for North American numbers)
  let cleanDigits = digitsOnly;
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    cleanDigits = digitsOnly.substring(1);
  }

  // Add the appropriate country code
  return `${countryCode}${cleanDigits}`;
};

// Get placeholder text based on environment
export const getPhonePlaceholder = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? '(98765) 43210' : '(604) 123-4567';
};

// Get helper text based on environment
export const getPhoneHelperText = (): string => {
  const countryInfo = getCountryCodeInfo();
  return `Enter your ${countryInfo.NAME} phone number (will be formatted as ${countryInfo.CODE})`;
};

// Ensure phone number from localStorage is properly formatted
export const getFormattedPhoneFromStorage = (): string | null => {
  try {
    const phoneFromStorage = localStorage.getItem('patient-phone-number');
    if (!phoneFromStorage) return null;

    // If it's already properly formatted with country code, return as is
    if (phoneFromStorage.startsWith('+')) {
      return phoneFromStorage;
    }

    // Otherwise, format it with the appropriate country code
    return formatPhoneWithCountryCode(phoneFromStorage);
  } catch (error) {
    console.error('Error getting phone from storage:', error);
    return null;
  }
};
