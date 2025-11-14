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
  onDisconnect?: () => void;
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
      });
      
      channel.on('detached', () => {
        console.warn('⚠️ Ably: Appointment channel detached - reattaching...');
        // Try to reattach if channel gets detached
        setTimeout(() => {
          // Check if connection is still active before attempting to reattach
          if (!this.ably || this.ably.connection.state === 'closed' || this.ably.connection.state === 'failed') {
            console.warn('⚠️ Ably: Connection is closed, cannot reattach channel');
            return;
          }
          if (channel.state === 'detached') {
            channel.attach().then(() => {
              // Re-subscribe to events after reattachment
              this.resubscribeToEvents();
            }).catch((err) => {
              console.error('❌ Ably: Failed to reattach channel:', err);
            });
          }
        }, 1000);
      });
      
      channel.on('suspended', () => {
        console.warn('⚠️ Ably: Appointment channel suspended - will attempt to reattach');
        setTimeout(() => {
          // Check if connection is still active before attempting to reattach
          if (!this.ably || this.ably.connection.state === 'closed' || this.ably.connection.state === 'failed') {
            console.warn('⚠️ Ably: Connection is closed, cannot reattach suspended channel');
            return;
          }
          if (channel.state === 'suspended') {
            channel.attach().then(() => {
              // Re-subscribe to events after reattachment
              this.resubscribeToEvents();
            }).catch((err) => {
              console.error('❌ Ably: Failed to reattach suspended channel:', err);
            });
          }
        }, 1000);
      });
      
      channel.on('failed', (error) => {
        console.error('❌ Ably: Channel failed:', error);
        // Try to reattach on failure
        setTimeout(() => {
          // Check if connection is still active before attempting to reattach
          if (!this.ably || this.ably.connection.state === 'closed' || this.ably.connection.state === 'failed') {
            console.warn('⚠️ Ably: Connection is closed, cannot reattach after failure');
            return;
          }
          channel.attach().then(() => {
            // Re-subscribe to events after reattachment
            this.resubscribeToEvents();
          }).catch((err) => {
            console.error('❌ Ably: Failed to reattach after failure:', err);
          });
        }, 2000);
      });
      
      channel.on('update', (stateChange) => {
        // If channel becomes detached or suspended, try to reattach
        if (stateChange.current === 'detached' || stateChange.current === 'suspended') {
          setTimeout(() => {
            // Check if connection is still active before attempting to reattach
            if (!this.ably || this.ably.connection.state === 'closed' || this.ably.connection.state === 'failed') {
              console.warn('⚠️ Ably: Connection is closed, cannot reattach after state update');
              return;
            }
            channel.attach().then(() => {
              // Re-subscribe to events after reattachment
              this.resubscribeToEvents();
            }).catch((err) => {
              console.error('❌ Ably: Failed to reattach after update:', err);
            });
          }, 1000);
        }
      });
      
      // CRITICAL: Create handlers FIRST and store them to prevent garbage collection
      // This ensures handlers persist even if channel reattaches
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

      this.subscriptionHandlers.callTypeSwitched = (message: Ably.Message) => {
        this.handleCallTypeSwitchedEvent(message);
      };

      this.subscriptionHandlers.callModeSet = (message: Ably.Message) => {
        this.handleCallModeEvent(message, 'CALL_MODE_SET');
      };

      this.subscriptionHandlers.callModeChanged = (message: Ably.Message) => {
        this.handleCallModeEvent(message, 'CALL_MODE_CHANGED');
      };

      // Attach to channel FIRST, then subscribe AFTER attachment completes
      // IMPORTANT: Channel must stay attached during entire call to receive events
      channel.attach().then(() => {
        
        // Subscribe to events AFTER channel is attached
        // This ensures subscriptions are properly registered
        channel.subscribe('connect', this.subscriptionHandlers.connect);

        channel.subscribe('call_type_switched', this.subscriptionHandlers.callTypeSwitched);

        channel.subscribe('CALL_MODE_SET', this.subscriptionHandlers.callModeSet);

        channel.subscribe('CALL_MODE_CHANGED', this.subscriptionHandlers.callModeChanged);

        // Subscribe to disconnect events
        channel.subscribe('disconnect', (message: Ably.Message) => {
          console.log('🔌 Ably: Disconnect event received:', message);
          if (this.options.onDisconnect) {
            this.options.onDisconnect();
          }
        });
      }).catch((err) => {
        console.error('❌ Ably: Error attaching to appointment channel:', err);
      });

      // Subscribe to MOA calling events on clinic channel (if clinicId is provided)
      if (this.options.clinicId) {
        const clinicChannelName = `${channelPrefix}.clinic.${this.options.clinicId}`;
        const clinicChannel = ably.channels.get(clinicChannelName);
        this.clinicChannel = clinicChannel;

        // CRITICAL: Attach clinic channel BEFORE subscribing to ensure events are received
        clinicChannel.attach().then(() => {
          console.log('✅ Ably: Clinic channel attached successfully');
          
          // Subscribe to moa-calling events on clinic channel
          clinicChannel.subscribe('moa-calling', (message) => {
            try {
              console.log('📞 Ably: MOA-calling event received:', message);
              console.log('📞 Ably: Full message data:', JSON.stringify(message.data, null, 2));
              
              // Extract call_type from metadata - check ALL possible locations
              const metadata = message.data.metadata || [];
              let call_type: 'video' | 'audio' | undefined = undefined;
              
              // Try to get call_type from multiple sources (comprehensive check)
              if (message.data.call_type) {
                call_type = message.data.call_type as 'video' | 'audio';
                console.log('📞 Ably: Found call_type in message.data.call_type:', call_type);
              } else if (message.data.call_mode) {
                call_type = message.data.call_mode as 'video' | 'audio';
                console.log('📞 Ably: Found call_type in message.data.call_mode:', call_type);
              } else if (message.data.on_call_type) {
                call_type = message.data.on_call_type as 'video' | 'audio';
                console.log('📞 Ably: Found call_type in message.data.on_call_type:', call_type);
              } else if (Array.isArray(metadata) && typeof metadata[0] === 'object' && metadata[0] !== null) {
                const firstMeta = metadata[0] as Record<string, unknown>;
                call_type = (firstMeta.call_type || firstMeta.call_mode || firstMeta.on_call_type) as 'video' | 'audio' | undefined;
                console.log('📞 Ably: Found call_type in metadata[0]:', call_type);
              } else if (message.data.context?.call_type) {
                call_type = message.data.context.call_type as 'video' | 'audio';
                console.log('📞 Ably: Found call_type in message.data.context.call_type:', call_type);
              } else if (message.data.context?.call_mode) {
                call_type = message.data.context.call_mode as 'video' | 'audio';
                console.log('📞 Ably: Found call_type in message.data.context.call_mode:', call_type);
              } else if (message.data.context?.on_call_type) {
                call_type = message.data.context.on_call_type as 'video' | 'audio';
                console.log('📞 Ably: Found call_type in message.data.context.on_call_type:', call_type);
              }

              if (!call_type) {
                console.warn('⚠️ Ably: No call_type found in MOA-calling event, defaulting to video');
                call_type = 'video'; // Default to video if not specified
              }

              console.log('📞 Ably: Final call_type determined:', call_type);

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
                call_mode: call_type, // Also set call_mode for compatibility
              };

              console.log('📞 Ably: Calling onDoctorConnect with event:', event);
              this.options.onDoctorConnect(event);
            } catch (error) {
              console.error('❌ Ably: Error processing moa-calling event:', error);
              this.options.onError(error instanceof Error ? error : new Error('Unknown error processing moa-calling event'));
            }
          });
          // Subscribe to CALL_MODE_SET and CALL_MODE_CHANGED events on clinic channel (after attach)
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
        }).catch((err) => {
          console.error('❌ Ably: Error attaching to clinic channel:', err);
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
        } else if (eventType === 'disconnect' || messageName === 'disconnect') {
          console.log('🔌 Ably: Disconnect event received via catch-all listener:', message);
          if (this.options.onDisconnect) {
            this.options.onDisconnect();
          }
        }
      });

      if (this.clinicChannel) {
        // Subscribe to disconnect events on clinic channel
        this.clinicChannel.subscribe('disconnect', (message: Ably.Message) => {
          console.log('🔌 Ably: Disconnect event received on clinic channel:', message);
          if (this.options.onDisconnect) {
            this.options.onDisconnect();
          }
        });

        this.clinicChannel.subscribe((message) => {
          const messageName = message.name;
          const dataType = message.data && typeof message.data === 'object' && 'type' in message.data ? message.data.type : null;
          const eventType = messageName || dataType;
          
          if (eventType === 'call_type_switched' || messageName === 'call_type_switched') {
            this.handleCallTypeSwitchedEvent(message);
          } else if (eventType === 'CALL_MODE_CHANGED' || eventType === 'CALL_MODE_SET') {
            this.handleCallModeEvent(message, eventType as 'CALL_MODE_SET' | 'CALL_MODE_CHANGED');
          } else if (eventType === 'disconnect' || messageName === 'disconnect') {
            console.log('🔌 Ably: Disconnect event received on clinic channel via catch-all listener:', message);
            if (this.options.onDisconnect) {
              this.options.onDisconnect();
            }
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
      console.log('🔄 handleCallTypeSwitchedEvent: Processing event...');
      const data = message.data || {};
      
      console.log('🔄 handleCallTypeSwitchedEvent: Raw data:', data);
      console.log('🔄 handleCallTypeSwitchedEvent: Data type:', typeof data);
      console.log('🔄 handleCallTypeSwitchedEvent: Data.metadata:', data.metadata);
      
      // Extract on_call_type from multiple possible locations in the payload
      // Check if data itself has type property (as shown in the image)
      let on_call_type: 'video' | 'audio' | undefined;
      
      // First check if data has type and metadata structure like {type: "call_type_switched", metadata: {on_call_type: "audio"}}
      if (data.type === 'call_type_switched' && data.metadata && typeof data.metadata === 'object') {
        on_call_type = data.metadata.on_call_type;
      } else {
        // Try other locations
        on_call_type = (
          data.metadata?.on_call_type || 
          data.on_call_type || 
          data.context?.metadata?.on_call_type ||
          (data.metadata && typeof data.metadata === 'object' && 'on_call_type' in data.metadata ? data.metadata.on_call_type : undefined)
        ) as 'video' | 'audio' | undefined;
      }
      
      if (!on_call_type || (on_call_type !== 'video' && on_call_type !== 'audio')) {
        console.warn('⚠️ Ably: Invalid on_call_type in call_type_switched event:', on_call_type);
        console.warn('⚠️ Ably: Full data structure:', JSON.stringify(data, null, 2));
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
          console.error('❌ Ably: Callback error stack:', callbackError instanceof Error ? callbackError.stack : 'No stack trace');
        }
      } else {
        console.warn('⚠️ Ably: onCallModeChange callback not provided');
        console.warn('⚠️ Ably: Cannot process call_type_switched event - no callback handler');
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
    
    if (connectionState !== 'connected') {
      console.warn('⚠️ Ably: Connection is not in connected state:', connectionState);
      // Try to reconnect if disconnected
      if (connectionState === 'disconnected' || connectionState === 'suspended') {
        this.ably.connection.connect();
      }
    }
    
    if (this.appointmentChannel) {
      const channelState = this.appointmentChannel.state;
      
      if (channelState !== 'attached') {
        // Check if connection is still active before attempting to reattach
        if (connectionState === 'closed' || connectionState === 'failed') {
          console.warn('⚠️ Ably: Connection is closed, cannot reattach channel');
          return;
        }
        console.warn('⚠️ Ably: Channel is not attached, attempting to reattach...');
        this.appointmentChannel.attach().then(() => {
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
  }
  
  // Re-subscribe to all events after channel reattachment
  private resubscribeToEvents(): void {
    if (!this.appointmentChannel || !this.ably) {
      return;
    }
    
    const channelPrefix = process.env.NEXT_PUBLIC_ABLY_VIDEO_CHANNEL_PREFIX || 'clinic-video-call';
    const appointmentChannelName = `${channelPrefix}.${this.options.appointmentId}`;
    
    
    // Re-subscribe using stored handlers (or create new ones if they don't exist)
    if (!this.subscriptionHandlers.callTypeSwitched) {
      this.subscriptionHandlers.callTypeSwitched = (message: Ably.Message) => {
        this.handleCallTypeSwitchedEvent(message);
      };
    }
    this.appointmentChannel.subscribe('call_type_switched', this.subscriptionHandlers.callTypeSwitched);
    
    if (!this.subscriptionHandlers.callModeChanged) {
      this.subscriptionHandlers.callModeChanged = (message: Ably.Message) => {
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
    
  }
  
  // Start periodic connection monitoring during active calls
  startConnectionMonitoring(intervalMs: number = 10000): () => void {
    const intervalId = setInterval(() => {
      this.verifyConnection();
      
      // Also verify subscriptions are still active
      if (this.appointmentChannel && this.appointmentChannel.state === 'attached') {
        
        // Periodically re-verify subscriptions are still bound
        // This ensures handlers haven't been garbage collected
        if (this.subscriptionHandlers.callTypeSwitched && this.subscriptionHandlers.callModeChanged) {
        } else {
          console.warn('⚠️ Ably: Subscription handlers missing - re-subscribing...');
          this.resubscribeToEvents();
        }
      } else {
        console.warn('⚠️ Ably: Channel is not attached - attempting to reattach...');
        if (this.appointmentChannel && this.ably) {
          // Check if connection is still active before attempting to reattach
          if (this.ably.connection.state === 'closed' || this.ably.connection.state === 'failed') {
            console.warn('⚠️ Ably: Connection is closed, cannot reattach channel');
            return;
          }
          this.appointmentChannel.attach().then(() => {
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
    };
  }
  
  // Test function to verify subscriptions are active (for debugging)
  testSubscription(): void {
    if (!this.appointmentChannel) {
      console.warn('⚠️ Ably: Cannot test subscription - channel is null');
      return;
    }
    
    
    if (this.appointmentChannel.state === 'attached') {
    } else {
      console.warn('⚠️ Ably: Channel is not attached - subscriptions may not be active');
    }
  }
}

// Hook wrapper for React components
export function useAblyVideoCallService(options: AblyVideoCallServiceOptions) {
  return new AblyVideoCallService(options);
}