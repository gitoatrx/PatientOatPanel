import { apiClient } from './apiClient';
import { ApiResponse, OtpVerificationResponse, OnboardingProgressResponse, HealthCardResponse, PhoneUpdateResponse, AddressResponse, PersonalInfoStep1Response, PersonalInfoStep2Response, PersonalInfoStep3Response, PersonalInfoStep4Response, VisitType, VisitTypesListResponse, VisitTypeResponse, EmergencyContactResponse, FulfillmentResponse, HealthConcernsListResponse, Provider, ProvidersListResponse, ProviderSelectionRequest, ProviderSelectionResponse, AvailableSlotsResponse, AvailableTimeSlotsResponse, FollowupQuestion, AppointmentStateResponse, ClinicInfoResponse, ConfirmAppointmentResponse, PaymentSessionResponse, OnboardingReturningPatientDecision } from '@/lib/types/api';
import { API_CONFIG, getFollowupQuestionsUrl, getFollowupAnswersUrl, getAppointmentStatePatientUrl } from '@/lib/config/api';

export type PatientRole = "patient";

// All interfaces removed - only using OTP functionality now

export const patientService = {
  // Clinic Information API
  async getClinicInfo(clinicId: number = API_CONFIG.CLINIC_ID): Promise<ClinicInfoResponse> {
    try {
      const response = await apiClient.get<ClinicInfoResponse>(
        `${API_CONFIG.ENDPOINTS.CLINIC_INFO}/${clinicId}`,
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      return response.data;
    } catch (error) {
      // Return a structured error response instead of throwing
      return {
        success: false,
        clinic: {
          id: clinicId,
          name: 'Clinic',
          email: '',
          phone: '',
          address: '',
          city: '',
          province: '',
          postal_code: '',
          country: '',
          logo: '',
        },
      };
    }
  },

  // OTP Management - Real API Integration
  async sendOtp(phone: string): Promise<ApiResponse<{ message: string; otpCode?: string }>> {
    try {

      const response = await apiClient.post(API_CONFIG.ENDPOINTS.SEND_OTP, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Don't show success toast for OTP sending
      });

      return response.data as ApiResponse<{ message: string; otpCode?: string }>;
    } catch (error) {

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

      const response = await apiClient.post<OtpVerificationResponse>(API_CONFIG.ENDPOINTS.VERIFY_OTP, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        code: code,
      }, {
        showLoading: true,
        showErrorToast: false,
        showSuccessToast: false, // Success is handled by navigation
      });

      // The API client returns the raw Axios response
      // response.data contains the actual API response
      return response.data;
    } catch (error) {

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

      const response = await apiClient.get<OnboardingProgressResponse>(
        `${API_CONFIG.ENDPOINTS.ONBOARDING_PROGRESS}?clinic_id=${API_CONFIG.CLINIC_ID}&phone=${encodeURIComponent(phone)}`,
        {
          showLoading: false,
          showErrorToast: true,
          showSuccessToast: false,
        }
      );

      // The API client returns the raw Axios response
      // response.data contains the actual API response
      return response.data;
    } catch (error) {

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
          patient_id: null,
          guest_patient_id: null,
          appointment_id: null,
        },
      };
    }
  },

  // Health Card API
  async saveHealthCard(phone: string, healthCardNumber?: string, updatePrimaryPhone?: boolean, emailAddress?: string): Promise<HealthCardResponse> {
    try {

      // Build payload conditionally - only include health_card_number if user has one
      const payload: Record<string, unknown> = {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
      };

      // Only include health_card_number if it's not empty
      if (healthCardNumber && healthCardNumber.trim() !== "") {
        payload.health_card_number = healthCardNumber;
      }

      // Only include email if it's not empty
      if (emailAddress && emailAddress.trim() !== "") {
        payload.email = emailAddress;
      }

      // Include update_primary_phone flag if provided (for phone update flow)
      if (updatePrimaryPhone !== undefined) {
        payload.update_primary_phone = updatePrimaryPhone;
      }

      const response = await apiClient.post<HealthCardResponse>(API_CONFIG.ENDPOINTS.HEALTH_CARD, payload, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });

      return response.data;
    } catch (error) {

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
          patient_id: null,
          appointment_id: null,
        },
      };
    }
  },

  // Phone Update API
  async updatePhone(oldPhone: string, newPhone: string): Promise<PhoneUpdateResponse> {
    try {
      const payload = {
        clinic_id: API_CONFIG.CLINIC_ID,
        old_phone: oldPhone,
        new_phone: newPhone,
      };

      const response = await apiClient.post<PhoneUpdateResponse>(API_CONFIG.ENDPOINTS.UPDATE_PHONE, payload, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });

      return response.data;
    } catch (error) {
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update phone number',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: newPhone,
          current_step: 'health_card',
          status: 'error',
          otp_verified_at: '',
          state: {
            contact: { phone: newPhone },
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

      const response = await apiClient.post<AddressResponse>(API_CONFIG.ENDPOINTS.ADDRESS, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...addressData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });

      return response.data;
    } catch (error) {

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

      const response = await apiClient.post<PersonalInfoStep1Response>(API_CONFIG.ENDPOINTS.PERSONAL_INFO_STEP1, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...personalData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });

      return response.data;
    } catch (error) {

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

      const response = await apiClient.post<PersonalInfoStep2Response>(API_CONFIG.ENDPOINTS.PERSONAL_INFO_STEP2, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...genderData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });

      return response.data;
    } catch (error) {

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

      const response = await apiClient.post<PersonalInfoStep3Response>(API_CONFIG.ENDPOINTS.PERSONAL_INFO_STEP3, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...dateOfBirthData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });

      return response.data;
    } catch (error) {

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

      const response = await apiClient.post<PersonalInfoStep4Response>(API_CONFIG.ENDPOINTS.PERSONAL_INFO_STEP4, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...emailData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });

      return response.data;
    } catch (error) {

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

      const response = await apiClient.post<VisitTypeResponse>(API_CONFIG.ENDPOINTS.VISIT_TYPE, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...visitTypeData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });

      return response.data;
    } catch (error) {

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

      const response = await apiClient.post<EmergencyContactResponse>(API_CONFIG.ENDPOINTS.EMERGENCY_CONTACT, {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...emergencyContactData,
      }, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });

      return response.data;
    } catch (error) {

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

  // Fulfillment API
  async saveFulfillment(phone: string, fulfillmentData: {
    method: 'pickup' | 'delivery';
    pharmacy_id?: number;
  }, decisionAction?: 'start_new' | 'manage' | 'reschedule'): Promise<FulfillmentResponse> {
    try {
      const payload: Record<string, unknown> = {
        clinic_id: API_CONFIG.CLINIC_ID,
        phone: phone,
        ...fulfillmentData,
      };

      // Add optional telemetry field
      if (decisionAction) {
        payload.decision_action = decisionAction;
      }

      const response = await apiClient.post<FulfillmentResponse>(API_CONFIG.ENDPOINTS.FULFILLMENT, payload, {
        showLoading: true,
        showErrorToast: true,
        showSuccessToast: false, // Success is handled by navigation
      });

      return response.data;
    } catch (error) {

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save fulfillment preference',
        data: {
          clinic_id: API_CONFIG.CLINIC_ID,
          phone: phone,
          current_step: 'fulfillment',
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

      const response = await apiClient.get<HealthConcernsListResponse>(
        `${API_CONFIG.ENDPOINTS.HEALTH_CONCERNS_LIST}?clinic_id=${API_CONFIG.CLINIC_ID}`,
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      return response.data;
    } catch (error) {

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

      const response = await apiClient.get<VisitTypesListResponse>(
        `${API_CONFIG.ENDPOINTS.VISIT_TYPES_LIST}?clinic_id=${API_CONFIG.CLINIC_ID}`,
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      return response.data;
    } catch (error) {

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

      return response.data;
    } catch (error) {

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

      return response.data;
    } catch (error) {

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

      const response = await apiClient.get<AvailableSlotsResponse>(
        `${API_CONFIG.ENDPOINTS.AVAILABLE_SLOTS_PROVIDER}?clinic_id=${API_CONFIG.CLINIC_ID}&provider_id=${providerId}`,
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      return response.data;
    } catch (error) {

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

      const response = await apiClient.get<AvailableTimeSlotsResponse>(
        `${API_CONFIG.ENDPOINTS.AVAILABLE_SLOTS}?clinic_id=${API_CONFIG.CLINIC_ID}&provider_id=${providerId}&date=${date}`,
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      return response.data;
    } catch (error) {

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

      return response.data;
    } catch (error) {

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

      return response.data;
    } catch (error) {

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save appointment',
        data: { current_step: 'appointment' },
      };
    }
  },

  // Confirm Appointment API
  async confirmAppointment(phone: string, decisionAction?: 'start_new' | 'manage' | 'reschedule'): Promise<ConfirmAppointmentResponse> {
    try {
      const payload: Record<string, unknown> = {
        phone,
        clinic_id: API_CONFIG.CLINIC_ID,
      };

      // Add optional telemetry field
      if (decisionAction) {
        payload.decision_action = decisionAction;
      }

      const response = await apiClient.post<ConfirmAppointmentResponse>(
        API_CONFIG.ENDPOINTS.CONFIRM_APPOINTMENT,
        payload,
        {
          showLoading: true,
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      return response.data;
    } catch (error: unknown) {
      // Handle 409 conflict responses
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string; returning_patient_decision?: OnboardingReturningPatientDecision } } };
        if (axiosError.response?.status === 409) {
          return {
            success: false,
            message: axiosError.response.data?.message || 'Appointment conflict detected',
            returning_patient_decision: axiosError.response.data?.returning_patient_decision,
          };
        }
      }

      // Return a structured error response for other errors
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

      return response.data;
    } catch (error) {

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

      const response = await apiClient.get<ApiResponse<{ questions: FollowupQuestion[] }>>(
        getFollowupQuestionsUrl(clinicId, appointmentId, token),
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      return response.data;
    } catch (error) {

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

      const response = await apiClient.post<ApiResponse<{ saved: boolean; answers: Record<string, { value: string; updated_at: string }> }>>(
        getFollowupAnswersUrl(clinicId, appointmentId, token),
        payload,
        {
          showLoading: true,
          showErrorToast: true,
          showSuccessToast: true,
        }
      );

      return response.data;
    } catch (error) {

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save follow-up answers',
        data: { saved: false, answers: {} },
      };
    }
  },

  // Get Appointment State Snapshot API
  async getAppointmentState(appointmentId: string, token: string): Promise<AppointmentStateResponse> {
    try {

      const response = await apiClient.get<AppointmentStateResponse>(
        getAppointmentStatePatientUrl(appointmentId, token),
        {
          showLoading: false, // Don't show loading for this background fetch
          showErrorToast: false, // Handle errors in component
          showSuccessToast: false,
        }
      );

      return response.data;
    } catch (error) {

      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get appointment state',
        data: {
          id: 0,
          is_no_show: false,
          no_show_since: null,
          no_show_action: null,
          is_waiting: false,
          waiting_since: null,
          is_with_doctor: false,
          with_doctor_since: null,
          is_completed: false,
          completed_since: null,
          scheduled_for: '',
          status: 'unknown',
          appointment: {
            id: 0,
            clinic_id: 0,
            patient_id: 0,
            doctor_id: 0,
            visit_type_name: '',
            visit_type_duration: 0,
            visit_type_is_video_call: false,
            payer_type: '',
            visit_reason: '',
            message_to_moa: null,
            concerns: [],
            join_call: false,
            join_call_at: null,
            scheduled_for: '',
            created_at: '',
            updated_at: '',
          },
          doctor: {
            id: 0,
            first_name: '',
            last_name: '',
            full_name: '',
            email: '',
            phone: '',
          },
          patient: {
            id: 0,
            first_name: '',
            last_name: '',
            full_name: '',
            phone: '',
            phn: '',
            patient_type: '',
          },
        },
      };
    }
  },

  // Get Payment Session API
  async getPaymentSession(sessionId: string): Promise<PaymentSessionResponse> {
    try {
      const response = await apiClient.get<PaymentSessionResponse>(
        `${API_CONFIG.ENDPOINTS.PAYMENT_SESSION}/${sessionId}`,
        {
          showLoading: true,
          showErrorToast: true,
          showSuccessToast: false,
        }
      );

      return response.data;
    } catch (error) {
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch payment session',
        data: {
          stripe: {
            checkout_session_id: sessionId,
            payment_intent_id: '',
            status: 'unknown',
          },
          payment: {
            id: 0,
            amount: '0.00',
            status: 'unknown',
          },
          patient: {
            id: 0,
            first_name: '',
            last_name: '',
            phone: '',
            phn: '',
          },
          appointment: {
            id: 0,
            date_and_time: '',
            status: 'unknown',
            visit_type_name: '',
            visit_type_duration: 0,
            doctor: {
              id: 0,
              first_name: '',
              last_name: '',
            },
          },
        },
      };
    }
  },
};
