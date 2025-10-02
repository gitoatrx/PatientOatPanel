import { apiClient } from './apiClient';
import { getVideoEventsPatientUrl } from '@/lib/config/api';

/**
 * Video Events Service for patient telehealth sessions
 * Handles triggering video events like patient.waiting
 */

export interface VideoEventRequest {
  type: string;
  metadata: {
    id: number;
    is_waiting: boolean;
    waiting_since: string;
  };
  token: string;
}

export interface VideoEventResponse {
  success: boolean;
  message: string;
}

export class VideoEventsService {
  private appointmentId: string;

  constructor(appointmentId: string) {
    this.appointmentId = appointmentId;
  }

  /**
   * Trigger a video event for the appointment
   */
  async triggerVideoEvent(
    followupToken: string, 
    eventType: string, 
    metadata: { id: number; is_waiting: boolean; waiting_since: string }
  ): Promise<VideoEventResponse> {
    const endpoint = this.getVideoEventsUrl();
    
    try {
      const requestBody: VideoEventRequest = {
        type: eventType,
        metadata,
        token: followupToken,
      };

      
      const response = await apiClient.post<VideoEventResponse>(endpoint, requestBody);
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to trigger video event');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Trigger patient waiting event
   */
  async triggerPatientWaitingEvent(
    followupToken: string,
    waitingData: { id: number; is_waiting: boolean; waiting_since: string }
  ): Promise<VideoEventResponse> {
    return this.triggerVideoEvent(followupToken, 'patient.waiting', waitingData);
  }

  /**
   * Get the video events endpoint URL
   */
  private getVideoEventsUrl(): string {
    return getVideoEventsPatientUrl(this.appointmentId);
  }
}

/**
 * Hook to use Video Events Service
 */
export function useVideoEventsService(appointmentId: string) {
  return new VideoEventsService(appointmentId);
}
