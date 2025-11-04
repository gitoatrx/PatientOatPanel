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
  call_type?: 'video' | 'audio';
  call_mode?: 'video' | 'audio';
}

export interface CallModeEvent {
  event: 'CALL_MODE_SET' | 'CALL_MODE_CHANGED';
  call_mode: 'video' | 'audio';
  previous_mode?: 'video' | 'audio';
  appointment_id: string;
  patient_id?: string;
  clinic_id?: number;
  timestamp: string;
}

export interface AblyVideoCallServiceOptions {
  appointmentId: string;
  clinicId?: number;
  onDoctorConnect: (event: AblyConnectEvent) => void;
  onCallModeChange?: (event: CallModeEvent) => void;
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
      const channel = ably.channels.get(appointmentChannelName);
      this.appointmentChannel = channel;

      // Subscribe to connect events on appointment channel
      channel.subscribe('connect', (message) => {
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

      // Subscribe to CALL_MODE_SET and CALL_MODE_CHANGED events on appointment channel
      channel.subscribe('CALL_MODE_SET', (message) => {
        console.log('📡 Ably: Received CALL_MODE_SET event on appointment channel:', message);
        this.handleCallModeEvent(message, 'CALL_MODE_SET');
      });

      channel.subscribe('CALL_MODE_CHANGED', (message) => {
        console.log('📡 Ably: Received CALL_MODE_CHANGED event on appointment channel:', message);
        this.handleCallModeEvent(message, 'CALL_MODE_CHANGED');
      });

      // Subscribe to call_type_switched event on appointment channel
      channel.subscribe('call_type_switched', (message) => {
        console.log('📡 Ably: Received call_type_switched event on appointment channel:', message);
        this.handleCallTypeSwitchedEvent(message);
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
            // Extract call_type from metadata
            const metadata = message.data.metadata || [];
            let call_type: 'video' | 'audio' | undefined = undefined;
            
            // Try to get call_type from multiple sources
            if (message.data.call_type) {
              call_type = message.data.call_type as 'video' | 'audio';
            } else if (Array.isArray(metadata) && typeof metadata[0] === 'object' && metadata[0] !== null) {
              const firstMeta = metadata[0] as Record<string, unknown>;
              call_type = firstMeta.call_type as 'video' | 'audio' | undefined;
            } else if (message.data.context?.call_type) {
              call_type = message.data.context.call_type as 'video' | 'audio';
            }

            const event: AblyConnectEvent = {
              event: 'moa-calling',
              metadata: metadata,
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
              call_type: call_type,
            };

            this.options.onDoctorConnect(event);
          } catch (error) {
            console.error('❌ Ably: Error processing moa-calling event:', error);
            this.options.onError(error instanceof Error ? error : new Error('Unknown error processing moa-calling event'));
          }
        });

        // Subscribe to CALL_MODE_SET and CALL_MODE_CHANGED events on clinic channel
        clinicChannel.subscribe('CALL_MODE_SET', (message) => {
          console.log('📡 Ably: Received CALL_MODE_SET event on clinic channel:', message);
          this.handleCallModeEvent(message, 'CALL_MODE_SET');
        });

        clinicChannel.subscribe('CALL_MODE_CHANGED', (message) => {
          console.log('📡 Ably: Received CALL_MODE_CHANGED event on clinic channel:', message);
          this.handleCallModeEvent(message, 'CALL_MODE_CHANGED');
        });

        // Subscribe to call_type_switched event on clinic channel
        clinicChannel.subscribe('call_type_switched', (message) => {
          console.log('📡 Ably: Received call_type_switched event on clinic channel:', message);
          this.handleCallTypeSwitchedEvent(message);
        });
      }

      // Also listen for any other events on both channels for debugging
      // Also handle call_type_switched events that might come through the wildcard subscription
      channel.subscribe((message) => {
        console.log('📡 Ably: Appointment channel message (all events):', message);
        console.log('📡 Ably: Message name:', message.name);
        console.log('📡 Ably: Message data:', message.data);
        
        // Handle call_type_switched and CALL_MODE_CHANGED events that might come through wildcard subscription
        // Check both message.name and message.data.type
        const eventType = message.name || (message.data && typeof message.data === 'object' && 'type' in message.data ? message.data.type : null);
        
        if (eventType === 'call_type_switched') {
          console.log('📡 Ably: Detected call_type_switched in wildcard subscription, handling...');
          this.handleCallTypeSwitchedEvent(message);
        } else if (eventType === 'CALL_MODE_CHANGED' || eventType === 'CALL_MODE_SET') {
          // Handle CALL_MODE_CHANGED/CALL_MODE_SET events that might come through wildcard subscription
          console.log('📡 Ably: Detected', eventType, 'in wildcard subscription, handling...');
          this.handleCallModeEvent(message, eventType as 'CALL_MODE_SET' | 'CALL_MODE_CHANGED');
        }
      });

      if (this.clinicChannel) {
        this.clinicChannel.subscribe((message) => {
          console.log('📡 Ably: Clinic channel message (all events):', message);
          console.log('📡 Ably: Message name:', message.name);
          console.log('📡 Ably: Message data:', message.data);
          
          // Handle call_type_switched events that might come through wildcard subscription
          // Check both message.name and message.data.type
          const eventType = message.name || (message.data && typeof message.data === 'object' && 'type' in message.data ? message.data.type : null);
          
          if (eventType === 'call_type_switched') {
            console.log('📡 Ably: Detected call_type_switched in wildcard subscription (clinic channel), handling...');
            this.handleCallTypeSwitchedEvent(message);
          } else if (eventType === 'CALL_MODE_CHANGED' || eventType === 'CALL_MODE_SET') {
            // Handle CALL_MODE_CHANGED/CALL_MODE_SET events that might come through wildcard subscription
            console.log('📡 Ably: Detected', eventType, 'in wildcard subscription (clinic channel), handling...');
            this.handleCallModeEvent(message, eventType as 'CALL_MODE_SET' | 'CALL_MODE_CHANGED');
          }
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

  private handleCallModeEvent(message: Ably.Message, eventType: 'CALL_MODE_SET' | 'CALL_MODE_CHANGED'): void {
    try {
      const data = message.data || {};
      console.log('📡 Ably: CALL_MODE event data:', JSON.stringify(data, null, 2));
      console.log('📡 Ably: CALL_MODE event type:', eventType);
      
      // Check both top-level and metadata.call_mode (as shown in the payload images)
      // The payload structure shows: { type: "CALL_MODE_CHANGED", metadata: { call_mode: "audio", ... } }
      const call_mode = (data.call_mode || data.callMode || data.metadata?.call_mode || data.metadata?.callMode) as 'video' | 'audio';
      const previous_mode = (data.previous_mode || data.previousMode || data.metadata?.previous_mode || data.metadata?.previousMode) as 'video' | 'audio' | undefined;
      const appointment_id = data.appointment_id || data.appointmentId || data.metadata?.appointment_id || data.metadata?.appointmentId || this.options.appointmentId;
      const patient_id = data.patient_id || data.patientId || data.metadata?.patient_id || data.metadata?.patientId;
      const clinic_id = data.clinic_id || data.clinicId || data.metadata?.clinic_id || data.metadata?.clinicId || this.options.clinicId;
      const timestamp = data.timestamp || data.metadata?.timestamp || new Date().toISOString();
      
      console.log('📞 Ably: Extracted call_mode from CALL_MODE event:', call_mode);
      console.log('📞 Ably: Extracted previous_mode from CALL_MODE event:', previous_mode);
      
      if (!call_mode || (call_mode !== 'video' && call_mode !== 'audio')) {
        console.warn('⚠️ Ably: Invalid call_mode in event:', {
          call_mode,
          data,
          metadata: data.metadata
        });
        return;
      }

      const event: CallModeEvent = {
        event: eventType,
        call_mode: call_mode,
        previous_mode: previous_mode,
        appointment_id: appointment_id,
        patient_id: patient_id,
        clinic_id: clinic_id,
        timestamp: timestamp,
      };

      console.log('📞 Ably: Processed CALL_MODE event:', event);
      console.log('📞 Ably: Call mode to set:', call_mode);
      console.log('📞 Ably: Previous mode:', previous_mode);

      if (this.options.onCallModeChange) {
        this.options.onCallModeChange(event);
        console.log('✅ Ably: Called onCallModeChange callback with call_mode:', call_mode);
      } else {
        console.warn('⚠️ Ably: onCallModeChange callback not provided');
      }
    } catch (error) {
      console.error('❌ Ably: Error processing call mode event:', error);
      this.options.onError(error instanceof Error ? error : new Error('Unknown error processing call mode event'));
    }
  }

  private handleCallTypeSwitchedEvent(message: Ably.Message): void {
    try {
      const data = message.data || {};
      console.log('📡 Ably: call_type_switched event data:', JSON.stringify(data, null, 2));
      console.log('📡 Ably: call_type_switched message name:', message.name);
      
      // Extract on_call_type from multiple possible locations in the payload
      // Check: data.metadata.on_call_type, data.on_call_type, data.context.metadata.on_call_type
      // Also handle the case where the payload has a 'type' field
      const on_call_type = (
        data.metadata?.on_call_type || 
        data.on_call_type || 
        data.context?.metadata?.on_call_type ||
        (data.metadata && typeof data.metadata === 'object' && 'on_call_type' in data.metadata ? data.metadata.on_call_type : undefined)
      ) as 'video' | 'audio' | undefined;
      
      console.log('📞 Ably: Extracted on_call_type from call_type_switched:', on_call_type);
      
      if (!on_call_type || (on_call_type !== 'video' && on_call_type !== 'audio')) {
        console.warn('⚠️ Ably: Invalid on_call_type in call_type_switched event:', {
          on_call_type,
          data,
          metadata: data.metadata
        });
        return;
      }

      // Extract other fields from metadata or top-level
      const appointment_id = data.appointment_id || data.appointmentId || data.metadata?.appointment_id || data.metadata?.appointmentId || this.options.appointmentId;
      const patient_id = data.patient_id || data.patientId || data.metadata?.patient_id || data.metadata?.patientId;
      const clinic_id = data.clinic_id || data.clinicId || data.metadata?.clinic_id || data.metadata?.clinicId || this.options.clinicId;
      const timestamp = data.published_at || data.timestamp || data.metadata?.timestamp || new Date().toISOString();

      // Convert to CallModeEvent format (treat as CALL_MODE_CHANGED since it's a switch)
      const event: CallModeEvent = {
        event: 'CALL_MODE_CHANGED',
        call_mode: on_call_type,
        previous_mode: undefined, // We don't have previous mode in this event
        appointment_id: appointment_id,
        patient_id: patient_id,
        clinic_id: clinic_id,
        timestamp: timestamp,
      };

      console.log('📞 Ably: Processed call_type_switched event:', event);
      console.log('📞 Ably: on_call_type:', on_call_type);
      console.log('📞 Ably: Call mode to set:', on_call_type);

      if (this.options.onCallModeChange) {
        this.options.onCallModeChange(event);
        console.log('✅ Ably: Called onCallModeChange callback with call_mode:', on_call_type);
      } else {
        console.warn('⚠️ Ably: onCallModeChange callback not provided');
      }
    } catch (error) {
      console.error('❌ Ably: Error processing call_type_switched event:', error);
      this.options.onError(error instanceof Error ? error : new Error('Unknown error processing call_type_switched event'));
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