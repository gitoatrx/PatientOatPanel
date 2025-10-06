// API Configuration
export const API_CONFIG = {
  // Base URL for the OATRX API
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://cloud.oatrx.ca/api/v1',

  // Static clinic ID as requested
  CLINIC_ID: 4,

  // API Endpoints - OTP operations and progress tracking
  ENDPOINTS: {
    CLINIC_INFO: '/clinic/clinic-info',
    SEND_OTP: '/clinic/onboarding/send-otp',
    VERIFY_OTP: '/clinic/onboarding/verify-otp',
    ONBOARDING_PROGRESS: '/clinic/onboarding/progress',
    HEALTH_CARD: '/clinic/onboarding/health-card',
    UPDATE_PHONE: '/clinic/onboarding/update-phone',
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
    HEALTH_CONCERN: '/clinic/onboarding/health-concerns',
    APPOINTMENT: '/clinic/onboarding/appointment',
    CONFIRM_APPOINTMENT: '/clinic/onboarding/confirm',
    FULFILLMENT: '/clinic/onboarding/fulfillment',
    AVAILABLE_SLOTS_PROVIDER: '/clinic/onboarding/available-slots-provider',
    AVAILABLE_SLOTS: '/clinic/onboarding/available-slots',
    // Followup endpoints
    GET_FOLLOWUPS_TOKEN: '/clinic/get-followups-token',
    GET_FOLLOWUP_QUESTIONS: '/clinic/followups',
    SAVE_FOLLOWUP_ANSWERS: '/clinic/followups',
    TELEHEALTH_PATIENT_SESSION_BASE: '/clinic/appointments',
    // Chat endpoints
    CHAT_MESSAGES: '/clinic/appointments',
    // Waiting room endpoints
    WAITING_ROOM_PATIENT: '/clinic/appointments',
    // Video events endpoints
    VIDEO_EVENTS_PATIENT: '/clinic/appointments',
    // Appointment state snapshot endpoint
    APPOINTMENT_STATE_PATIENT: '/clinic/appointments',
  },

  // Request Configuration
  REQUEST: {
    TIMEOUT: 180000, // 180 seconds - extended timeout for complex operations
    RETRIES: 0, // Disabled retries to prevent duplicate calls
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
export const getClinicRequestBody = (data: Record<string, unknown>) => {
  return {
    clinic_id: API_CONFIG.CLINIC_ID,
    ...data,
  };
};

// Step mapping from API response to frontend routes
export const API_STEP_TO_ROUTE_MAP: Record<string, string> = {
  'health_card': '/onboarding/patient/health-card', // API returns 'health_card'
  'health-card': '/onboarding/patient/health-card', // Alternative step name
  'verify_otp': '/onboarding/patient/verify-otp', // API returns 'verify_otp'
  'personal_info_step1': '/onboarding/patient/personal', // API returns 'personal_info_step1'
  'personal_info_step2': '/onboarding/patient/gender', // API returns 'personal_info_step2'
  'personal_info_step3': '/onboarding/patient/date-of-birth', // API returns 'personal_info_step3'
  'personal_info_step4': '/onboarding/patient/email', // API returns 'personal_info_step4' - should go to email first
  'personal_info_step5': '/onboarding/patient/address', // API returns 'personal_info_step5' - should go to address after email
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
  'provider_selection': '/onboarding/patient/doctor-selection', // Alternative step name
  'appointment': '/onboarding/patient/appointment-datetime', // API returns 'appointment'
  'appointment_datetime': '/onboarding/patient/appointment-datetime', // Alternative step name
  'fulfillment': '/onboarding/patient/pharmacy', // API returns 'fulfillment'
  'review': '/onboarding/patient/review',
  'confirmation': '/onboarding/patient/confirmation',
  'completed': '/onboarding/patient/confirmation', // API returns 'completed' when onboarding is complete
};

// Helper function to get frontend route from API step
export const getRouteFromApiStep = (apiStep: string): string => {
  return API_STEP_TO_ROUTE_MAP[apiStep] || '/onboarding/patient/health-card';
};

export interface TelehealthPatientSessionUrlArgs {
  appointmentId: string;
  token: string;
}

export const getTelehealthPatientSessionUrl = ({ appointmentId, token }: TelehealthPatientSessionUrlArgs): string => {
  const safeAppointmentId = encodeURIComponent(appointmentId);
  const safeToken = encodeURIComponent(token);
  return `${API_CONFIG.ENDPOINTS.TELEHEALTH_PATIENT_SESSION_BASE}/${safeAppointmentId}/video/session/patient?token=${safeToken}`;
};

// Helper functions for followup endpoints
export const getFollowupQuestionsUrl = (clinicId: number, appointmentId: number, token: string): string => {
  return `${API_CONFIG.ENDPOINTS.GET_FOLLOWUP_QUESTIONS}/${clinicId}/${appointmentId}/${token}/questions`;
};

export const getFollowupAnswersUrl = (clinicId: number, appointmentId: number, token: string): string => {
  return `${API_CONFIG.ENDPOINTS.SAVE_FOLLOWUP_ANSWERS}/${clinicId}/${appointmentId}/${token}/answers`;
};

// Helper function for chat endpoints
export const getChatMessagesUrl = (appointmentId: string, token: string): string => {
  const safeAppointmentId = encodeURIComponent(appointmentId);
  const safeToken = encodeURIComponent(token);
  return `${API_CONFIG.ENDPOINTS.CHAT_MESSAGES}/${safeAppointmentId}/video/chat/patient?token=${safeToken}`;
};

// Helper function for waiting room endpoints
export const getWaitingRoomPatientUrl = (appointmentId: string): string => {
  const safeAppointmentId = encodeURIComponent(appointmentId);
  return `${API_CONFIG.ENDPOINTS.WAITING_ROOM_PATIENT}/${safeAppointmentId}/video/waiting-room/patient`;
};

// Helper function for video events endpoints
export const getVideoEventsPatientUrl = (appointmentId: string): string => {
  const safeAppointmentId = encodeURIComponent(appointmentId);
  return `${API_CONFIG.ENDPOINTS.VIDEO_EVENTS_PATIENT}/${safeAppointmentId}/clinic-events/patient`;
};

// Helper function for appointment state snapshot endpoint
export const getAppointmentStatePatientUrl = (appointmentId: string, token: string): string => {
  const safeAppointmentId = encodeURIComponent(appointmentId);
  const safeToken = encodeURIComponent(token);
  return `${API_CONFIG.ENDPOINTS.APPOINTMENT_STATE_PATIENT}/${safeAppointmentId}/states/patient?token=${safeToken}`;
};
