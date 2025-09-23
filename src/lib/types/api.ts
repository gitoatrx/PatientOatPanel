// API Response Types and Error Handling
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string; // For field-specific validation errors
  type: 'validation' | 'network' | 'server' | 'authentication' | 'authorization' | 'not_found' | 'rate_limit';
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  validationErrors?: ValidationError[];
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  isSubmitting: boolean;
  isRetrying: boolean;
  retryCount: number;
}

// API Request Configuration
export interface ApiRequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  showLoading?: boolean;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  skipErrorBoundary?: boolean;
}

// Patient Onboarding Specific Types - OTP verification and progress tracking

export interface OnboardingProgressResponse {
  success: boolean;
  message: string;
  data: {
    clinic_id: number;
    phone: string;
    current_step: string;
    status: string;
    otp_verified_at: string;
    state: {
      contact: {
        phone: string;
        email?: string;
      };
      health_card?: {
        health_card_number: string | null;
      };
      personal_info?: {
        first_name: string;
        last_name: string;
        gender?: string;
        date_of_birth?: string;
        email?: string;
      };
      address?: {
        address_line1: string;
        address_line2?: string | null;
        city: string;
        state_province: string;
        postal_code: string;
        country: string;
      };
      visit_type?: {
        id: number;
        name: string;
        duration: number;
      };
      emergency_contact?: {
        name: string;
        relationship: string;
        phone: string;
      };
      health_concerns?: {
        selected_ids: number[];
        selected_labels: string[];
        free_text: string[];
        followup_status?: Array<boolean | "true" | "false">;
      };
      provider?: {
        id: number;
        last_name: string;
        first_name: string;
        provider_no: string;
      };
      appointment?: {
        date: string;
        time: string;
      };
      confirmation?: {
        appointment_id: number;
        guest_patient_id: number;
      };
      otp_verified_at: string;
    };
    guest_patient_id: string | null;
    appointment_id: string | null;
  };
}

export interface HealthCardResponse {
  success: boolean;
  message: string;
  data: {
    clinic_id: number;
    phone: string;
    current_step: string;
    status: string;
    otp_verified_at: string;
    state: {
      contact: {
        phone: string;
      };
      health_card?: {
        health_card_number: string;
      };
      otp_verified_at: string;
    };
    guest_patient_id: string | null;
    appointment_id: string | null;
  };
}

export interface AddressResponse {
  success: boolean;
  message: string;
  data: {
    clinic_id: number;
    phone: string;
    current_step: string;
    status: string;
    otp_verified_at: string;
    state: {
      contact: {
        phone: string;
      };
      health_card?: {
        health_card_number: string;
      };
      personal_info?: {
        email: string;
        gender: string;
        last_name: string;
        first_name: string;
        date_of_birth: string;
      };
      address?: {
        address_line1: string;
        address_line2?: string;
        city: string;
        state_province: string;
        postal_code: string;
        country: string;
      };
      otp_verified_at: string;
    };
    guest_patient_id: string | null;
    appointment_id: string | null;
  };
}

export interface PersonalInfoStep1Response {
  success: boolean;
  message: string;
  data: {
    clinic_id: number;
    phone: string;
    current_step: string;
    status: string;
    otp_verified_at: string;
    state: {
      contact: {
        phone: string;
      };
      health_card?: {
        health_card_number: string | null;
      };
      personal_info?: {
        first_name: string;
        last_name: string;
      };
      address?: {
        address_line1: string;
        address_line2?: string;
        city: string;
        state_province: string;
        postal_code: string;
        country: string;
      };
      otp_verified_at: string;
    };
    guest_patient_id: string | null;
    appointment_id: string | null;
  };
}

export interface PersonalInfoStep2Response {
  success: boolean;
  message: string;
  data: {
    clinic_id: number;
    phone: string;
    current_step: string;
    status: string;
    otp_verified_at: string;
    state: {
      contact: {
        phone: string;
      };
      health_card?: {
        health_card_number: string | null;
      };
      personal_info?: {
        first_name: string;
        last_name: string;
        gender: string;
      };
      address?: {
        address_line1: string;
        address_line2?: string;
        city: string;
        state_province: string;
        postal_code: string;
        country: string;
      };
      otp_verified_at: string;
    };
    guest_patient_id: string | null;
    appointment_id: string | null;
  };
}

export interface PersonalInfoStep3Response {
  success: boolean;
  message: string;
  data: {
    clinic_id: number;
    phone: string;
    current_step: string;
    status: string;
    otp_verified_at: string;
    state: {
      contact: {
        phone: string;
        email?: string;
      };
      health_card?: {
        health_card_number: string | null;
      };
      personal_info?: {
        first_name: string;
        last_name: string;
        gender: string;
        date_of_birth?: string;
        email?: string;
      };
      address?: {
        address_line1: string;
        address_line2?: string;
        city: string;
        state_province: string;
        postal_code: string;
        country: string;
      };
      otp_verified_at: string;
    };
    guest_patient_id: string | null;
    appointment_id: string | null;
  };
}

export interface HealthConcern {
  id: number;
  name: string;
}

export interface HealthConcernsListResponse {
  success: boolean;
  message: string;
  data: HealthConcern[];
}

export interface VisitType {
  id: number;
  name: string;
  duration: number;
}

export interface VisitTypesListResponse {
  success: boolean;
  message: string;
  data: VisitType[];
}

export interface Provider {
  id: number;
  first_name: string;
  last_name: string;
  provider_no: string;
  specialty: string;
}

export interface ProvidersListResponse {
  success: boolean;
  message: string;
  data: Provider[];
}

export interface ProviderSelectionRequest {
  phone: string;
  clinic_id: number;
  provider_id: number;
  preferred_provider_notes?: string;
}

export interface ProviderSelectionResponse {
  success: boolean;
  message: string;
  data: {
    clinic_id: number;
    phone: string;
    current_step: string;
    status: string;
    otp_verified_at: string;
    state: {
      contact: {
        phone: string;
        email?: string;
      };
      health_card?: {
        health_card_number: string | null;
      };
      personal_info?: {
        first_name: string;
        last_name: string;
        gender: string;
        date_of_birth?: string;
        email?: string;
      };
      address?: {
        address_line1: string;
        address_line2?: string;
        city: string;
        state_province: string;
        postal_code: string;
        country: string;
      };
      visit_type?: {
        visit_type_id: number;
        visit_type_name: string;
      };
      emergency_contact?: {
        name: string;
        relationship: string;
        phone: string;
      };
      provider?: {
        provider_id: number;
        provider_name: string;
        preferred_provider_notes?: string;
      };
      otp_verified_at: string;
    };
    guest_patient_id: string | null;
    appointment_id: string | null;
  };
}

export interface VisitTypeResponse {
  success: boolean;
  message: string;
  data: {
    clinic_id: number;
    phone: string;
    current_step: string;
    status: string;
    otp_verified_at: string;
    state: {
      contact: {
        phone: string;
        email?: string;
      };
      health_card?: {
        health_card_number: string | null;
      };
      personal_info?: {
        first_name: string;
        last_name: string;
        gender: string;
        email?: string;
      };
      address?: {
        address_line1: string;
        address_line2?: string;
        city: string;
        state_province: string;
        postal_code: string;
        country: string;
      };
      visit_type?: {
        visit_type_id: number;
        visit_type_name: string;
      };
      otp_verified_at: string;
    };
    guest_patient_id: string | null;
    appointment_id: string | null;
  };
}

export interface EmergencyContactResponse {
  success: boolean;
  message: string;
  data: {
    clinic_id: number;
    phone: string;
    current_step: string;
    status: string;
    otp_verified_at: string;
    state: {
      contact: {
        phone: string;
        email?: string;
      };
      health_card?: {
        health_card_number: string | null;
      };
      personal_info?: {
        first_name: string;
        last_name: string;
        gender: string;
        email?: string;
      };
      address?: {
        address_line1: string;
        address_line2?: string;
        city: string;
        state_province: string;
        postal_code: string;
        country: string;
      };
      visit_type?: {
        visit_type_id: number;
        visit_type_name: string;
      };
      emergency_contact?: {
        name: string;
        relationship: string;
        phone: string;
      };
      otp_verified_at: string;
    };
    guest_patient_id: string | null;
    appointment_id: string | null;
  };
}

export interface PersonalInfoStep4Response {
  success: boolean;
  message: string;
  data: {
    clinic_id: number;
    phone: string;
    current_step: string;
    status: string;
    otp_verified_at: string;
    state: {
      contact: {
        phone: string;
        email?: string;
      };
      health_card?: {
        health_card_number: string | null;
      };
      personal_info?: {
        first_name: string;
        last_name: string;
        gender: string;
        email?: string;
      };
      address?: {
        address_line1: string;
        address_line2?: string;
        city: string;
        state_province: string;
        postal_code: string;
        country: string;
      };
      otp_verified_at: string;
    };
    guest_patient_id: string | null;
    appointment_id: string | null;
  };
}

export interface OtpVerificationResponse {
  success: boolean;
  message: string;
  data: {
    clinic_id: number;
    phone: string;
    current_step: string;
    status: string;
    otp_verified_at: string;
    state: {
      contact: {
        phone: string;
      };
      otp_verified_at: string;
    };
    guest_patient_id: string | null;
    appointment_id: string | null;
  };
}

// Available Slots Types
export interface AvailableDate {
  date: string;
  formatted_date: string;
  day_name: string;
  day_short: string;
}

export interface AvailableSlotsResponse {
  success: boolean;
  message: string;
  data: AvailableDate[];
}

// Available Time Slots Types
export interface AvailableTimeSlot {
  time: string; // Raw time format (e.g., "09:30")
  label: string; // User-friendly format (e.g., "9:30 AM")
}

export interface AvailableTimeSlotsResponse {
  success: boolean;
  message: string;
  data: AvailableTimeSlot[];
}

// Follow-up Questions Types
export interface FollowupQuestion {
  id: string;
  hint: string | null;
  text: string;
  type: 'single_select' | 'multiple_select' | 'text' | 'number' | 'date' | 'boolean';
  source: string;
  options: string[];
  asked_at: string;
  priority: number;
  red_flag: boolean;
}

// Error Types for Different Scenarios
export const API_ERROR_TYPES = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  SERVER: 'server',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  RATE_LIMIT: 'rate_limit'
} as const;

export type ApiErrorType = typeof API_ERROR_TYPES[keyof typeof API_ERROR_TYPES];
