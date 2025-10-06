import * as Ably from 'ably';

export interface AblyConnectEvent {
  event: 'connect' | 'moa-calling';
  metadata: unknown[];
  context: {
    actor: {
      id: string;
      name: string;
      role: string;
      type?: string;
      clinic_id?: number;
    };
    appointmentId: string;
    timestamp: string;
  };
}

export interface AblyVideoCallServiceOptions {
  appointmentId: string;
  clinicId?: number;
  onDoctorConnect: (event: AblyConnectEvent) => void;
  onError: (error: Error) => void;
}

export class AblyVideoCallService {
  private ably: Ably.Realtime | null = null;
  private appointmentChannel: Ably.RealtimeChannel | null = null;
  private clinicChannel: Ably.RealtimeChannel | null = null;
  private isConnected = false;
  private connectionError: Error | null = null;

  constructor(private options: AblyVideoCallServiceOptions) {}

  async connect(): Promise<void> {
    try {
      console.log('🔌 Ably: Starting connection...');
      console.log('🔌 Ably: appointmentId:', this.options.appointmentId);
      console.log('🔌 Ably: clinicId:', this.options.clinicId);

      // Get Ably key from environment
      const ablyKey = process.env.NEXT_PUBLIC_ABLY_LISTEN_KEY || "CqYjsw.S10pvw:GGMYS40pNKokbK1FKZJYXr5H52fisKgEiy2pzMntHCA" ;
      if (!ablyKey) {
        throw new Error('NEXT_PUBLIC_ABLY_LISTEN_KEY is not configured');
      }

      console.log('🔌 Ably: Using key:', ablyKey.substring(0, 10) + '...');

      // Create Ably client
      const ably = new Ably.Realtime({
        key: ablyKey,
        clientId: `patient-${this.options.appointmentId}`,
      });

      this.ably = ably;
      console.log('🔌 Ably: Client created with ID:', `patient-${this.options.appointmentId}`);

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Ably connection timeout'));
        }, 10000);

        ably.connection.on('connected', () => {
          clearTimeout(timeout);
          console.log('✅ Ably: Connected successfully');

          this.isConnected = true;
          this.connectionError = null;
          resolve();
        });

        ably.connection.on('failed', (stateChange) => {
          clearTimeout(timeout);
          const error = new Error(`Ably connection failed: ${stateChange.reason}`);

          this.connectionError = error;
          this.options.onError(error);
          reject(error);
        });
      });

      // Subscribe to doctor connect events on appointment channel
      const channelPrefix = process.env.NEXT_PUBLIC_ABLY_VIDEO_CHANNEL_PREFIX || 'clinic-video-call';
      const appointmentChannelName = `${channelPrefix}.${this.options.appointmentId}`;
      console.log('📡 Ably: Subscribing to appointment channel:', appointmentChannelName);
      const appointmentChannel = ably.channels.get(appointmentChannelName);
      this.appointmentChannel = appointmentChannel;

      // Subscribe to connect events on appointment channel
      appointmentChannel.subscribe('connect', (message) => {
        console.log('📡 Ably: Received connect event on appointment channel:', message);

        try {
          const event: AblyConnectEvent = {
            event: 'connect',
            metadata: message.data.metadata || [],
            context: {
              actor: {
                id: message.data.doctorId || 'unknown',
                name: message.data.doctorName || 'Doctor',
                role: 'doctor',
              },
              appointmentId: this.options.appointmentId,
              timestamp: new Date().toISOString(),
            },
          };

          this.options.onDoctorConnect(event);
        } catch (error) {
          console.error('❌ Ably: Error processing connect event:', error);
          this.options.onError(error instanceof Error ? error : new Error('Unknown error processing connect event'));
        }
      });

      // Subscribe to MOA calling events on clinic channel (if clinicId is provided)
      if (this.options.clinicId) {
        const clinicChannelName = `${channelPrefix}.clinic.${this.options.clinicId}`;
        console.log('📡 Ably: Subscribing to clinic channel:', clinicChannelName);
        const clinicChannel = ably.channels.get(clinicChannelName);
        this.clinicChannel = clinicChannel;

        // Subscribe to moa-calling events on clinic channel
        clinicChannel.subscribe('moa-calling', (message) => {
          console.log('📡 Ably: Received moa-calling event on clinic channel:', message);

          try {
            const event: AblyConnectEvent = {
              event: 'moa-calling',
              metadata: message.data.metadata || [],
              context: {
                actor: {
                  id: message.data.context?.actor?.id || 'unknown',
                  name: message.data.context?.actor?.name || 'MOA',
                  role: 'moa',
                  type: message.data.context?.actor?.type || 'clinic_user',
                  clinic_id: message.data.context?.actor?.clinic_id || this.options.clinicId,
                },
                appointmentId: this.options.appointmentId,
                timestamp: message.data.context?.published_at || new Date().toISOString(),
              },
            };

            this.options.onDoctorConnect(event);
          } catch (error) {
            console.error('❌ Ably: Error processing moa-calling event:', error);
            this.options.onError(error instanceof Error ? error : new Error('Unknown error processing moa-calling event'));
          }
        });
      }

      // Also listen for any other events on both channels for debugging
      appointmentChannel.subscribe((message) => {
        console.log('📡 Ably: Appointment channel message (all events):', message);
        console.log('📡 Ably: Message name:', message.name);
        console.log('📡 Ably: Message data:', message.data);
      });

      if (this.clinicChannel) {
        this.clinicChannel.subscribe((message) => {
          console.log('📡 Ably: Clinic channel message (all events):', message);
          console.log('📡 Ably: Message name:', message.name);
          console.log('📡 Ably: Message data:', message.data);
        });
      }

      console.log('✅ Ably: Successfully subscribed to channels');

    } catch (error) {

      const errorObj = error instanceof Error ? error : new Error('Unknown Ably connection error');
      this.connectionError = errorObj;
      this.options.onError(errorObj);
      throw errorObj;
    }
  }

  async disconnect(): Promise<void> {
    try {
      console.log('🔌 Ably: Disconnecting from channels...');

      if (this.appointmentChannel) {
        await this.appointmentChannel.unsubscribe();
        this.appointmentChannel = null;
      }

      if (this.clinicChannel) {
        await this.clinicChannel.unsubscribe();
        this.clinicChannel = null;
      }

      if (this.ably) {
        this.ably.close();
        this.ably = null;
      }

      this.isConnected = false;
      this.connectionError = null;

      console.log('✅ Ably: Successfully disconnected');
    } catch (error) {
      console.error('❌ Ably: Error during disconnect:', error);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionError: this.connectionError,
    };
  }
}

// Hook wrapper for React components
export function useAblyVideoCallService(options: AblyVideoCallServiceOptions) {
  return new AblyVideoCallService(options);
}