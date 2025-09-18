// API Response Types and Error Handling
export interface ApiResponse<T = any> {
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
  details?: Record<string, any>;
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

export interface HealthConcern {
  id: number;
  name: string;
}

export interface HealthConcernsListResponse {
  success: boolean;
  message: string;
  data: HealthConcern[];
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
        emergency_phone: string;
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
