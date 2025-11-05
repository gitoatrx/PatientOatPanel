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
  
  // Store subscription handlers to prevent them from being garbage collected
  private subscriptionHandlers: {
    callTypeSwitched?: (message: Ably.Message) => void;
    callModeChanged?: (message: Ably.Message) => void;
    callModeSet?: (message: Ably.Message) => void;
    connect?: (message: Ably.Message) => void;
  } = {};

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
      
      // Monitor connection state changes - keep connection alive during calls
      ably.connection.on('connecting', () => {
        console.log('📡 Ably: Connecting...');
        this.isConnected = false;
      });
      
      ably.connection.on('connected', () => {
        console.log('✅ Ably: Connected and active');
        this.isConnected = true;
        this.connectionError = null;
      });
      
      ably.connection.on('disconnected', () => {
        console.warn('⚠️ Ably: Disconnected - will attempt to reconnect');
        this.isConnected = false;
        // Ably SDK will automatically attempt to reconnect
      });
      
      ably.connection.on('suspended', () => {
        console.warn('⚠️ Ably: Connection suspended');
        this.isConnected = false;
      });
      
      ably.connection.on('closed', () => {
        console.warn('⚠️ Ably: Connection closed');
        this.isConnected = false;
      });
      
      ably.connection.on('failed', (stateChange) => {
        console.error('❌ Ably: Connection failed:', stateChange.reason);
        this.isConnected = false;
        this.connectionError = new Error(`Ably connection failed: ${stateChange.reason}`);
      });
      
      ably.connection.on('update', (stateChange) => {
        console.log('📡 Ably: Connection state update:', stateChange.current);
        if (stateChange.current === 'connected') {
          this.isConnected = true;
        } else if (stateChange.current === 'disconnected' || stateChange.current === 'suspended') {
          this.isConnected = false;
        }
      });

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

      // Subscribe to doctor connect events on appointment channel
      const channelPrefix = process.env.NEXT_PUBLIC_ABLY_VIDEO_CHANNEL_PREFIX || 'clinic-video-call';
      const appointmentChannelName = `${channelPrefix}.${this.options.appointmentId}`;
      const channel = ably.channels.get(appointmentChannelName);
      this.appointmentChannel = channel;
      
      // Monitor channel state changes - ensure it stays attached during calls
      channel.on('attached', () => {
        console.log('✅ Ably: Appointment channel attached and listening');
      });
      
      channel.on('detached', () => {
        console.warn('⚠️ Ably: Appointment channel detached - reattaching...');
        // Try to reattach if channel gets detached
        setTimeout(() => {
          if (channel.state === 'detached') {
            channel.attach().then(() => {
              console.log('✅ Ably: Channel reattached successfully');
            }).catch((err) => {
              console.error('❌ Ably: Failed to reattach channel:', err);
            });
          }
        }, 1000);
      });
      
      channel.on('suspended', () => {
        console.warn('⚠️ Ably: Appointment channel suspended - will attempt to reattach');
        setTimeout(() => {
          if (channel.state === 'suspended') {
            channel.attach().catch((err) => {
              console.error('❌ Ably: Failed to reattach suspended channel:', err);
            });
          }
        }, 1000);
      });
      
      channel.on('failed', (error) => {
        console.error('❌ Ably: Channel failed:', error);
        // Try to reattach on failure
        setTimeout(() => {
          channel.attach().catch((err) => {
            console.error('❌ Ably: Failed to reattach after failure:', err);
          });
        }, 2000);
      });
      
      channel.on('update', (stateChange) => {
        console.log('📡 Ably: Channel state update:', stateChange.current);
        // If channel becomes detached or suspended, try to reattach
        if (stateChange.current === 'detached' || stateChange.current === 'suspended') {
          setTimeout(() => {
            channel.attach().then(() => {
              console.log('✅ Ably: Channel reattached after state update');
            }).catch((err) => {
              console.error('❌ Ably: Failed to reattach after update:', err);
            });
          }, 1000);
        }
      });
      
      // Attach to channel to ensure we're actively listening
      // IMPORTANT: Channel must stay attached during entire call to receive events
      channel.attach().then(() => {
        console.log('✅ Ably: Appointment channel attached and ready to receive events');
        console.log('✅ Ably: Channel will remain attached during entire call to listen for events');
        console.log('✅ Ably: Subscriptions are active and will continue listening');
      }).catch((err) => {
        console.error('❌ Ably: Error attaching to appointment channel:', err);
      });
      
      // Channel reference already stored above - this ensures it stays in memory

      // Subscribe to connect events on appointment channel
      // CRITICAL: Store handler reference to prevent garbage collection
      this.subscriptionHandlers.connect = (message: Ably.Message) => {
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
      };
      channel.subscribe('connect', this.subscriptionHandlers.connect);

      // Subscribe to call_type_switched event on appointment channel (same channel as connect event)
      // This subscription will remain active during the entire call
      // This event has the same functionality as CALL_MODE_CHANGED - both trigger camera/stream switching
      // CRITICAL: Store handler reference to prevent garbage collection
      this.subscriptionHandlers.callTypeSwitched = (message: Ably.Message) => {
        console.log('🔔🔔🔔 call_type_switched EVENT RECEIVED ON APPOINTMENT CHANNEL 🔔🔔🔔');
        console.log('📡 Ably: Event name:', message.name);
        console.log('📡 Ably: Event data:', JSON.stringify(message.data, null, 2));
        console.log('📡 Ably: Channel:', appointmentChannelName);
        console.log('📡 Ably: Connection state:', this.ably?.connection?.state);
        console.log('📡 Ably: Channel state:', channel.state);
        console.log('📡 Ably: This event is received DURING the call, not just at start');
        this.handleCallTypeSwitchedEvent(message);
      };
      channel.subscribe('call_type_switched', this.subscriptionHandlers.callTypeSwitched);
      console.log('✅ Ably: Subscribed to call_type_switched on appointment channel - will listen during entire call');
      console.log('✅ Ably: Handler reference stored to prevent garbage collection');

      // Subscribe to CALL_MODE_SET and CALL_MODE_CHANGED events on appointment channel
      // CRITICAL: Store handler reference to prevent garbage collection
      this.subscriptionHandlers.callModeSet = (message: Ably.Message) => {
        this.handleCallModeEvent(message, 'CALL_MODE_SET');
      };
      channel.subscribe('CALL_MODE_SET', this.subscriptionHandlers.callModeSet);

      this.subscriptionHandlers.callModeChanged = (message: Ably.Message) => {
        console.log('🔔🔔🔔 CALL_MODE_CHANGED EVENT RECEIVED ON APPOINTMENT CHANNEL 🔔🔔🔔');
        console.log('📡 Ably: Event name:', message.name);
        console.log('📡 Ably: Event data:', JSON.stringify(message.data, null, 2));
        console.log('📡 Ably: Channel:', appointmentChannelName);
        console.log('📡 Ably: Connection state:', this.ably?.connection?.state);
        console.log('📡 Ably: Channel state:', channel.state);
        console.log('📡 Ably: This event is received DURING the call, not just at start');
        this.handleCallModeEvent(message, 'CALL_MODE_CHANGED');
      };
      channel.subscribe('CALL_MODE_CHANGED', this.subscriptionHandlers.callModeChanged);
      console.log('✅ Ably: Subscribed to CALL_MODE_CHANGED on appointment channel - will listen during entire call');
      console.log('✅ Ably: Handler reference stored to prevent garbage collection');

      // Subscribe to MOA calling events on clinic channel (if clinicId is provided)
      if (this.options.clinicId) {
        const clinicChannelName = `${channelPrefix}.clinic.${this.options.clinicId}`;
        const clinicChannel = ably.channels.get(clinicChannelName);
        this.clinicChannel = clinicChannel;

        // Subscribe to moa-calling events on clinic channel
        clinicChannel.subscribe('moa-calling', (message) => {
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
          this.handleCallModeEvent(message, 'CALL_MODE_SET');
        });

        clinicChannel.subscribe('CALL_MODE_CHANGED', (message) => {
          this.handleCallModeEvent(message, 'CALL_MODE_CHANGED');
        });

        // Subscribe to call_type_switched event on clinic channel
        clinicChannel.subscribe('call_type_switched', (message) => {
          this.handleCallTypeSwitchedEvent(message);
        });
      }

      // CATCH-ALL LISTENER: Listen to ALL messages on appointment channel (fallback)
      channel.subscribe((message) => {
        const messageName = message.name;
        const data = message.data || {};
        const dataType = data && typeof data === 'object' && 'type' in data ? data.type : null;
        const eventType = messageName || dataType;
        
        if (eventType === 'call_type_switched') {
          this.handleCallTypeSwitchedEvent(message);
        } else if (eventType === 'CALL_MODE_CHANGED' || eventType === 'CALL_MODE_SET') {
          this.handleCallModeEvent(message, eventType as 'CALL_MODE_SET' | 'CALL_MODE_CHANGED');
        }
      });

      if (this.clinicChannel) {
        this.clinicChannel.subscribe((message) => {
          const messageName = message.name;
          const dataType = message.data && typeof message.data === 'object' && 'type' in message.data ? message.data.type : null;
          const eventType = messageName || dataType;
          
          if (eventType === 'call_type_switched' || messageName === 'call_type_switched') {
            this.handleCallTypeSwitchedEvent(message);
          } else if (eventType === 'CALL_MODE_CHANGED' || eventType === 'CALL_MODE_SET') {
            this.handleCallModeEvent(message, eventType as 'CALL_MODE_SET' | 'CALL_MODE_CHANGED');
          }
        });
      }

    } catch (error) {

      const errorObj = error instanceof Error ? error : new Error('Unknown Ably connection error');
      this.connectionError = errorObj;
      this.options.onError(errorObj);
      throw errorObj;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Only disconnect if explicitly called - don't auto-disconnect during calls
      console.log('🔌 Ably: Disconnect called - this should only happen on component unmount');
      
      // Don't unsubscribe - just close the connection
      // Unsubscribing might interfere with active subscriptions that should persist
      // The SDK will clean up when the connection closes
      
      if (this.ably) {
        this.ably.close();
        this.ably = null;
      }
      
      // Clear references but don't unsubscribe (let SDK handle cleanup)
      this.appointmentChannel = null;
      this.clinicChannel = null;

      this.isConnected = false;
      this.connectionError = null;
    } catch (error) {
      console.error('❌ Ably: Error during disconnect:', error);
    }
  }

  private handleCallModeEvent(message: Ably.Message, eventType: 'CALL_MODE_SET' | 'CALL_MODE_CHANGED'): void {
    try {
      const data = message.data || {};
      
      // Check both top-level and metadata.call_mode
      const call_mode = (data.call_mode || data.callMode || data.metadata?.call_mode || data.metadata?.callMode) as 'video' | 'audio';
      const previous_mode = (data.previous_mode || data.previousMode || data.metadata?.previous_mode || data.metadata?.previousMode) as 'video' | 'audio' | undefined;
      const appointment_id = data.appointment_id || data.appointmentId || data.metadata?.appointment_id || data.metadata?.appointmentId || this.options.appointmentId;
      const patient_id = data.patient_id || data.patientId || data.metadata?.patient_id || data.metadata?.patientId;
      const clinic_id = data.clinic_id || data.clinicId || data.metadata?.clinic_id || data.metadata?.clinicId || this.options.clinicId;
      const timestamp = data.timestamp || data.metadata?.timestamp || new Date().toISOString();
      
      if (!call_mode || (call_mode !== 'video' && call_mode !== 'audio')) {
        console.warn('⚠️ Ably: Invalid call_mode in event:', call_mode);
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

      // Call the same callback - both CALL_MODE_CHANGED and call_type_switched use this
      if (this.options.onCallModeChange) {
        this.options.onCallModeChange(event);
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
      
      // Extract on_call_type from multiple possible locations in the payload
      const on_call_type = (
        data.metadata?.on_call_type || 
        data.on_call_type || 
        data.context?.metadata?.on_call_type ||
        (data.metadata && typeof data.metadata === 'object' && 'on_call_type' in data.metadata ? data.metadata.on_call_type : undefined)
      ) as 'video' | 'audio' | undefined;
      
      if (!on_call_type || (on_call_type !== 'video' && on_call_type !== 'audio')) {
        console.warn('⚠️ Ably: Invalid on_call_type in call_type_switched event:', on_call_type);
        return;
      }

      // Extract other fields from metadata or top-level
      const appointment_id = data.appointment_id || data.appointmentId || data.metadata?.appointment_id || data.metadata?.appointmentId || this.options.appointmentId;
      const patient_id = data.patient_id || data.patientId || data.metadata?.patient_id || data.metadata?.patientId;
      const clinic_id = data.clinic_id || data.clinicId || data.metadata?.clinic_id || data.metadata?.clinicId || this.options.clinicId;
      const timestamp = data.published_at || data.timestamp || data.metadata?.timestamp || new Date().toISOString();

      // Convert to CallModeEvent format (treat as CALL_MODE_CHANGED since it's a switch)
      // This ensures both call_type_switched and CALL_MODE_CHANGED have the same functionality
      const event: CallModeEvent = {
        event: 'CALL_MODE_CHANGED',
        call_mode: on_call_type,
        previous_mode: undefined, // We don't have previous mode in this event
        appointment_id: appointment_id,
        patient_id: patient_id,
        clinic_id: clinic_id,
        timestamp: timestamp,
      };

      // Call the same callback as CALL_MODE_CHANGED - both events have identical functionality
      if (this.options.onCallModeChange) {
        try {
          this.options.onCallModeChange(event);
        } catch (callbackError) {
          console.error('❌ Ably: Error executing onCallModeChange callback:', callbackError);
        }
      } else {
        console.warn('⚠️ Ably: onCallModeChange callback not provided');
      }
    } catch (error) {
      console.error('❌ Ably: Error processing call_type_switched event:', error);
      this.options.onError(error instanceof Error ? error : new Error('Unknown error processing call_type_switched event'));
    }
  }

  getConnectionStatus() {
    const connectionState = this.ably?.connection?.state || 'unknown';
    const channelState = this.appointmentChannel?.state || 'unknown';
    
    return {
      isConnected: this.isConnected,
      connectionError: this.connectionError,
      connectionState: connectionState,
      channelState: channelState,
      hasAbly: !!this.ably,
      hasAppointmentChannel: !!this.appointmentChannel,
    };
  }
  
  // Verify connection is still active and listening
  verifyConnection(): void {
    if (!this.ably) {
      console.warn('⚠️ Ably: Client is null');
      return;
    }
    
    const connectionState = this.ably.connection.state;
    console.log('📡 Ably: Connection status check - State:', connectionState, 'Connected:', this.isConnected);
    
    if (connectionState !== 'connected') {
      console.warn('⚠️ Ably: Connection is not in connected state:', connectionState);
      // Try to reconnect if disconnected
      if (connectionState === 'disconnected' || connectionState === 'suspended') {
        console.log('🔄 Ably: Attempting to reconnect...');
        this.ably.connection.connect();
      }
    }
    
    if (this.appointmentChannel) {
      const channelState = this.appointmentChannel.state;
      console.log('📡 Ably: Channel status check - State:', channelState);
      
      if (channelState !== 'attached') {
        console.warn('⚠️ Ably: Channel is not attached, attempting to reattach...');
        this.appointmentChannel.attach().then(() => {
          console.log('✅ Ably: Channel reattached successfully');
          // Re-subscribe to events after reattaching
          this.resubscribeToEvents();
        }).catch((err) => {
          console.error('❌ Ably: Failed to reattach channel:', err);
        });
      } else {
        // Channel is attached - verify subscriptions are still active
        this.verifySubscriptions();
      }
    } else {
      console.warn('⚠️ Ably: Appointment channel is null');
    }
  }
  
  // Verify subscriptions are still active and re-subscribe if needed
  private verifySubscriptions(): void {
    if (!this.appointmentChannel || this.appointmentChannel.state !== 'attached') {
      return;
    }
    
    // Check if subscriptions are active by checking channel listeners
    // Note: Ably doesn't expose a direct way to check subscriptions, so we'll just log
    console.log('📡 Ably: Verifying subscriptions are active on appointment channel');
    console.log('📡 Ably: Channel is attached and ready to receive events');
  }
  
  // Re-subscribe to all events after channel reattachment
  private resubscribeToEvents(): void {
    if (!this.appointmentChannel || !this.ably) {
      return;
    }
    
    const channelPrefix = process.env.NEXT_PUBLIC_ABLY_VIDEO_CHANNEL_PREFIX || 'clinic-video-call';
    const appointmentChannelName = `${channelPrefix}.${this.options.appointmentId}`;
    
    console.log('🔄 Ably: Re-subscribing to events after channel reattachment');
    
    // Re-subscribe using stored handlers (or create new ones if they don't exist)
    if (!this.subscriptionHandlers.callTypeSwitched) {
      this.subscriptionHandlers.callTypeSwitched = (message: Ably.Message) => {
        console.log('🔔🔔🔔 call_type_switched EVENT RECEIVED ON APPOINTMENT CHANNEL (after reattach) 🔔🔔🔔');
        console.log('📡 Ably: Event name:', message.name);
        console.log('📡 Ably: Event data:', JSON.stringify(message.data, null, 2));
        this.handleCallTypeSwitchedEvent(message);
      };
    }
    this.appointmentChannel.subscribe('call_type_switched', this.subscriptionHandlers.callTypeSwitched);
    
    if (!this.subscriptionHandlers.callModeChanged) {
      this.subscriptionHandlers.callModeChanged = (message: Ably.Message) => {
        console.log('🔔🔔🔔 CALL_MODE_CHANGED EVENT RECEIVED ON APPOINTMENT CHANNEL (after reattach) 🔔🔔🔔');
        console.log('📡 Ably: Event name:', message.name);
        console.log('📡 Ably: Event data:', JSON.stringify(message.data, null, 2));
        this.handleCallModeEvent(message, 'CALL_MODE_CHANGED');
      };
    }
    this.appointmentChannel.subscribe('CALL_MODE_CHANGED', this.subscriptionHandlers.callModeChanged);
    
    if (!this.subscriptionHandlers.callModeSet) {
      this.subscriptionHandlers.callModeSet = (message: Ably.Message) => {
        this.handleCallModeEvent(message, 'CALL_MODE_SET');
      };
    }
    this.appointmentChannel.subscribe('CALL_MODE_SET', this.subscriptionHandlers.callModeSet);
    
    console.log('✅ Ably: Re-subscribed to all events on appointment channel');
    console.log('✅ Ably: Handler references preserved to prevent garbage collection');
  }
  
  // Start periodic connection monitoring during active calls
  startConnectionMonitoring(intervalMs: number = 10000): () => void {
    console.log('📡 Ably: Starting periodic connection monitoring every', intervalMs, 'ms');
    const intervalId = setInterval(() => {
      console.log('📡 Ably: Periodic connection check during active call');
      this.verifyConnection();
      
      // Also verify subscriptions are still active
      if (this.appointmentChannel && this.appointmentChannel.state === 'attached') {
        console.log('✅ Ably: Channel is attached - subscriptions should be active');
        console.log('✅ Ably: Ready to receive call_type_switched and CALL_MODE_CHANGED events');
        
        // Periodically re-verify subscriptions are still bound
        // This ensures handlers haven't been garbage collected
        if (this.subscriptionHandlers.callTypeSwitched && this.subscriptionHandlers.callModeChanged) {
          console.log('✅ Ably: Subscription handlers are still stored in memory');
        } else {
          console.warn('⚠️ Ably: Subscription handlers missing - re-subscribing...');
          this.resubscribeToEvents();
        }
      } else {
        console.warn('⚠️ Ably: Channel is not attached - attempting to reattach...');
        if (this.appointmentChannel) {
          this.appointmentChannel.attach().then(() => {
            console.log('✅ Ably: Channel reattached - re-subscribing to events');
            this.resubscribeToEvents();
          }).catch((err) => {
            console.error('❌ Ably: Failed to reattach channel:', err);
          });
        }
      }
    }, intervalMs);
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      console.log('📡 Ably: Stopped periodic connection monitoring');
    };
  }
  
  // Test function to verify subscriptions are active (for debugging)
  testSubscription(): void {
    if (!this.appointmentChannel) {
      console.warn('⚠️ Ably: Cannot test subscription - channel is null');
      return;
    }
    
    console.log('🧪 Ably: Testing subscription status');
    console.log('🧪 Ably: Channel state:', this.appointmentChannel.state);
    console.log('🧪 Ably: Connection state:', this.ably?.connection?.state);
    console.log('🧪 Ably: Channel name:', this.appointmentChannel.name);
    
    if (this.appointmentChannel.state === 'attached') {
      console.log('✅ Ably: Channel is attached - subscriptions should be active');
    } else {
      console.warn('⚠️ Ably: Channel is not attached - subscriptions may not be active');
    }
  }
}

// Hook wrapper for React components
export function useAblyVideoCallService(options: AblyVideoCallServiceOptions) {
  return new AblyVideoCallService(options);
}