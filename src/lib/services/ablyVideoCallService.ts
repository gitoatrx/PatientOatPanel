import * as Ably from 'ably';

/**
 * Ably Video Call Service for patient telehealth sessions
 * Handles listening for doctor connect events in the waiting room
 */

export interface AblyConnectEvent {
  event: 'connect';
  metadata: any[];
  context: {
    actor: {
      type: 'doctor';
      id: number;
    };
    clinic_id: number;
    appointment_id: number;
  };
  published_at: string;
}

export interface AblyVideoCallServiceConfig {
  appointmentId: string;
  onDoctorConnect: (event: AblyConnectEvent) => void;
  onError?: (error: Error) => void;
}

export class AblyVideoCallService {
  private ably: Ably.Realtime | null = null;
  private channel: Ably.RealtimeChannel | null = null;
  private isConnected = false;
  private config: AblyVideoCallServiceConfig;

  constructor(config: AblyVideoCallServiceConfig) {
    this.config = config;
  }

  /**
   * Initialize and connect to Ably
   */
  async connect(): Promise<void> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ABLY_LISTEN_KEY;
      const channelPrefix = process.env.NEXT_PUBLIC_ABLY_VIDEO_CHANNEL_PREFIX || 'clinic-video-call';

      if (!apiKey) {
        throw new Error('NEXT_PUBLIC_ABLY_LISTEN_KEY is not defined');
      }

      console.log('🔌 Initializing Ably connection...');
      
      this.ably = new Ably.Realtime({
        key: apiKey,
        clientId: `patient-${this.config.appointmentId}`,
      });

      // Create channel name using the appointment ID
      const channelName = `${channelPrefix}.${this.config.appointmentId}`;
      console.log('📡 Connecting to Ably channel:', channelName);

      this.channel = this.ably.channels.get(channelName);

      // Listen for connection state changes
      this.ably.connection.on('connected', () => {
        console.log('✅ Ably connected successfully');
        this.isConnected = true;
      });

      this.ably.connection.on('disconnected', () => {
        console.log('❌ Ably disconnected');
        this.isConnected = false;
      });

      this.ably.connection.on('failed', (error) => {
        console.error('❌ Ably connection failed:', error);
        this.isConnected = false;
        this.config.onError?.(new Error(`Ably connection failed: ${error.message}`));
      });

      // Subscribe to connect events
      this.channel.subscribe('connect', (message) => {
        console.log('📨 Received Ably connect event:', message.data);
        
        try {
          const eventData = message.data as AblyConnectEvent;
          
          // Verify this is a doctor connect event
          if (eventData.event === 'connect' && eventData.context.actor.type === 'doctor') {
            console.log('👨‍⚕️ Doctor connected! Calling onDoctorConnect callback');
            this.config.onDoctorConnect(eventData);
          }
        } catch (error) {
          console.error('❌ Error processing Ably connect event:', error);
          this.config.onError?.(error as Error);
        }
      });

      console.log('🎧 Ably video call service initialized and listening for doctor connect events');

    } catch (error) {
      console.error('❌ Failed to initialize Ably video call service:', error);
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from Ably
   */
  async disconnect(): Promise<void> {
    try {
      console.log('🔌 Disconnecting from Ably...');
      
      if (this.channel) {
        await this.channel.unsubscribe();
        this.channel = null;
      }

      if (this.ably) {
        await this.ably.close();
        this.ably = null;
      }

      this.isConnected = false;
      console.log('✅ Ably disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from Ably:', error);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

/**
 * Hook to use Ably Video Call Service
 */
export function useAblyVideoCallService(config: AblyVideoCallServiceConfig) {
  return new AblyVideoCallService(config);
}

