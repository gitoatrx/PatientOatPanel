import { apiClient } from './apiClient';
import { ApiResponse, OtpVerificationResponse, OnboardingProgressResponse, HealthCardResponse, AddressResponse, PersonalInfoStep1Response, PersonalInfoStep2Response, PersonalInfoStep4Response, VisitTypeResponse, EmergencyContactResponse, HealthConcernsListResponse } from '@/lib/types/api';
import { API_CONFIG } from '@/lib/config/api';

export type PatientRole = "patient";

// All interfaces removed - only using OTP functionality now

export const patientService = {
  // Only OTP methods remain - all other API methods removed

  // OTP Management - Real API Integration
  async sendOtp(phone: string): Promise<ApiResponse<{ message: string; otpCode?: string }>> {
    try {
      console.log('Sending OTP to phone:', phone);
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.SEND_OTP, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Don't show success toast for OTP sending
      });
      
      console.log('OTP send response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to send OTP:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        error: {
          code: 'OTP_SEND_FAILED',
          message: error instanceof Error ? error.message : 'Failed to send OTP',
          type: 'network',
        },
        message: 'Failed to send verification code. Please try again.',
      };
    }
  },

  // OTP Verification - Real API Integration
  async verifyOtp(phone: string, code: string): Promise<OtpVerificationResponse> {
    try {
      console.log('Verifying OTP for phone:', phone, 'with code:', code);
      
      const response = await apiClient.post<OtpVerificationResponse>(API_CONFIG.ENDPOINTS.VERIFY_OTP, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        code: code,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });
      
      console.log('OTP verification response:', response);
      
      // The API client returns the raw Axios response
      // response.data contains the actual API response
      return response.data;
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify OTP',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: phone,
          current_step: 'verify_otp',
          status: 'error',
          otp_verified_at: '',
          state: {
            contact: { phone: phone },
            otp_verified_at: '',
          },
          guest_patient_id: null,
          appointment_id: null,
        },
      };
    }
  },

  // Onboarding Progress - Real API Integration
  async getOnboardingProgress(phone: string): Promise<OnboardingProgressResponse> {
    try {
      console.log('Getting onboarding progress for phone:', phone);
      
      const response = await apiClient.get<OnboardingProgressResponse>(
        `${API_CONFIG.ENDPOINTS.ONBOARDING_PROGRESS}?clinic_id=${API_CONFIG.CLINIC_ID}&phone=${encodeURIComponent(phone)}`,
        {
          showLoading: false,
          showErrorToast: true,
          showSuccessToast: false,
        }
      );
      
      console.log('Onboarding progress response:', response);
      // The API client returns the raw Axios response
      // response.data contains the actual API response
      return response.data;
    } catch (error) {
      console.error('Failed to get onboarding progress:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get onboarding progress',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: phone,
          current_step: 'verify_otp',
          status: 'error',
          otp_verified_at: '',
          state: {
            contact: { phone: phone },
            otp_verified_at: '',
          },
          guest_patient_id: null,
          appointment_id: null,
        },
      };
    }
  },

  // Health Card API
  async saveHealthCard(phone: string, healthCardNumber?: string): Promise<HealthCardResponse> {
    try {
      console.log('Saving health card for phone:', phone, 'with number:', healthCardNumber);
      
      const response = await apiClient.post<HealthCardResponse>(API_CONFIG.ENDPOINTS.HEALTH_CARD, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        health_card_number: healthCardNumber || '', // Send empty string if no health card
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });
      
      console.log('Health card save response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to save health card:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save health card',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: phone,
          current_step: 'health_card',
          status: 'error',
          otp_verified_at: '',
          state: {
            contact: { phone: phone },
            otp_verified_at: '',
          },
          guest_patient_id: null,
          appointment_id: null,
        },
      };
    }
  },

  // Address API
  async saveAddress(phone: string, addressData: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state_province: string;
    postal_code: string;
    country: string;
  }): Promise<AddressResponse> {
    try {
      console.log('Saving address for phone:', phone, 'with data:', addressData);
      
      const response = await apiClient.post<AddressResponse>(API_CONFIG.ENDPOINTS.ADDRESS, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...addressData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });
      
      console.log('Address save response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to save address:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save address',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: phone,
          current_step: 'address',
          status: 'error',
          otp_verified_at: '',
          state: {
            contact: { phone: phone },
            otp_verified_at: '',
          },
          guest_patient_id: null,
          appointment_id: null,
        },
      };
    }
  },

  // Personal Info Step 1 API
  async savePersonalInfoStep1(phone: string, personalData: {
    first_name: string;
    last_name: string;
  }): Promise<PersonalInfoStep1Response> {
    try {
      console.log('Saving personal info step 1 for phone:', phone, 'with data:', personalData);
      
      const response = await apiClient.post<PersonalInfoStep1Response>(API_CONFIG.ENDPOINTS.PERSONAL_INFO_STEP1, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...personalData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });
      
      console.log('Personal info step 1 save response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to save personal info step 1:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save personal information',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: phone,
          current_step: 'personal_info_step1',
          status: 'error',
          otp_verified_at: '',
          state: {
            contact: { phone: phone },
            otp_verified_at: '',
          },
          guest_patient_id: null,
          appointment_id: null,
        },
      };
    }
  },

  // Personal Info Step 2 API
  async savePersonalInfoStep2(phone: string, genderData: {
    gender: string;
  }): Promise<PersonalInfoStep2Response> {
    try {
      console.log('Saving personal info step 2 for phone:', phone, 'with data:', genderData);
      
      const response = await apiClient.post<PersonalInfoStep2Response>(API_CONFIG.ENDPOINTS.PERSONAL_INFO_STEP2, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...genderData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });
      
      console.log('Personal info step 2 save response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to save personal info step 2:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save gender information',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: phone,
          current_step: 'personal_info_step2',
          status: 'error',
          otp_verified_at: '',
          state: {
            contact: { phone: phone },
            otp_verified_at: '',
          },
          guest_patient_id: null,
          appointment_id: null,
        },
      };
    }
  },

  // Personal Info Step 4 API (Email)
  async savePersonalInfoStep4(phone: string, emailData: {
    email: string;
  }): Promise<PersonalInfoStep4Response> {
    try {
      console.log('Saving personal info step 4 for phone:', phone, 'with data:', emailData);
      
      const response = await apiClient.post<PersonalInfoStep4Response>(API_CONFIG.ENDPOINTS.PERSONAL_INFO_STEP4, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...emailData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });
      
      console.log('Personal info step 4 save response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to save personal info step 4:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save email information',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: phone,
          current_step: 'personal_info_step4',
          status: 'error',
          otp_verified_at: '',
          state: {
            contact: { phone: phone },
            otp_verified_at: '',
          },
          guest_patient_id: null,
          appointment_id: null,
        },
      };
    }
  },

  // Visit Type API
  async saveVisitType(phone: string, visitTypeData: {
    visit_type_id: number;
  }): Promise<VisitTypeResponse> {
    try {
      console.log('Saving visit type for phone:', phone, 'with data:', visitTypeData);
      
      const response = await apiClient.post<VisitTypeResponse>(API_CONFIG.ENDPOINTS.VISIT_TYPE, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...visitTypeData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });
      
      console.log('Visit type save response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to save visit type:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save visit type information',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: phone,
          current_step: 'visit_type',
          status: 'error',
          otp_verified_at: '',
          state: {
            contact: { phone: phone },
            otp_verified_at: '',
          },
          guest_patient_id: null,
          appointment_id: null,
        },
      };
    }
  },

  // Emergency Contact API
  async saveEmergencyContact(phone: string, emergencyContactData: {
    name: string;
    relationship: string;
    emergency_phone: string;
  }): Promise<EmergencyContactResponse> {
    try {
      console.log('Saving emergency contact for phone:', phone, 'with data:', emergencyContactData);
      
      const response = await apiClient.post<EmergencyContactResponse>(API_CONFIG.ENDPOINTS.EMERGENCY_CONTACT, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...emergencyContactData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });
      
      console.log('Emergency contact save response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to save emergency contact:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save emergency contact information',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: phone,
          current_step: 'emergency_contact',
          status: 'error',
          otp_verified_at: '',
          state: {
            contact: { phone: phone },
            otp_verified_at: '',
          },
          guest_patient_id: null,
          appointment_id: null,
        },
      };
    }
  },

  // Health Concerns List API
  async getHealthConcernsList(): Promise<HealthConcernsListResponse> {
    try {
      console.log('Fetching health concerns list for clinic:', API_CONFIG.CLINIC_ID);
      
      const response = await apiClient.get<HealthConcernsListResponse>(
        `${API_CONFIG.ENDPOINTS.HEALTH_CONCERNS_LIST}?clinic_id=${API_CONFIG.CLINIC_ID}`,
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );
      
      console.log('Health concerns list response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch health concerns list:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch health concerns list',
        data: [],
      };
    }
  },
};
