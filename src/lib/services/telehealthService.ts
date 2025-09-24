import { apiClient } from './apiClient';
import { ApiResponse } from '@/lib/types/api';
import { getTelehealthPatientSessionUrl } from '@/lib/config/api';

export interface TelehealthPatientSessionData {
  appointment_id: number;
  vonage_session_id: string;
  token: string;
  application_id: string;
}

export const telehealthService = {
  async getPatientVideoSession(appointmentId: string, followupToken: string): Promise<ApiResponse<TelehealthPatientSessionData>> {
    const endpoint = getTelehealthPatientSessionUrl({ appointmentId, token: followupToken });

    try {
      const response = await apiClient.get<ApiResponse<TelehealthPatientSessionData>>(endpoint, {
        showLoading: false,
        showErrorToast: false,
        showSuccessToast: false,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch telehealth session:', error);
      throw error;
    }
  },
};
