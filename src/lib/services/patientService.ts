import { apiClient } from './apiClient';
import { ApiResponse, OtpVerificationResponse, OnboardingProgressResponse, HealthCardResponse, AddressResponse, PersonalInfoStep1Response, PersonalInfoStep2Response, PersonalInfoStep3Response, PersonalInfoStep4Response, VisitType, VisitTypesListResponse, VisitTypeResponse, EmergencyContactResponse, HealthConcernsListResponse, Provider, ProvidersListResponse, ProviderSelectionRequest, ProviderSelectionResponse, AvailableSlotsResponse, AvailableTimeSlotsResponse, FollowupQuestion } from '@/lib/types/api';
import { API_CONFIG, getFollowupQuestionsUrl, getFollowupAnswersUrl } from '@/lib/config/api';

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
      return response.data as ApiResponse<{ message: string; otpCode?: string }>;
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

      // Build payload conditionally - only include health_card_number if user has one
      const payload: Record<string, unknown> = {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
      };

      // Only include health_card_number if it's not empty
      if (healthCardNumber && healthCardNumber.trim() !== "") {
        payload.health_card_number = healthCardNumber;
      }

      console.log('Health card API payload:', payload);
      console.log('health_card_number included:', 'health_card_number' in payload);
      if ('health_card_number' in payload) {
        console.log('health_card_number type:', typeof payload.health_card_number);
        console.log('health_card_number value:', payload.health_card_number);
      }

      const response = await apiClient.post<HealthCardResponse>(API_CONFIG.ENDPOINTS.HEALTH_CARD, payload, {
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

  // Personal Info Step 3 API (Date of Birth)
  async savePersonalInfoStep3(phone: string, dateOfBirthData: {
    date_of_birth: string;
  }): Promise<PersonalInfoStep3Response> {
    try {
      console.log('Saving personal info step 3 for phone:', phone, 'with data:', dateOfBirthData);

      const response = await apiClient.post<PersonalInfoStep3Response>(API_CONFIG.ENDPOINTS.PERSONAL_INFO_STEP3, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...dateOfBirthData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });

      console.log('Personal info step 3 save response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to save personal info step 3:', error);

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save date of birth',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: phone,
          current_step: 'personal_info_step3',
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

  async getVisitTypesList(): Promise<VisitTypesListResponse> {
    try {
      console.log('Fetching visit types list for clinic:', API_CONFIG.CLINIC_ID);

      const response = await apiClient.get<VisitTypesListResponse>(
        `${API_CONFIG.ENDPOINTS.VISIT_TYPES_LIST}?clinic_id=${API_CONFIG.CLINIC_ID}`,
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      console.log('Visit types list response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch visit types list:', error);

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch visit types list',
        data: [],
      };
    }
  },

  async getProvidersList(search?: string, visitName?: string): Promise<ProvidersListResponse> {
    try {
      console.log('Fetching providers list for clinic:', API_CONFIG.CLINIC_ID, 'with search:', search, 'and visit_name:', visitName);

      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const visitNameParam = visitName ? `&visit_name=${encodeURIComponent(visitName)}` : '';
      const response = await apiClient.get<ProvidersListResponse>(
        `${API_CONFIG.ENDPOINTS.PROVIDERS_LIST}?clinic_id=${API_CONFIG.CLINIC_ID}${searchParam}${visitNameParam}`,
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      console.log('Providers list response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch providers list:', error);

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch providers list',
        data: [],
      };
    }
  },

  async saveProviderSelection(phone: string, providerId: number, preferredProviderNotes?: string): Promise<ProviderSelectionResponse> {
    try {
      console.log('Saving provider selection for phone:', phone, 'provider ID:', providerId);

      const payload: ProviderSelectionRequest = {
        phone: phone,
        clinic_id: API_CONFIG.CLINIC_ID,
        provider_id: providerId,
      };

      if (preferredProviderNotes) {
        payload.preferred_provider_notes = preferredProviderNotes;
      }

      const response = await apiClient.post<ProviderSelectionResponse>(API_CONFIG.ENDPOINTS.PROVIDER_SELECTION, payload, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false,
      });

      console.log('Provider selection save response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to save provider selection:', error);

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save provider selection',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: phone,
          current_step: 'provider',
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

  // Available Slots API
  async getAvailableSlots(providerId: number): Promise<AvailableSlotsResponse> {
    try {
      console.log('Fetching available slots for provider:', providerId);

      const response = await apiClient.get<AvailableSlotsResponse>(
        `${API_CONFIG.ENDPOINTS.AVAILABLE_SLOTS_PROVIDER}?clinic_id=${API_CONFIG.CLINIC_ID}&provider_id=${providerId}`,
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      console.log('Available slots response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available slots:', error);

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch available slots',
        data: [],
      };
    }
  },

  // Available Time Slots API
  async getAvailableTimeSlots(providerId: number, date: string): Promise<AvailableTimeSlotsResponse> {
    try {
      console.log('Fetching available time slots for provider:', providerId, 'on date:', date);

      const response = await apiClient.get<AvailableTimeSlotsResponse>(
        `${API_CONFIG.ENDPOINTS.AVAILABLE_SLOTS}?clinic_id=${API_CONFIG.CLINIC_ID}&provider_id=${providerId}&date=${date}`,
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      console.log('Available time slots response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available time slots:', error);

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch available time slots',
        data: [],
      };
    }
  },

  // Save Health Concern API
  async saveHealthConcern(phone: string, healthConcernData: {
    selected_concern_ids: number[];
    other_concerns: string[];
  }): Promise<ApiResponse<{ current_step: string }>> {
    try {
      console.log('Saving health concern for phone:', phone, 'with data:', healthConcernData);

      const response = await apiClient.post<ApiResponse<{ current_step: string }>>(
        API_CONFIG.ENDPOINTS.HEALTH_CONCERN,
        {
          phone,
          clinic_id: API_CONFIG.CLINIC_ID,
          ...healthConcernData,
        },
        {
          showLoading: true,
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      console.log('Health concern save response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to save health concern:', error);

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save health concern',
        data: { current_step: 'health_concern' },
      };
    }
  },

  // Save Appointment API
  async saveAppointment(phone: string, appointmentData: {
    date: string;
    time: string;
  }): Promise<ApiResponse<{ current_step: string }>> {
    try {
      console.log('Saving appointment for phone:', phone, 'with data:', appointmentData);

      const response = await apiClient.post<ApiResponse<{ current_step: string }>>(
        API_CONFIG.ENDPOINTS.APPOINTMENT,
        {
          phone,
          clinic_id: API_CONFIG.CLINIC_ID,
          ...appointmentData,
        },
        {
          showLoading: true,
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      console.log('Appointment save response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to save appointment:', error);

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save appointment',
        data: { current_step: 'appointment' },
      };
    }
  },

  // Confirm Appointment API
  async confirmAppointment(phone: string): Promise<ApiResponse<{ appointment_id: number; confirmation_number: string }>> {
    try {
      console.log('Confirming appointment for phone:', phone);

      const response = await apiClient.post<ApiResponse<{ appointment_id: number; confirmation_number: string }>>(
        API_CONFIG.ENDPOINTS.CONFIRM_APPOINTMENT,
        {
          phone,
          clinic_id: API_CONFIG.CLINIC_ID,
        },
        {
          showLoading: true,
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      console.log('Appointment confirmation response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to confirm appointment:', error);

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to confirm appointment',
        data: { appointment_id: 0, confirmation_number: '' },
      };
    }
  },

  // Get Follow-ups Token API
  async getFollowupsToken(clinicId: number, appointmentId: number): Promise<ApiResponse<{ token: string }>> {
    try {
      console.log('Getting follow-ups token for clinic:', clinicId, 'appointment:', appointmentId);

      const response = await apiClient.post<ApiResponse<{ token: string }>>(
        API_CONFIG.ENDPOINTS.GET_FOLLOWUPS_TOKEN,
        {
          clinic_id: clinicId,
          appointment_id: appointmentId,
        },
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      console.log('Follow-ups token response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to get follow-ups token:', error);

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get follow-ups token',
        data: { token: '' },
      };
    }
  },

  // Get Follow-up Questions API
  async getFollowupQuestions(clinicId: number, appointmentId: number, token: string): Promise<ApiResponse<{ questions: FollowupQuestion[] }>> {
    try {
      console.log('Getting follow-up questions for clinic:', clinicId, 'appointment:', appointmentId, 'token:', token);

      const response = await apiClient.get<ApiResponse<{ questions: FollowupQuestion[] }>>(
        getFollowupQuestionsUrl(clinicId, appointmentId, token),
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      console.log('Follow-up questions response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to get follow-up questions:', error);

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get follow-up questions',
        data: { questions: [] },
      };
    }
  },

  // Save Follow-up Answers API
  async saveFollowupAnswers(clinicId: number, appointmentId: number, token: string, payload: { answers: Array<{ id: string; value: string }> }): Promise<ApiResponse<{ saved: boolean; answers: Record<string, { value: string; updated_at: string }> }>> {
    try {
      console.log('Saving follow-up answers for clinic:', clinicId, 'appointment:', appointmentId, 'token:', token, 'payload:', payload);

      const response = await apiClient.post<ApiResponse<{ saved: boolean; answers: Record<string, { value: string; updated_at: string }> }>>(
        getFollowupAnswersUrl(clinicId, appointmentId, token),
        payload,
        {
          showLoading: true,
          showErrorToast: true,
          showSuccessToast: true,
        }
      );

      console.log('Follow-up answers save response:', response);
      return response.data;
    } catch (error) {
      console.error('Failed to save follow-up answers:', error);

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save follow-up answers',
        data: { saved: false, answers: {} },
      };
    }
  },
};
