import * as Ably from 'ably';

export interface AblyConnectEvent {
  event: 'connect';
  metadata: unknown[];
  context: {
    actor: {
      id: string;
      name: string;
      role: string;
    };
    appointmentId: string;
    timestamp: string;
  };
}

export interface AblyVideoCallServiceOptions {
  appointmentId: string;
  onDoctorConnect: (event: AblyConnectEvent) => void;
  onError: (error: Error) => void;
}

export class AblyVideoCallService {
  private ably: Ably.Realtime | null = null;
  private channel: Ably.RealtimeChannel | null = null;
  private isConnected = false;
  private connectionError: Error | null = null;

  constructor(private options: AblyVideoCallServiceOptions) {}

  async connect(): Promise<void> {
    try {

      // Get Ably key from environment
      const ablyKey = process.env.NEXT_PUBLIC_ABLY_LISTEN_KEY || "CqYjsw.S10pvw:GGMYS40pNKokbK1FKZJYXr5H52fisKgEiy2pzMntHCA" ;
      if (!ablyKey) {
        throw new Error('NEXT_PUBLIC_ABLY_LISTEN_KEY is not configured');
      }

      // Create Ably client
      const ably = new Ably.Realtime({
        key: ablyKey,
        clientId: `patient-${this.options.appointmentId}`,
      });

      this.ably = ably;

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Ably connection timeout'));
        }, 10000);

        ably.connection.on('connected', () => {
          clearTimeout(timeout);

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

      // Subscribe to doctor connect events
      const channelPrefix = process.env.NEXT_PUBLIC_ABLY_VIDEO_CHANNEL_PREFIX || 'clinic-video-call';
      const channelName = `${channelPrefix}.${this.options.appointmentId}`;
      const channel = ably.channels.get(channelName);
      this.channel = channel;

      // Subscribe to connect events
      channel.subscribe('connect', (message) => {

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

          this.options.onError(error instanceof Error ? error : new Error('Unknown error processing connect event'));
        }
      });

      // Also listen for any other events on the channel for debugging
      channel.subscribe((message) => {

      });

    } catch (error) {

      const errorObj = error instanceof Error ? error : new Error('Unknown Ably connection error');
      this.connectionError = errorObj;
      this.options.onError(errorObj);
      throw errorObj;
    }
  }

  async disconnect(): Promise<void> {
    try {

      if (this.channel) {
        await this.channel.unsubscribe();
        this.channel = null;
      }

      if (this.ably) {
        this.ably.close();
        this.ably = null;
      }

      this.isConnected = false;
      this.connectionError = null;

    } catch (error) {

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