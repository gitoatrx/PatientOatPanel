import { apiClient } from './apiClient';
import { getVideoEventsPatientUrl } from '@/lib/config/api';

/**
 * Check if the appointment date is today in Vancouver timezone
 */
export function isAppointmentToday(appointmentDate: string): boolean {
  try {
    const appointmentDateObj = new Date(appointmentDate);
    const today = new Date();
    
    console.log('🎯 isAppointmentToday: Input appointmentDate:', appointmentDate);
    console.log('🎯 isAppointmentToday: appointmentDateObj:', appointmentDateObj.toISOString());
    console.log('🎯 isAppointmentToday: today:', today.toISOString());
    
    // Only convert today to Vancouver timezone, keep appointment date as is
    const vancouverToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Vancouver"}));
    
    console.log('🎯 isAppointmentToday: vancouverToday:', vancouverToday.toISOString());
    console.log('🎯 isAppointmentToday: appointmentDateObj.toDateString():', appointmentDateObj.toDateString());
    console.log('🎯 isAppointmentToday: vancouverToday.toDateString():', vancouverToday.toDateString());
    
    // Compare dates (ignore time)
    const isToday = appointmentDateObj.toDateString() === vancouverToday.toDateString();
    console.log('🎯 isAppointmentToday: Final result:', isToday);
    
    return isToday;
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
    
    console.log('🎯 VideoEventsService: triggerVideoEvent called');
    console.log('🎯 Event type:', eventType);
    console.log('🎯 Endpoint:', endpoint);
    console.log('🎯 Metadata:', metadata);
    console.log('🎯 Token (first 10 chars):', followupToken.substring(0, 10) + '...');
    
    try {
      const requestBody: VideoEventRequest = {
        type: eventType,
        metadata,
        token: followupToken,
      };

      console.log('🎯 Making API call to video events endpoint...');
      console.log('🎯 Request body:', requestBody);
      const response = await apiClient.post<VideoEventResponse>(endpoint, requestBody);
      console.log('🎯 API response received:', response.data);
      
      const result = response.data;
      
      if (!result.success) {
        console.error('🎯 API returned success: false, message:', result.message);
        throw new Error(result.message || 'Failed to trigger video event');
      }

      console.log('🎯 Video event triggered successfully!');
      return result;
    } catch (error) {
      console.error('🎯 Video event API call failed:', error);
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
    console.log('🎯 VideoEventsService: triggerNewAppointmentEvent called');
    console.log('🎯 Appointment data:', appointmentData);
    console.log('🎯 Followup token (first 10 chars):', followupToken.substring(0, 10) + '...');
    
    const metadata = {
      id: appointmentData.id,
      is_waiting: false,
      waiting_since: new Date().toISOString(),
      patient_name: appointmentData.patient_name,
      patient_id: appointmentData.patient_id
    };
    
    console.log('🎯 Calling triggerVideoEvent with metadata:', metadata);
    return this.triggerVideoEvent(followupToken, 'new-appointment', metadata);
  }

  /**
   * Get the video events endpoint URL
   */
  private getVideoEventsUrl(): string {
    const url = getVideoEventsPatientUrl(this.appointmentId);
    console.log('🎯 VideoEventsService: Generated endpoint URL:', url);
    return url;
  }
}

/**
 * Hook to use Video Events Service
 */
export function useVideoEventsService(appointmentId: string) {
  return new VideoEventsService(appointmentId);
}