// API Configuration
export const API_CONFIG = {
  // Base URL for the OATRX API
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://cloud.oatrx.ca/api/v1',
  
  // Static clinic ID as requested
  CLINIC_ID: 4,
  
  // API Endpoints - OTP operations and progress tracking
  ENDPOINTS: {
    SEND_OTP: '/clinic/onboarding/send-otp',
    VERIFY_OTP: '/clinic/onboarding/verify-otp',
    ONBOARDING_PROGRESS: '/clinic/onboarding/progress',
    HEALTH_CARD: '/clinic/onboarding/health-card',
    ADDRESS: '/clinic/onboarding/address',
    PERSONAL_INFO_STEP1: '/clinic/onboarding/personal-info/step1',
    PERSONAL_INFO_STEP2: '/clinic/onboarding/personal-info/step2',
    PERSONAL_INFO_STEP3: '/clinic/onboarding/personal-info/step3',
    PERSONAL_INFO_STEP4: '/clinic/onboarding/personal-info/step4',
  VISIT_TYPE: '/clinic/onboarding/visit-type',
  VISIT_TYPES_LIST: '/clinic/onboarding/visit-types',
  PROVIDERS_LIST: '/clinic/onboarding/providers',
  PROVIDER_SELECTION: '/clinic/onboarding/provider',
  EMERGENCY_CONTACT: '/clinic/onboarding/emergency-contact',
  HEALTH_CONCERNS_LIST: '/clinic/onboarding/health-concerns/list',
  AVAILABLE_SLOTS_PROVIDER: '/clinic/onboarding/available-slots-provider',
  AVAILABLE_SLOTS: '/clinic/onboarding/available-slots',
  },
  
  // Request Configuration
  REQUEST: {
    TIMEOUT: 5000, // 5 seconds - faster error feedback
    RETRIES: 2, // Reduced retries for faster error feedback
    RETRY_DELAY: 500, // 0.5 seconds - faster retry
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    AUTHENTICATION_ERROR: 'Authentication required. Please log in.',
    AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
    NOT_FOUND_ERROR: 'The requested resource was not found.',
    RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',
  },
} as const;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get clinic-specific request body
export const getClinicRequestBody = (data: Record<string, any>) => {
  return {
    clinic_id: API_CONFIG.CLINIC_ID,
    ...data,
  };
};

// Step mapping from API response to frontend routes
export const API_STEP_TO_ROUTE_MAP: Record<string, string> = {
  'health_card': '/onboarding/patient/health-card',
  'personal_info': '/onboarding/patient/personal', // API returns 'personal_info'
  'personal_info_step1': '/onboarding/patient/personal', // API returns 'personal_info_step1'
  'personal_info_step2': '/onboarding/patient/gender', // API returns 'personal_info_step2'
  'personal_info_step3': '/onboarding/patient/date-of-birth', // API returns 'personal_info_step3'
  'personal_info_step4': '/onboarding/patient/address', // API returns 'personal_info_step4'
  'personal': '/onboarding/patient/personal', // Fallback
  'gender': '/onboarding/patient/gender',
  'date_of_birth': '/onboarding/patient/date-of-birth',
  'email': '/onboarding/patient/email',
  'address': '/onboarding/patient/address',
  'health_concerns': '/onboarding/patient/health-concern', // API returns 'health_concerns'
  'health_concern': '/onboarding/patient/health-concern', // Fallback
  'visit_type': '/onboarding/patient/visit-type',
  'emergency_contact': '/onboarding/patient/emergency-contact',
  'provider': '/onboarding/patient/doctor-selection', // API returns 'provider'
  'doctor_selection': '/onboarding/patient/doctor-selection',
  'appointment': '/onboarding/patient/appointment-datetime', // API returns 'appointment'
  'appointment_datetime': '/onboarding/patient/appointment-datetime',
  'review': '/onboarding/patient/review',
  'confirmation': '/onboarding/patient/confirmation',
};

// Helper function to get frontend route from API step
export const getRouteFromApiStep = (apiStep: string): string => {
  return API_STEP_TO_ROUTE_MAP[apiStep] || '/onboarding/patient/health-card';
};
