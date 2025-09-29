import { useMemo } from 'react';
import { apiClient } from './apiClient';
import { getChatMessagesUrl } from '@/lib/config/api';

/**
 * Chat API Service for patient telehealth sessions
 * Handles getting and sending chat messages via API
 */

export interface ChatMessage {
  id: number;
  sender_type: 'patient' | 'clinic_user';
  sender_id: number;
  sender_name: string;
  message: string;
  sent_at: string;
}

export interface ChatApiResponse {
  success: boolean;
  data: ChatMessage | { messages: ChatMessage[] };
  message: string;
}

export class ChatApiService {
  private appointmentId: string;
  private followupToken: string;

  constructor(appointmentId: string, followupToken: string) {
    this.appointmentId = appointmentId;
    this.followupToken = followupToken;
  }

  /**
   * Get chat messages for the appointment
   */
  async getMessages(): Promise<ChatMessage[]> {
    const endpoint = getChatMessagesUrl(this.appointmentId, this.followupToken);
    
    const response = await apiClient.get<ChatApiResponse>(endpoint);
    const result = response.data;
    
    if (!result.success || !result.data || typeof result.data !== 'object' || !('messages' in result.data)) {
      throw new Error('Invalid response format from chat API');
    }

    return (result.data as { messages: ChatMessage[] }).messages;
  }

  /**
   * Send a chat message
   */
  async sendMessage(message: string): Promise<ChatMessage> {
    const endpoint = getChatMessagesUrl(this.appointmentId, this.followupToken);
    
    const formData = new FormData();
    formData.append('message', message);

    const response = await apiClient.post<ChatApiResponse>(endpoint, formData);
    
    const result = response.data;
    
    if (!result.success || !result.data || typeof result.data === 'object' && 'messages' in result.data) {
      throw new Error('Invalid response format from chat API');
    }

    return result.data as ChatMessage;
  }

  /**
   * Alias for getMessages to match the expected interface
   */
  async loadChatMessages(): Promise<ChatMessage[]> {
    return this.getMessages();
  }

  /**
   * Convert API messages to Vonage format
   */
  convertToVonageFormat(messages: ChatMessage[]) {
    return messages.map(msg => ({
      id: msg.id.toString(),
      author: msg.sender_name,
      timestamp: this.formatTimestamp(msg.sent_at),
      content: msg.message,
      isOwn: msg.sender_type === 'patient'
    }));
  }

  /**
   * Format timestamp to match Vonage format (HH:MM AM/PM)
   */
  private formatTimestamp(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.warn('Failed to format timestamp:', isoString, error);
      return isoString; // Fallback to original string
    }
  }
}

/**
 * Hook to use Chat API Service
 */
export function useChatApi(appointmentId: string, followupToken: string) {
  return useMemo(() => new ChatApiService(appointmentId, followupToken), [appointmentId, followupToken]);
}
