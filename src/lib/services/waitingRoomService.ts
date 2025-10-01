import { apiClient } from './apiClient';
import { getWaitingRoomPatientUrl } from '@/lib/config/api';

/**
 * Waiting Room Service for patient telehealth sessions
 * Handles marking patient as waiting in the waiting room
 */

export interface WaitingRoomRequest {
  followuptoken: string;
}

export interface WaitingRoomResponse {
  success: boolean;
  data: {
    id: number;
    is_waiting: boolean;
    waiting_since: string;
  };
  message: string;
}

export class WaitingRoomService {
  private appointmentId: string;

  constructor(appointmentId: string) {
    this.appointmentId = appointmentId;
  }

  /**
   * Mark patient as waiting in the waiting room
   */
  async markPatientAsWaiting(followupToken: string): Promise<WaitingRoomResponse> {
    const endpoint = getWaitingRoomPatientUrl(this.appointmentId);
    
    try {
      const requestBody: WaitingRoomRequest = {
        followuptoken: followupToken,
      };

      const response = await apiClient.post<WaitingRoomResponse>(endpoint, requestBody);
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to mark patient as waiting');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Hook to use Waiting Room Service
 */
export function useWaitingRoomService(appointmentId: string) {
  return new WaitingRoomService(appointmentId);
}


