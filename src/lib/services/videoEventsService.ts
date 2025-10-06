import { apiClient } from './apiClient';
import { getVideoEventsPatientUrl } from '@/lib/config/api';

/**
 * Check if the appointment date is today in Vancouver timezone
 */
export function isAppointmentToday(appointmentDate: string): boolean {
  try {
    const appointmentDateObj = new Date(appointmentDate);
    const today = new Date();
    
    // Convert both dates to Vancouver timezone (America/Vancouver)
    const vancouverAppointment = new Date(appointmentDateObj.toLocaleString("en-US", {timeZone: "America/Vancouver"}));
    const vancouverToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Vancouver"}));
    
    // Compare dates (ignore time)
    return vancouverAppointment.toDateString() === vancouverToday.toDateString();
  } catch (error) {
    console.error('Error checking if appointment is today:', error);
    return false;
  }
}

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
    patient_name?: string;
    patient_id?: number;
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
    metadata: { id: number; is_waiting: boolean; waiting_since: string; patient_name?: string; patient_id?: number }
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
   * Trigger new appointment event
   */
  async triggerNewAppointmentEvent(
    followupToken: string,
    appointmentData: { id: number; patient_name: string; patient_id: number }
  ): Promise<VideoEventResponse> {
    const metadata = {
      id: appointmentData.id,
      is_waiting: false,
      waiting_since: new Date().toISOString(),
      patient_name: appointmentData.patient_name,
      patient_id: appointmentData.patient_id
    };
    
    return this.triggerVideoEvent(followupToken, 'new-appointment', metadata);
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
