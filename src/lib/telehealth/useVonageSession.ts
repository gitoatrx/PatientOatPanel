/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiError } from "@/lib/types/api";
import { telehealthService } from "@/lib/services/telehealthService";

interface UseVonageSessionArgs {
  appointmentId: string;
  followupToken: string;
  participantName?: string;
  remoteContainer: HTMLDivElement | null;
  localContainer: HTMLDivElement | null;
}

interface Participant {
  connectionId: string;
  streamId?: string;
  hasVideo: boolean;
  hasAudio: boolean;
  isLocal: boolean;
}

// Chat message interface for signaling
export interface ChatMessage {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  type?: 'text' | 'image' | 'file';
  attachment?: {
    name: string;
    size: number;
    url?: string;
  };
}

// Typing indicator interface
export interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

// Call status constants (matching doctor-side implementation)
export const CALL_STATUSES = {
  IDLE: 'idle',
  LOADING: 'loading', 
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ENDED: 'ended',
  ERROR: 'error'
} as const;

export type CallStatus = typeof CALL_STATUSES[keyof typeof CALL_STATUSES];

interface UseVonageSessionResult {
  join: () => Promise<void>;
  leave: () => void;
  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  switchCamera: () => void;
  switchMicrophone: () => void;
  isConnected: boolean;
  isBusy: boolean;
  isMicMuted: boolean;
  isCameraOff: boolean;
  statusMessage: string;
  error?: string;
  clearError: () => void;
  participants: Participant[];
  printParticipants: () => void;
  checkExistingStreams: () => void;
  debugPublisherState: () => void;
  debugSessionConnections: () => void;
  startCameraPreview: () => Promise<void>;
  callStatus: CallStatus;
  participantCount: number;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  signalStrength: 'excellent' | 'good' | 'fair' | 'poor';
  audioLevel: number;
  audioDevices: Array<{ deviceId?: string; label?: string }>;
  currentAudioDevice: string | null;
  chatMessages: ChatMessage[];
  sendChatMessage: (content: string, type?: 'text' | 'image' | 'file', attachment?: any) => void;
  typingUsers: TypingUser[];
  sendTypingIndicator: () => void;
  stopTypingIndicator: () => void;
  clearChatHistory: () => void;
}

type VonagePublisher = {
  publishAudio: (enabled: boolean) => void;
  publishVideo: (enabled: boolean) => void;
  setVideoSource?: (deviceId: string) => Promise<void>;
  setAudioSource?: (deviceId: string) => Promise<void>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  stream?: {
    streamId?: string;
    hasAudio?: boolean;
    hasVideo?: boolean;
  };
  streamId?: string;
  hasVideo?: boolean;
  hasAudio?: boolean;
  destroy: () => void;
};

type VonageSession = {
  connection?: { connectionId?: string };
  connections?: any[];
  streams?: any[];
  sessionId?: string;
  disconnect: () => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
  connect: (token: string, callback: (err?: Error) => void) => void;
  publish: (publisher: VonagePublisher, callback: (err?: Error) => void) => void;
  subscribe: (
    stream: any,
    element: HTMLElement,
    options: { 
      insertMode: string; 
      width: string; 
      height: string;
      showControls?: boolean;
      controls?: boolean;
      style?: {
        buttonDisplayMode?: string;
        nameDisplayMode?: string;
        audioLevelDisplayMode?: string;
        archiveStatusDisplayMode?: string;
        backgroundImageURI?: string;
      };
    },
    callback: (err?: Error) => void,
  ) => void;
  unpublish: (publisher: VonagePublisher) => void;
};

declare global {
  interface Window {
    OT?: any;
  }
}

const VONAGE_SCRIPT_URL = "https://unpkg.com/@vonage/video-client@latest/dist/js/opentok.js";
// Application ID is now fetched from the API response
const TELEHEALTH_LOG_PREFIX = '[Telehealth]';
type TelehealthLogDetails = Record<string, unknown>;

const logInfo = (message: string, details?: TelehealthLogDetails) => {
  if (details) {
    console.info(TELEHEALTH_LOG_PREFIX, message, details);
  } else {
    console.info(TELEHEALTH_LOG_PREFIX, message);
  }
};

const logWarn = (message: string, details?: TelehealthLogDetails) => {
  if (details) {
    console.warn(TELEHEALTH_LOG_PREFIX, message, details);
  } else {
    console.warn(TELEHEALTH_LOG_PREFIX, message);
  }
};

const logError = (message: string, details?: TelehealthLogDetails) => {
  if (details) {
    console.error(TELEHEALTH_LOG_PREFIX, message, details);
  } else {
    console.error(TELEHEALTH_LOG_PREFIX, message);
  }
};

let vonageScriptPromise: Promise<void> | null = null;

const isApiError = (value: unknown): value is ApiError => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return "code" in candidate && "message" in candidate && "type" in candidate;
};

const loadVonageScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Vonage script can only be loaded in the browser"));
  }

  if (window.OT) {
    return Promise.resolve();
  }

  if (!vonageScriptPromise) {
    vonageScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${VONAGE_SCRIPT_URL}"]`,
      );
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load Vonage script")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = VONAGE_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Vonage script"));
      document.head.appendChild(script);
    });
  }

  return vonageScriptPromise;
};

const listVideoInputs = async (OT: any) => {
  const fallback: Array<{ kind?: string; deviceId?: string }> = [];
  const filterVideo = (devices: any) => {
    if (!Array.isArray(devices)) return fallback;
    return devices.filter((device) => device?.kind === "videoInput" && device?.deviceId);
  };

  return new Promise<Array<{ kind?: string; deviceId?: string }>>((resolve) => {
    try {
      OT.getDevices((error: Error | null, devices: any) => {
        if (error) {
          resolve(fallback);
        } else {
          resolve(filterVideo(devices));
        }
      });
    } catch (err: unknown) {
      void err;
      const maybePromise = OT.getDevices?.();
      if (maybePromise?.then) {
        maybePromise
          .then((devices: any) => resolve(filterVideo(devices)))
          .catch(() => resolve(fallback));
      } else {
        resolve(fallback);
      }
    }
  });
};

const listAudioInputs = async (OT: any) => {
  const fallback: Array<{ kind?: string; deviceId?: string; label?: string }> = [];
  const filterAudio = (devices: any) => {
    if (!Array.isArray(devices)) return fallback;
    return devices.filter((device) => device?.kind === "audioInput" && device?.deviceId);
  };

  return new Promise<Array<{ kind?: string; deviceId?: string; label?: string }>>((resolve) => {
    try {
      OT.getDevices((error: Error | null, devices: any) => {
        if (error) {
          resolve(fallback);
        } else {
          resolve(filterAudio(devices));
        }
      });
    } catch (err: unknown) {
      void err;
      const maybePromise = OT.getDevices?.();
      if (maybePromise?.then) {
        maybePromise
          .then((devices: any) => resolve(filterAudio(devices)))
          .catch(() => resolve(fallback));
      } else {
        resolve(fallback);
      }
    }
  });
};

const removeAllChildren = (element: HTMLElement | null) => {
  if (!element) return;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

const isValidJWTToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Each part should be base64 encoded
  try {
    parts.forEach(part => {
      if (!part) throw new Error('Empty part');
      // Basic base64 validation
      atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    });
    return true;
  } catch {
    return false;
  }
};

// Device availability check (matching doctor-side implementation)
const checkDeviceAvailability = async (): Promise<boolean> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
    const hasAudioDevice = devices.some(device => device.kind === 'audioinput');
    
    if (!hasVideoDevice) {
      throw new Error("No camera found. Please connect a camera and try again.");
    }
    
    if (!hasAudioDevice) {
      throw new Error("No microphone found. Please connect a microphone and try again.");
    }
    
    return true;
  } catch (error) {
    console.error("Device availability check failed:", error);
    throw error;
  }
};

export function useVonageSession({
  appointmentId,
  followupToken,
  participantName,
  remoteContainer,
  localContainer,
}: UseVonageSessionArgs): UseVonageSessionResult {
  const sessionRef = useRef<VonageSession | null>(null);
  const publisherRef = useRef<VonagePublisher | null>(null);
  const remoteContainerRef = useRef<HTMLDivElement | null>(remoteContainer);
  const localContainerRef = useRef<HTMLDivElement | null>(localContainer);
  const isJoiningRef = useRef(false);
  const videoDevicesRef = useRef<Array<{ deviceId?: string }>>([]);
  const currentVideoDeviceRef = useRef<string | null>(null);
  const audioDevicesRef = useRef<Array<{ deviceId?: string; label?: string }>>([]);
  const currentAudioDeviceRef = useRef<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [callStatus, setCallStatus] = useState<CallStatus>(CALL_STATUSES.IDLE);
  const [participantCount, setParticipantCount] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [signalStrength, setSignalStrength] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [audioLevel, setAudioLevel] = useState(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);







  // Clear chat messages when session ends
  const clearChatHistory = useCallback(() => {
    try {
      setChatMessages([]);
      console.log('🗑️ Cleared chat history');
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }, []);

  // Monitor video state changes
  useEffect(() => {
    console.log('🔴 Video state changed:', {
      isCameraOff,
      isVideoEnabled,
      isConnected,
      timestamp: new Date().toISOString()
    });
  }, [isCameraOff, isVideoEnabled, isConnected]);

  useEffect(() => {
    remoteContainerRef.current = remoteContainer;
  }, [remoteContainer]);

  useEffect(() => {
    localContainerRef.current = localContainer;
  }, [localContainer]);

  // Start camera preview when local container is ready
  useEffect(() => {
    const startCameraPreview = async () => {
      console.log('🔍 Attempting to start camera preview:', {
        localContainer: localContainerRef.current,
        containerExists: !!localContainerRef.current,
        containerId: localContainerRef.current?.id
      });

      if (!localContainerRef.current) {
        console.log('❌ Local container not ready yet, will retry...');
        return;
      }

      try {
        console.log('🎥 Requesting camera permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setPreviewStream(stream);

        const localEl = localContainerRef.current;
        if (localEl) {
          // Create a video element to show the preview
          const videoElement = document.createElement('video');
          videoElement.srcObject = stream;
          videoElement.autoplay = true;
          videoElement.muted = true;
          videoElement.playsInline = true;
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.objectFit = 'cover';

          // Clear the container and add the preview
          localEl.innerHTML = '';
          localEl.appendChild(videoElement);

          console.log('✅ Camera preview started successfully!', {
            container: localEl,
            videoElement: videoElement,
            stream: stream
          });
        }
      } catch (error) {
        console.log('❌ Camera preview failed:', error);
        // This is expected if permissions haven't been granted yet
      }
    };

    // Only start preview if we have a container
    if (localContainerRef.current) {
      startCameraPreview();
    }
  }, [localContainer]); // Depend on localContainer changes

  const resetContainers = useCallback(() => {
    removeAllChildren(remoteContainerRef.current);
    removeAllChildren(localContainerRef.current);
  }, []);

  const setIdleState = useCallback((message: string) => {
    setIsConnected(false);
    setIsMicMuted(false);
    setIsCameraOff(false);
    setIsBusy(false);
    setStatusMessage(message);
  }, []);

  const cleanup = useCallback(
    (options: { message?: string; fromDisconnect?: boolean } = {}) => {
      const { message, fromDisconnect } = options;

      try {
        publisherRef.current?.destroy();
      } catch (publishError) {
        console.warn("Error destroying publisher", publishError);
      }
      publisherRef.current = null;

      // Stop preview stream if it exists
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
        setPreviewStream(null);
      }

      if (sessionRef.current && !fromDisconnect) {
        try {
          // Clear the stream check interval
          const session = sessionRef.current as any;
          if (session.__streamCheckInterval) {
            clearInterval(session.__streamCheckInterval);
            session.__streamCheckInterval = null;
          }
          sessionRef.current.disconnect();
        } catch (sessionError) {
          console.warn("Error disconnecting session", sessionError);
        }
      }
      sessionRef.current = null;

      resetContainers();
      setParticipants([]); // Clear participants on cleanup
      setParticipantCount(0);
      setCallStatus(CALL_STATUSES.ENDED);
      setIdleState(message ?? "Call ended");
    },
    [resetContainers, setIdleState],
  );

  const join = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (isJoiningRef.current || isConnected) return;

    logInfo('join requested', { appointmentId, followupToken, isConnected, isBusy });

    const remoteEl = remoteContainerRef.current;
    const localEl = localContainerRef.current;
    
    console.log('🔴 Container check:', {
      remoteEl,
      localEl,
      remoteElExists: !!remoteEl,
      localElExists: !!localEl,
      remoteElId: remoteEl?.id,
      localElId: localEl?.id
    });
    
    if (!remoteEl || !localEl) {
      setError("The video interface is not ready yet. Please wait a moment and try again.");
      return;
    }

    isJoiningRef.current = true;
    setIsBusy(true);
    setError(undefined);
    setStatusMessage("Preparing your camera and microphone...");
    setCallStatus(CALL_STATUSES.LOADING);

    try {
      // Check device availability first (matching doctor-side implementation)
      try {
        await checkDeviceAvailability();
      } catch (deviceError) {
        console.error("Device availability check failed:", deviceError);
        setError(deviceError instanceof Error ? deviceError.message : "Device check failed");
        setCallStatus(CALL_STATUSES.ERROR);
        cleanup({ message: "Device check failed" });
        setIsBusy(false);
        isJoiningRef.current = false;
        return;
      }

      // Check if we already have a preview stream, if not create one
      let currentPreviewStream = previewStream;
      if (!currentPreviewStream) {
        try {
          currentPreviewStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setPreviewStream(currentPreviewStream);
          console.log('✅ Camera preview created during join process');
        } catch (mediaError) {
          console.warn("Permission preflight failed", mediaError);
          const reason = (mediaError as { name?: string } | undefined)?.name;
          let errorMessage = 'Unable to access your camera and microphone. Please check your device settings and try again.';
          
          // Specific error handling (matching doctor-side implementation)
          if (reason === 'NotAllowedError' || reason === 'PermissionDeniedError') {
            errorMessage = 'Camera and microphone access is required for video calls. Please allow access and try again.';
          } else if (reason === 'NotFoundError' || reason === 'DevicesNotFoundError') {
            errorMessage = 'No camera or microphone found. Please connect a camera and microphone and try again.';
          } else if (reason === 'NotReadableError' || reason === 'TrackStartError') {
            errorMessage = 'Camera or microphone is being used by another application. Please close other applications and try again.';
          }
          
          setError(errorMessage);
          setStatusMessage('Camera and microphone access failed');
          setCallStatus(CALL_STATUSES.ERROR);
          isJoiningRef.current = false;
          setIsBusy(false);
          return;
        }
      }

      setStatusMessage('Requesting secure session details...');

      const trimmedAppointmentId = appointmentId?.trim() ?? '';
      const trimmedToken = followupToken?.trim() ?? '';

      if (!trimmedAppointmentId || !trimmedToken) {
        setError('The appointment link is missing required information. Please use the secure link from your appointment reminder email.');
        setStatusMessage('Missing session details');
        cleanup({ message: 'Missing telehealth parameters' });
        setIsBusy(false);
        isJoiningRef.current = false;
        return;
      }

      let sessionIdentifier: string | undefined;
      let sessionToken: string | undefined;
      let applicationId: string | undefined;

      try {
        const sessionResponse = await telehealthService.getPatientVideoSession(trimmedAppointmentId, trimmedToken);

        if (!sessionResponse?.success || !sessionResponse.data) {
          setError('Unable to start the telehealth session. Please try again or contact support if the issue persists.');
          setStatusMessage('Unable to start session');
          cleanup({ message: 'Session fetch failed' });
          setIsBusy(false);
          isJoiningRef.current = false;
          return;
        }

        sessionIdentifier = sessionResponse.data.vonage_session_id;
        sessionToken = sessionResponse.data.token;
        applicationId = sessionResponse.data.application_id;
        
        // Debug logging for token validation
        console.log('🔍 Session Details from API:', {
          sessionId: sessionIdentifier,
          applicationId: applicationId,
          tokenLength: sessionToken?.length,
          tokenStarts: sessionToken?.substring(0, 20),
          tokenEnds: sessionToken?.substring(sessionToken.length - 20),
          apiEndpoint: 'Patient API Response'
        });
        
        // Clean the token - remove any extra whitespace or newlines
        if (sessionToken) {
          sessionToken = sessionToken.trim().replace(/\s+/g, '');
        }
        
        // Validate the token format
        if (!sessionToken || !isValidJWTToken(sessionToken)) {
          setError('The appointment link appears to be invalid or expired. Please request a new link from your healthcare provider.');
          setStatusMessage('Invalid token');
          cleanup({ message: 'Invalid token format' });
          setIsBusy(false);
          isJoiningRef.current = false;
          return;
        }
      } catch (sessionError) {
        console.error('Telehealth session fetch failed', sessionError);
        setError('Unable to connect to the telehealth service. Please check your internet connection and try again.');
        setStatusMessage('Connection failed');
        cleanup({ message: 'Session fetch failed' });
        setIsBusy(false);
        isJoiningRef.current = false;
        return;
      }

      if (!sessionIdentifier || !sessionToken || !applicationId) {
        setError('Unable to start the telehealth session. Please try again or contact support if the issue persists.');
        setStatusMessage('Missing session details');
        cleanup({ message: 'Incomplete session data' });
        setIsBusy(false);
        isJoiningRef.current = false;
        return;
      }

      await loadVonageScript();
      const OT = window.OT;
      if (!OT) {
        setError('Unable to load the video service. Please refresh the page and try again.');
        setStatusMessage('Service unavailable');
        cleanup({ message: 'Video service failed to load' });
        setIsBusy(false);
        isJoiningRef.current = false;
        return;
      }

      // Debug: Log the Vonage SDK version and API endpoints
      console.log('🔍 Vonage SDK Debug Info:', {
        sdkVersion: OT.version,
        scriptUrl: VONAGE_SCRIPT_URL,
        sessionId: sessionIdentifier,
        applicationId: applicationId,
        tokenLength: sessionToken?.length
      });

      // Only reset remote container, keep local preview until publisher is ready
      removeAllChildren(remoteContainerRef.current);
      setStatusMessage("Connecting to the secure session...");

      const session: VonageSession = OT.initSession(applicationId, sessionIdentifier);
      sessionRef.current = session;

      const handleStreamCreated = (event: any) => {
        const stream = event?.stream;
        const streamId: string | undefined = stream?.streamId;
        const connectionId: string | undefined = stream?.connection?.connectionId;

        console.log('🔴 HANDLE STREAM CREATED CALLED:', {
          stream: stream,
          streamId: streamId,
          connectionId: connectionId,
          currentConnectionId: session.connection?.connectionId,
          hasVideo: stream?.hasVideo,
          hasAudio: stream?.hasAudio,
          videoType: stream?.videoType,
          timestamp: new Date().toISOString()
        });

        if (!stream || !streamId || !connectionId) {
          console.log('❌ STREAM CREATED - Missing identifiers:', { streamId, connectionId });
          logWarn('stream created event missing identifiers', { streamId, connectionId });
          return;
        }

        const currentConnectionId = session.connection?.connectionId;
        if (currentConnectionId && connectionId === currentConnectionId) {
          console.log('🚫 STREAM CREATED - Ignoring own stream:', { streamId, connectionId, currentConnectionId });
          logInfo('ignoring local stream echo', { streamId, connectionId });
          return;
        }

        console.log('✅ STREAM CREATED - Processing remote stream:', {
          streamId: streamId,
          connectionId: connectionId,
          hasVideo: stream.hasVideo,
          hasAudio: stream.hasAudio,
          videoType: stream.videoType
        });

        logInfo('remote stream detected', {
          streamId,
          connectionId,
          hasVideo: !!stream.hasVideo,
          hasAudio: !!stream.hasAudio,
          videoType: stream.videoType ?? null,
        });

        const streamType: string = stream.videoType || (stream.hasVideo ? "camera" : "audio");
        const duplicateSelector = `[data-connection-id="${connectionId}"][data-stream-type="${streamType}"]`;
        const existingForConnection = remoteEl.querySelector<HTMLElement>(duplicateSelector);
        if (existingForConnection) {
          logWarn('removing previous remote stream container', { connectionId, streamType });
          existingForConnection.remove();
        }

        const existingWrapper = remoteEl.querySelector<HTMLElement>(`[data-stream-id="${streamId}"]`);
        if (existingWrapper) {
          logWarn('remote stream already rendered', { streamId });
          return;
        }

        const wrapper = document.createElement("div");
        wrapper.dataset.streamId = streamId;
        wrapper.dataset.connectionId = connectionId;
        wrapper.dataset.streamType = streamType;
        wrapper.dataset.participantName = `Participant ${connectionId.slice(-4)}`; // Use last 4 chars of connection ID
        wrapper.style.width = "100%";
        wrapper.style.height = "100%";
        wrapper.style.backgroundColor = "#1e293b";
        wrapper.style.border = "1px solid #374151";
        wrapper.style.cursor = "pointer";
        
        // Add click handler for focus functionality
        wrapper.addEventListener('click', () => {
          console.log('🎯 Participant clicked:', connectionId);
          // This will be handled by the video panel component
          const event = new CustomEvent('participantClick', {
            detail: { connectionId, streamId, participantName: wrapper.dataset.participantName }
          });
          document.dispatchEvent(event);
        });

        remoteEl.appendChild(wrapper);
        console.log('🔴 STREAM CONTAINER APPENDED:', {
          streamId: streamId,
          connectionId: connectionId,
          childCount: remoteEl.children.length,
          wrapper: wrapper,
          remoteEl: remoteEl
        });
        logInfo('remote stream container appended', { streamId, connectionId, childCount: remoteEl.children.length });

        // Add participant info overlay to the new remote stream
        addParticipantInfoOverlay(wrapper, `Participant ${connectionId.slice(-4)}`, 'remote', connectionId);

        console.log('🔴 ABOUT TO SUBSCRIBE TO STREAM:', {
          stream: stream,
          wrapper: wrapper,
          options: { insertMode: "append", width: "100%", height: "100%" },
          streamId: streamId,
          connectionId: connectionId
        });

        session.subscribe(
          stream,
          wrapper,
          { 
            insertMode: "append", 
            width: "100%", 
            height: "100%",
            // Disable default Vonage UI controls for subscribers
            showControls: false,
            controls: false,
            style: {
              buttonDisplayMode: "off",
              nameDisplayMode: "off",
              audioLevelDisplayMode: "off",
              archiveStatusDisplayMode: "off",
              backgroundImageURI: "off"
            }
          },
          (subscribeError?: Error) => {
            console.log('🔴 SUBSCRIBE CALLBACK CALLED:', {
              streamId: streamId,
              connectionId: connectionId,
              error: subscribeError,
              wrapper: wrapper,
              wrapperChildren: wrapper.children.length,
              timestamp: new Date().toISOString()
            });

            if (subscribeError) {
              console.error('❌ SUBSCRIBE ERROR:', subscribeError);
              const errorWithCode = subscribeError as { message?: string; code?: unknown };
              logError('failed to subscribe to remote stream', {
                streamId,
                connectionId,
                error: subscribeError.message,
                code: errorWithCode?.code,
              });
              wrapper.remove();
              return;
            }

            console.log('✅ SUBSCRIBE SUCCESS:', {
              streamId: streamId,
              connectionId: connectionId,
              wrapper: wrapper,
              wrapperChildren: wrapper.children.length
            });
            logInfo('remote stream subscribed', { streamId, connectionId });

            // ✅ Log successful doctor stream subscription
            console.log('🎉 Successfully subscribed to doctor stream!');
            console.log('📺 Remote stream ID:', streamId);
            console.log('🔗 Doctor connection ID:', connectionId);

            const newParticipant: Participant = {
              connectionId,
              streamId,
              hasVideo: !!stream.hasVideo,
              hasAudio: !!stream.hasAudio,
              isLocal: false,
            };

            setParticipants((prev) => {
              const existing = prev.find((participant) => participant.connectionId === connectionId);
              const nextParticipants = existing
                ? prev.map((participant) =>
                    participant.connectionId === connectionId ? { ...participant, ...newParticipant } : participant,
                  )
                : [...prev, newParticipant];

              setParticipantCount(nextParticipants.length + 1);
              return nextParticipants;
            });

            setStatusMessage("Connected");
            setCallStatus(CALL_STATUSES.CONNECTED);
          },
        );
      };
      const handleStreamDestroyed = (event: any) => {
        const streamId: string | undefined = event.stream?.streamId;
        const connectionId: string | undefined = event.stream?.connection?.connectionId;

        logInfo('remote stream ended', { streamId, connectionId });

        if (streamId) {
          const maybeNode = remoteEl.querySelector<HTMLElement>(`[data-stream-id="${streamId}"]`);
          if (maybeNode) {
            maybeNode.remove();
          }
        }

        if (connectionId) {
          setParticipants((prev) => {
            const updated = prev.filter((participant) => participant.connectionId !== connectionId);
            setParticipantCount(updated.length + 1);
            return updated;
          });
        }

        if (!remoteEl.hasChildNodes()) {
          logInfo('waiting for clinician stream');
          setStatusMessage("Waiting for the clinician to join");
        }
      };
      const handleSessionReconnecting = () => {
        logWarn('session reconnecting');
        setStatusMessage("Reconnecting...");
        setCallStatus(CALL_STATUSES.RECONNECTING);
      };

      const handleSessionReconnected = () => {
        logInfo('session reconnected');
        setStatusMessage("Connected");
        setCallStatus(CALL_STATUSES.CONNECTED);
      };

      const handleSessionDisconnected = (event: any) => {
        logWarn('session disconnected', { reason: event?.reason });
        cleanup({ message: "Call ended", fromDisconnect: true });
      };

      session.on("streamCreated", (event: any) => {
        console.log('🔴 STREAM CREATED EVENT RECEIVED:', {
          streamId: event.stream?.streamId,
          connectionId: event.stream?.connection?.connectionId,
          hasVideo: event.stream?.hasVideo,
          hasAudio: event.stream?.hasAudio,
          videoType: event.stream?.videoType,
          currentConnectionId: session.connection?.connectionId,
          isOwnStream: event.stream?.connection?.connectionId === session.connection?.connectionId,
          timestamp: new Date().toISOString(),
          event: event
        });
        
        logInfo('session event: streamCreated', {
          streamId: event.stream?.streamId,
          connectionId: event.stream?.connection?.connectionId,
          hasVideo: event.stream?.hasVideo,
          hasAudio: event.stream?.hasAudio,
          videoType: event.stream?.videoType,
        });
        handleStreamCreated(event);
      });

      session.on("streamDestroyed", (event: any) => {
        logInfo('session event: streamDestroyed', {
          streamId: event.stream?.streamId,
          connectionId: event.stream?.connection?.connectionId,
        });
        handleStreamDestroyed(event);
      });

      // Note: sessionConnected event is handled in the session.connect callback
      // to ensure proper publish flow

      // ✅ Add connection event listener to track when doctor joins
      session.on("connectionCreated", (event: any) => {
        console.log("🔴 NEW CONNECTION CREATED (Doctor joined):", {
          connectionId: event.connection?.connectionId,
          data: event.connection?.data,
          creationTime: event.connection?.creationTime,
          sessionId: sessionIdentifier,
          timestamp: new Date().toISOString(),
          isOwnConnection: event.connection?.connectionId === session.connection?.connectionId
        });

        // Check if this is a doctor connection (not our own)
        if (event.connection?.connectionId !== session.connection?.connectionId) {
          console.log("👨‍⚕️ DOCTOR CONNECTION DETECTED - Checking for streams...");
          
          // Check existing streams for this connection
          const existingStreams = Array.isArray(session.streams) ? session.streams : [];
          const doctorStreams = existingStreams.filter((stream: any) => 
            stream.connection?.connectionId === event.connection?.connectionId
          );
          
          console.log("🔍 Doctor stream analysis:", {
            doctorConnectionId: event.connection?.connectionId,
            totalStreamsInSession: existingStreams.length,
            doctorStreamsFound: doctorStreams.length,
            doctorStreams: doctorStreams.map((stream: any) => ({
              streamId: stream.streamId,
              hasVideo: stream.hasVideo,
              hasAudio: stream.hasAudio,
              videoType: stream.videoType
            }))
          });

          if (doctorStreams.length === 0) {
            console.log("🚨 ISSUE: Doctor joined but has NO streams published!");
            console.log("🚨 This means the doctor connected but didn't start their camera/microphone.");
            console.log("🚨 The doctor needs to click 'Start Camera' or 'Join with Video' on their end.");
          } else {
            console.log("✅ Doctor has published streams - subscription should work");
          }
        }
      });

      session.on("connectionDestroyed", (event: any) => {
        console.log("🔴 CONNECTION DESTROYED (Doctor left):", {
          connectionId: event.connection?.connectionId,
          reason: event.reason,
          sessionId: sessionIdentifier,
          timestamp: new Date().toISOString()
        });
      });

      // Add chat signaling event listener
      session.on("signal:msg", (event: any) => {
        console.log('🔴 CHAT MESSAGE RECEIVED:', {
          data: event.data,
          from: event.from?.connectionId,
          currentConnectionId: session.connection?.connectionId,
          type: event.type,
          timestamp: new Date().toISOString()
        });

        // Prevent echo - don't process messages from our own connection
        if (event.from?.connectionId === session.connection?.connectionId) {
          console.log('🚫 Ignoring own message echo');
          return;
        }

        if (event.data) {
          try {
            const messageData = JSON.parse(event.data);
            const newMessage: ChatMessage = {
              id: `received_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              author: messageData.author,
              content: messageData.content,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isOwn: false,
              type: messageData.type || 'text',
              attachment: messageData.attachment,
            };
            
            setChatMessages(prev => [...prev, newMessage]);
          } catch (e) {
            // Fallback for old format
            const messageData = event.data.split(': ');
            const author = messageData[0];
            const content = messageData.slice(1).join(': ');
            
            const newMessage: ChatMessage = {
              id: `received_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              author: author,
              content: content,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isOwn: false,
              type: 'text',
            };
            
            setChatMessages(prev => [...prev, newMessage]);
          }
        }
      });

      // Add typing indicator event listener
      session.on("signal:typing", (event: any) => {
        // Prevent echo - don't process typing from our own connection
        if (event.from?.connectionId === session.connection?.connectionId) {
          return;
        }

        if (event.data) {
          try {
            const typingData = JSON.parse(event.data);
            const typingUser: TypingUser = {
              id: event.from?.connectionId || 'unknown',
              name: typingData.name,
              timestamp: Date.now(),
            };
            
            setTypingUsers(prev => {
              const filtered = prev.filter(user => user.id !== typingUser.id);
              return [...filtered, typingUser];
            });

            // Remove typing indicator after 3 seconds
            setTimeout(() => {
              setTypingUsers(prev => prev.filter(user => user.id !== typingUser.id));
            }, 3000);
          } catch (e) {
            console.error('Error parsing typing data:', e);
          }
        }
      });

      session.on("sessionReconnecting", handleSessionReconnecting);
      session.on("sessionReconnected", handleSessionReconnected);
      session.on("sessionDisconnected", handleSessionDisconnected);

      const videoInputs = await listVideoInputs(OT);
      videoDevicesRef.current = videoInputs;
      currentVideoDeviceRef.current = videoInputs[0]?.deviceId ?? null;

      const audioInputs = await listAudioInputs(OT);
      audioDevicesRef.current = audioInputs;
      currentAudioDeviceRef.current = audioInputs[0]?.deviceId ?? null;

      const publisherOptions: Record<string, unknown> = {
        insertMode: "append",
        width: "100%",
        height: "100%",
        publishAudio: true,
        publishVideo: true,
        // Disable default Vonage UI controls
        showControls: false,
        controls: false,
        style: {
          buttonDisplayMode: "off",
          nameDisplayMode: "off",
          audioLevelDisplayMode: "off",
          archiveStatusDisplayMode: "off",
          backgroundImageURI: "off"
        },
        // Enable signal strength monitoring
        enableAudioLevelDisplay: true,
        enableVideoLevelDisplay: true
      };

      // Use the existing preview stream if available
      if (currentPreviewStream) {
        publisherOptions.videoSource = currentPreviewStream.getVideoTracks()[0];
        publisherOptions.audioSource = currentPreviewStream.getAudioTracks()[0];
        console.log('✅ Using existing preview stream for publisher');
      } else if (currentVideoDeviceRef.current) {
        publisherOptions.videoSource = currentVideoDeviceRef.current;
      }

      let publisher: VonagePublisher | null = null;
      let publisherErrorOccurred = false;
      const handlePublisherError = (publisherError?: Error) => {
        if (!publisherError) return;
        publisherErrorOccurred = true;
        const reason = (publisherError as Error & { name?: string }).name;
        if (reason === 'PermissionDeniedError' || reason === 'NotAllowedError') {
          setError('We need access to your camera and microphone. Please allow access in your browser and try again.');
          setStatusMessage('Camera and microphone blocked');
        } else {
          setError('Unable to access your camera. Please check your camera permissions and try again.');
        }
        cleanup({ message: 'Camera and microphone blocked' });
        setIsBusy(false);
        isJoiningRef.current = false;
        return;
      };

      console.log('🔴 Creating Vonage publisher with options:', {
        publisherOptions,
        localEl,
        hasPreviewStream: !!currentPreviewStream,
        containerExists: !!localEl
      });

      // Clear the container before creating the publisher to avoid duplicate videos
      if (localEl) {
        localEl.innerHTML = '';
        console.log('🧹 Cleared local container before creating publisher');
      }

      publisher = OT.initPublisher(localEl, publisherOptions, handlePublisherError);
      if (!publisher || publisherErrorOccurred) {
        console.log('❌ Publisher creation failed or error occurred');
        isJoiningRef.current = false;
        return;
      }

      console.log('✅ Vonage publisher created successfully:', {
        publisher,
        streamId: publisher.streamId,
        hasVideo: publisher.hasVideo,
        hasAudio: publisher.hasAudio
      });

      // Don't add participant info overlay to local container
      // The controls should only show on remote participants' video feeds

      // Add signal strength monitoring
      if (publisher.on) {
        publisher.on('audioLevelUpdated', (event: any) => {
          const level = event.audioLevel || 0;
          setAudioLevel(level);
          
          // Update signal strength based on audio level
          if (level > 0.7) {
            setSignalStrength('excellent');
          } else if (level > 0.4) {
            setSignalStrength('good');
          } else if (level > 0.1) {
            setSignalStrength('fair');
          } else {
            setSignalStrength('poor');
          }
          
          // Detect speaking (threshold for speaking detection)
          const isSpeaking = level > 0.05 && !isMicMuted;
          
          // Dispatch events to update participant info controls
          document.dispatchEvent(new CustomEvent('signalStrengthUpdate'));
          document.dispatchEvent(new CustomEvent('speakingStatusUpdate', {
            detail: { 
              connectionId: sessionRef.current?.connection?.connectionId,
              isSpeaking: isSpeaking 
            }
          }));
        });

        publisher.on('videoDimensionsChanged', (event: any) => {
          console.log('📹 Video dimensions changed:', event);
        });
      }

      publisherRef.current = publisher;
      setIsMicMuted(false);
      setIsCameraOff(false);

      // Keep preview stream as backup until we confirm publisher is working
      // We'll stop it after successful publish
      console.log('🔄 Keeping preview stream as backup until publisher is confirmed working');

      console.log('🔴 About to connect to session:', {
        sessionId: sessionIdentifier,
        tokenLength: sessionToken.length,
        tokenPreview: sessionToken.substring(0, 20) + '...',
        applicationId: applicationId
      });

      session.connect(sessionToken, (connectError?: Error) => {
        console.log('🔴 Session connect callback called:', {
          error: connectError,
          sessionId: sessionIdentifier,
          connectionId: session.connection?.connectionId,
          timestamp: new Date().toISOString()
        });

        if (connectError) {
          console.error("❌ SESSION CONNECTION FAILED:", connectError);
          console.error("❌ Connection error details:", {
            name: connectError.name,
            message: connectError.message,
            code: (connectError as any).code,
            sessionId: sessionIdentifier,
            tokenLength: sessionToken?.length,
            stack: connectError.stack
          });
          
          // Provide more specific error messages based on the error
          let errorMessage = "Unable to connect to the call.";
          if (connectError.message?.includes('1004') || connectError.message?.includes('Invalid token')) {
            errorMessage = "Invalid session token. The appointment link may have expired or is invalid. Please request a new link.";
          } else if (connectError.message?.includes('1005') || connectError.message?.includes('Connection failed')) {
            errorMessage = "Connection failed. Please check your internet connection and try again.";
          } else if (connectError.message?.includes('1006') || connectError.message?.includes('Session not found')) {
            errorMessage = "Session not found. The appointment may have been cancelled or rescheduled.";
          }
          
          cleanup({ message: "Unable to join the session" });
          setError(errorMessage);
          return;
        }

        console.log('Successfully connected to session:', {
          sessionId: sessionIdentifier,
          connectionId: session.connection?.connectionId
        });

        setStatusMessage("Connected to session");
        setCallStatus(CALL_STATUSES.CONNECTED);
        setParticipantCount(1); // We are connected

        // Check for existing participants in the session
        console.log('🔍 Checking for existing participants...');
        const existingStreams = Array.isArray(session.streams) ? session.streams : [];
        console.log('Existing streams in session:', existingStreams.length);
        
        existingStreams.forEach((existingStream: any, index: number) => {
          console.log(`Existing stream ${index + 1}:`, {
            streamId: existingStream.streamId,
            connectionId: existingStream.connection?.connectionId,
            hasVideo: existingStream.hasVideo,
            hasAudio: existingStream.hasAudio,
            isOwn: existingStream.connection?.connectionId === session.connection?.connectionId
          });
          
          // If this is not our own stream, trigger subscription
          if (existingStream.connection?.connectionId !== session.connection?.connectionId) {
            console.log('🔄 Triggering subscription to existing stream:', existingStream.streamId);
            // Simulate a streamCreated event for existing streams
            setTimeout(() => {
              handleStreamCreated({ stream: existingStream });
            }, 100);
          }
        });

        console.log('🔴 About to publish local stream:', {
          publisher: publisher,
          hasVideo: !isCameraOff,
          hasAudio: !isMicMuted,
          sessionConnected: !!session.connection,
          connectionId: session.connection?.connectionId,
          publisherStreamId: publisher.streamId
        });

        session.publish(publisher, (publishError?: Error) => {
          console.log('🔴 Publish callback called:', {
            error: publishError,
            publisher: publisher,
            streamId: publisher.streamId,
            hasVideo: publisher.hasVideo,
            hasAudio: publisher.hasAudio,
            connectionId: session.connection?.connectionId
          });

          if (publishError) {
            console.error("❌ PUBLISH ERROR:", publishError);
            console.error("❌ Publish error details:", {
              message: publishError.message,
              code: (publishError as any).code,
              name: publishError.name,
              stack: publishError.stack
            });
            
            // Check for specific error types
            let errorMessage = "Unable to share your camera. Please check your camera permissions and try again.";
            if (publishError.message.includes('camera') || publishError.message.includes('video')) {
              errorMessage = "Camera access denied or unavailable. Please check your camera permissions and try again.";
            } else if (publishError.message.includes('microphone') || publishError.message.includes('audio')) {
              errorMessage = "Microphone access denied or unavailable. Please check your microphone permissions and try again.";
            } else if (publishError.message.includes('device')) {
              errorMessage = "Camera or microphone is being used by another application. Please close other applications and try again.";
            } else {
              errorMessage = `Unable to share your camera: ${publishError.message}`;
            }
            
            setError(errorMessage);
            cleanup({ message: "Unable to share your camera" });
            setIsBusy(false);
            isJoiningRef.current = false;
            return;
          }

          console.log("✅ Successfully published local stream:", {
            streamId: publisher.streamId,
            hasVideo: publisher.hasVideo,
            hasAudio: publisher.hasAudio,
            connectionId: session.connection?.connectionId
          });

          // Add local participant to tracking
          const localConnectionId = session.connection?.connectionId;
          if (localConnectionId) {
            const localParticipant: Participant = {
              connectionId: localConnectionId,
              streamId: publisher.streamId, // Now we have the stream ID
              hasVideo: !isCameraOff,
              hasAudio: !isMicMuted,
              isLocal: true
            };
            
            console.log('🔴 Adding local participant to tracking:', localParticipant);
            
            setParticipants(prev => {
              const existing = prev.find(p => p.connectionId === localConnectionId);
              if (existing) {
                return prev.map(p => 
                  p.connectionId === localConnectionId 
                    ? { ...p, ...localParticipant }
                    : p
                );
              } else {
                return [...prev, localParticipant];
              }
            });
          }

          // Now that publisher is working, stop the preview stream
          if (previewStream) {
            previewStream.getTracks().forEach(track => track.stop());
            setPreviewStream(null);
            console.log('✅ Preview stream stopped after successful publish');
          }

          // Add a fallback check - if video doesn't appear in 3 seconds, restore preview
          setTimeout(() => {
            const localEl = localContainerRef.current;
            if (localEl && localEl.children.length === 0) {
              console.log('⚠️ No video detected in local container, restoring preview stream');
              // Restart camera preview as fallback
              navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                  // Ensure container is clear before adding fallback video
                  localEl.innerHTML = '';
                  
                  const videoElement = document.createElement('video');
                  videoElement.srcObject = stream;
                  videoElement.autoplay = true;
                  videoElement.muted = true;
                  videoElement.playsInline = true;
                  videoElement.style.width = '100%';
                  videoElement.style.height = '100%';
                  videoElement.style.objectFit = 'cover';
                  
                  localEl.appendChild(videoElement);
                  console.log('✅ Fallback preview stream restored');
                })
                .catch(error => {
                  console.log('❌ Failed to restore fallback preview:', error);
                });
            }
          }, 3000);

          setIsConnected(true);
          setIsBusy(false);
          isJoiningRef.current = false;
          setStatusMessage("Connected - waiting for the clinician to join");

          // Start periodic check for doctor streams
          const checkDoctorStreams = () => {
            const session = sessionRef.current;
            if (!session) return;

            const existingStreams = Array.isArray(session.streams) ? session.streams : [];
            const connections = Array.isArray(session.connections) ? session.connections : [];
            const currentConnectionId = session.connection?.connectionId;

            // Find doctor connections (not our own)
            const doctorConnections = connections.filter((conn: any) => 
              conn.connectionId !== currentConnectionId
            );

            // Find doctor streams
            const doctorStreams = existingStreams.filter((stream: any) => 
              stream.connection?.connectionId !== currentConnectionId
            );

            console.log("🔍 Periodic doctor stream check:", {
              doctorConnections: doctorConnections.length,
              doctorStreams: doctorStreams.length,
              totalConnections: connections.length,
              totalStreams: existingStreams.length
            });

            if (doctorConnections.length > 0 && doctorStreams.length === 0) {
              console.log("🚨 DOCTOR CONNECTED BUT NO STREAMS - This is the issue!");
              setStatusMessage("Doctor joined but hasn't started their camera. Please ask them to turn on their camera.");
            } else if (doctorConnections.length === 0) {
              setStatusMessage("Connected - waiting for the clinician to join");
            } else if (doctorStreams.length > 0) {
              setStatusMessage("Connected with doctor");
            }
          };

          // Check immediately and then every 5 seconds
          checkDoctorStreams();
          const streamCheckInterval = setInterval(checkDoctorStreams, 5000);

          // Store interval ID for cleanup
          (session as any).__streamCheckInterval = streamCheckInterval;
        });
      });
    } catch (joinError: any) {
      console.error("Failed to start telehealth session", joinError);
      setError("Unable to start the telehealth session. Please try again or contact support if the issue persists.");
      cleanup({ message: "We hit a snag connecting" });
    } finally {
      isJoiningRef.current = false;
      setIsBusy(false);
    }
  }, [appointmentId, cleanup, followupToken, isConnected, participantName, resetContainers]);

  const leave = useCallback(() => {
    if (!sessionRef.current) {
      cleanup({ message: "Call ended", fromDisconnect: true });
      return;
    }
    try {
      sessionRef.current.disconnect();
    } catch (disconnectError) {
      console.warn("Error disconnecting session", disconnectError);
    }
    cleanup({ message: "Call ended", fromDisconnect: true });
    // Clear chat history when leaving the session
    clearChatHistory();
  }, [cleanup, clearChatHistory]);

  const toggleMic = useCallback(async () => {
    const publisher = publisherRef.current;
    if (!publisher) return;
    const nextMuted = !isMicMuted;
    publisher.publishAudio(!nextMuted);
    setIsMicMuted(nextMuted);
    setIsAudioEnabled(!nextMuted);
    
    // Dispatch mic status update event for local participant
    const event = new CustomEvent('micStatusUpdate', {
      detail: { 
        connectionId: sessionRef.current?.connection?.connectionId,
        isMuted: nextMuted 
      }
    });
    document.dispatchEvent(event);
  }, [isMicMuted]);

  const toggleCamera = useCallback(async () => {
    const publisher = publisherRef.current;
    if (!publisher) {
      console.log('❌ Cannot toggle camera: No publisher available');
      return;
    }
    
    const nextOff = !isCameraOff;
    console.log('🔴 Toggling camera:', {
      currentState: isCameraOff ? 'OFF' : 'ON',
      newState: nextOff ? 'OFF' : 'ON',
      publisher: publisher,
      hasVideo: publisher.hasVideo,
      streamId: publisher.streamId
    });
    
    publisher.publishVideo(!nextOff);
    setIsCameraOff(nextOff);
    setIsVideoEnabled(!nextOff);
    
    console.log('🔴 Camera toggle completed:', {
      newState: nextOff ? 'OFF' : 'ON',
      publisherHasVideo: publisher.hasVideo,
      isVideoEnabled: !nextOff
    });
  }, [isCameraOff]);

  const switchCamera = useCallback(async () => {
    const publisher = publisherRef.current;
    if (!publisher) return;

    const devices = videoDevicesRef.current;
    if (!devices.length) {
      const OT = window.OT;
      if (OT) {
        const refreshed = await listVideoInputs(OT);
        videoDevicesRef.current = refreshed;
      }
    }

    const available = videoDevicesRef.current;
    if (!available.length) return;

    const currentId = currentVideoDeviceRef.current;
    const currentIndex = available.findIndex((device) => device.deviceId === currentId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % available.length;
    const nextDeviceId = available[nextIndex]?.deviceId;
    if (!nextDeviceId) return;

    try {
      if (typeof publisher.setVideoSource === "function") {
        await publisher.setVideoSource(nextDeviceId);
        currentVideoDeviceRef.current = nextDeviceId;
        return;
      }
    } catch (error) {
      console.warn("setVideoSource failed, republishing", error);
    }

    try {
      const session = sessionRef.current;
      if (!session) return;

      session.unpublish(publisher);
      publisher.destroy();

      const OT = window.OT;
      if (!OT) return;

      const localEl = localContainerRef.current;
      if (!localEl) return;

      const newPublisher: VonagePublisher = OT.initPublisher(
        localEl,
        {
          insertMode: "append",
          width: "100%",
          height: "100%",
          publishAudio: !isMicMuted,
          publishVideo: !isCameraOff,
          videoSource: nextDeviceId,
        },
        (publisherError?: Error) => {
          if (publisherError) {
            isJoiningRef.current = false;
        return;
          }
        },
      );

      publisherRef.current = newPublisher;
      currentVideoDeviceRef.current = nextDeviceId;
      session.publish(newPublisher, (publishError?: Error) =>
        publishError && console.error("Re-publish error", publishError),
      );
    } catch (switchError) {
      console.error("Unable to switch camera", switchError);
      setError("Unable to switch camera. Please try leaving and rejoining the call.");
    }
  }, [isCameraOff, isMicMuted]);


  const switchMicrophone = useCallback(async () => {
    const publisher = publisherRef.current;
    if (!publisher) return;

    const devices = audioDevicesRef.current;
    if (!devices.length) {
      const OT = window.OT;
      if (OT) {
        const refreshed = await listAudioInputs(OT);
        audioDevicesRef.current = refreshed;
      }
    }

    const available = audioDevicesRef.current;
    if (!available.length) return;

    const currentId = currentAudioDeviceRef.current;
    const currentIndex = available.findIndex((device) => device.deviceId === currentId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % available.length;
    const nextDeviceId = available[nextIndex]?.deviceId;
    if (!nextDeviceId) return;

    try {
        if (typeof publisher.setAudioSource === "function") {
          await publisher.setAudioSource(nextDeviceId);
          currentAudioDeviceRef.current = nextDeviceId;
          console.log('🎤 Switched to microphone:', available[nextIndex]?.label || nextDeviceId);
          
          // Dispatch event to update participant info controls
          document.dispatchEvent(new CustomEvent('audioDeviceUpdate'));
          return;
        }
    } catch (error) {
      console.warn('Failed to switch microphone using setAudioSource:', error);
    }

    // Fallback: recreate publisher with new audio source
    try {
      const session = sessionRef.current;
      if (!session) return;

      const localEl = localContainerRef.current;
      if (!localEl) return;

      const OT = window.OT;
      if (!OT) return;
      
      const newPublisher: VonagePublisher = OT.initPublisher(
        localEl,
        {
          insertMode: "append",
          width: "100%",
          height: "100%",
          publishAudio: !isMicMuted,
          publishVideo: !isCameraOff,
          audioSource: nextDeviceId,
        },
        (publisherError?: Error) => {
          if (publisherError) {
            console.error("Microphone switch error", publisherError);
            return;
          }
        },
      );

          publisherRef.current = newPublisher;
          currentAudioDeviceRef.current = nextDeviceId;
          session.publish(newPublisher, (publishError?: Error) =>
            publishError && console.error("Re-publish error", publishError),
          );
          
          console.log('��� Switched to microphone:', available[nextIndex]?.label || nextDeviceId);
          
          // Dispatch event to update participant info controls
          document.dispatchEvent(new CustomEvent('audioDeviceUpdate'));
    } catch (switchError) {
      console.error("Unable to switch microphone", switchError);
      setError("Unable to switch microphone. Please try leaving and rejoining the call.");
    }
  }, [isCameraOff, isMicMuted]);

  const selectMicrophone = useCallback(async (deviceId: string) => {
    const publisher = publisherRef.current;
    if (!publisher || !deviceId) return;
    try {
      if (typeof publisher.setAudioSource === "function") {
        await publisher.setAudioSource(deviceId);
        currentAudioDeviceRef.current = deviceId;
        document.dispatchEvent(new CustomEvent('audioDeviceUpdate'));
      }
    } catch (err) {
      console.warn('Failed to set microphone device:', err);
    }
  }, []);

  // Function to add participant info overlay to any container
  const addParticipantInfoOverlay = useCallback((container: HTMLDivElement, participantName: string, type: 'local' | 'remote', connectionId?: string) => {
    // Check if overlay already exists
    if (container.querySelector('[data-participant-info-overlay]')) {
      return;
    }

    // Create participant info overlay (compact corner overlay like Zoom/Skype)
    const participantInfo = document.createElement("div");
    participantInfo.setAttribute('data-participant-info-overlay', 'true');
    participantInfo.style.position = "absolute";
    participantInfo.style.top = "8px";
    participantInfo.style.left = "8px";
    participantInfo.style.zIndex = "10";
    participantInfo.style.display = "flex";
    participantInfo.style.alignItems = "center";
    participantInfo.style.background = "rgba(0, 0, 0, 0.7)";
    participantInfo.style.borderRadius = "12px";
    participantInfo.style.padding = "4px 8px";
    participantInfo.style.backdropFilter = "blur(4px)";
    participantInfo.style.fontSize = "10px";
    participantInfo.style.height = "auto";
    participantInfo.style.width = "auto";
    participantInfo.style.maxWidth = "none";
    
    // Participant name (compact)
    const participantNameElement = document.createElement("div");
    participantNameElement.style.color = "white";
    participantNameElement.style.fontSize = "11px";
    participantNameElement.style.fontWeight = "500";
    participantNameElement.style.marginRight = "6px";
    participantNameElement.style.lineHeight = "1";
    participantNameElement.textContent = participantName;
    
    // Status indicators container (inline, compact)
    const controlsContainer = document.createElement("div");
    controlsContainer.style.display = "flex";
    controlsContainer.style.alignItems = "center";
    controlsContainer.style.gap = "4px";
    
    // Signal strength indicator (compact)
    const signalStrengthElement = document.createElement("div");
    signalStrengthElement.style.display = "flex";
    signalStrengthElement.style.alignItems = "center";
    signalStrengthElement.style.gap = "3px";
    
    // Function to update signal strength
    const updateSignalStrength = (strength: 'excellent' | 'good' | 'fair' | 'poor', audioLevel: number) => {
      const getBarColor = (barStrength: 'excellent' | 'good' | 'fair' | 'poor') => {
        switch (barStrength) {
          case 'excellent': return '#10b981'; // green
          case 'good': return '#eab308'; // yellow
          case 'fair': return '#f97316'; // orange
          case 'poor': return '#ef4444'; // red
          default: return '#6b7280'; // gray
        }
      };
      
      const getBarCount = (barStrength: 'excellent' | 'good' | 'fair' | 'poor') => {
        switch (barStrength) {
          case 'excellent': return 5;
          case 'good': return 4;
          case 'fair': return 3;
          case 'poor': return 2;
          default: return 1;
        }
      };
      
      const color = getBarColor(strength);
      const barCount = getBarCount(strength);
      const percentage = Math.round(audioLevel * 100);
      
      signalStrengthElement.innerHTML = `
        <div style="display: flex; align-items: end; gap: 1px;">
          <div style="width: 2px; height: 3px; background: ${barCount >= 1 ? color : '#374151'}; border-radius: 1px;"></div>
          <div style="width: 2px; height: 5px; background: ${barCount >= 2 ? color : '#374151'}; border-radius: 1px;"></div>
          <div style="width: 2px; height: 7px; background: ${barCount >= 3 ? color : '#374151'}; border-radius: 1px;"></div>
          <div style="width: 2px; height: 9px; background: ${barCount >= 4 ? color : '#374151'}; border-radius: 1px;"></div>
        </div>
      `;
    };
    
    // Initialize with current values
    if (type === 'local') {
      // For local participant, show your own signal strength
      updateSignalStrength(signalStrength, audioLevel);
    } else {
      // For remote participants, show a default "good" signal strength
      // In a real implementation, this would come from the remote participant's audio level
      updateSignalStrength('good', 0.5);
    }
    
    // No microphone selector for remote participants
    // Only show signal strength for remote participants
    
    // Always add signal strength indicator
    controlsContainer.appendChild(signalStrengthElement);

    // Microphone status indicator (compact)
    const micStatusElement = document.createElement("div");
    micStatusElement.style.display = "flex";
    micStatusElement.style.alignItems = "center";
    micStatusElement.style.gap = "2px";
    
    const micIcon = document.createElement("div");
    micIcon.innerHTML = "🎤";
    micIcon.style.fontSize = "10px";
    micIcon.style.opacity = "0.8";
    
    const micStatus = document.createElement("span");
    micStatus.style.color = "#10b981";
    micStatus.style.fontSize = "9px";
    micStatus.style.fontWeight = "500";
    micStatus.textContent = "ON";
    
    micStatusElement.appendChild(micIcon);
    micStatusElement.appendChild(micStatus);
    
    // Speaking status indicator (just icon, very compact)
    const speakingStatusElement = document.createElement("div");
    speakingStatusElement.style.display = "flex";
    speakingStatusElement.style.alignItems = "center";
    speakingStatusElement.style.opacity = "0";
    speakingStatusElement.style.transition = "opacity 0.3s ease";
    
    const speakingIcon = document.createElement("div");
    speakingIcon.innerHTML = "🔊";
    speakingIcon.style.fontSize = "10px";
    
    speakingStatusElement.appendChild(speakingIcon);
    
    // Add status indicators to controls
    controlsContainer.appendChild(micStatusElement);
    controlsContainer.appendChild(speakingStatusElement);

    // Function to update microphone status
    const updateMicStatus = (isMuted: boolean) => {
      micStatus.textContent = isMuted ? "OFF" : "ON";
      micStatus.style.color = isMuted ? "#ef4444" : "#10b981";
      micIcon.style.opacity = isMuted ? "0.4" : "0.8";
    };

    // Function to update speaking status
    const updateSpeakingStatus = (isSpeaking: boolean) => {
      speakingStatusElement.style.opacity = isSpeaking ? "1" : "0";
    };
    
    // Assemble the participant info (inline layout)
    participantInfo.appendChild(participantNameElement);
    participantInfo.appendChild(controlsContainer);
    
    // Add to container
    container.appendChild(participantInfo);
    
    // Add event listeners for dynamic updates
    const updateControls = () => {
      // For remote participants, we could update their signal strength here
      // For now, we'll keep it static since we don't have access to their audio levels
      // In a real implementation, this would come from the remote participant's audio level
    };

    // Listen for signal strength changes
    const signalStrengthListener = () => updateControls();
    document.addEventListener('signalStrengthUpdate', signalStrengthListener);

    // Listen for microphone status changes
    const micStatusListener = (event: any) => {
      if (connectionId && event.detail?.connectionId === connectionId) {
        updateMicStatus(event.detail.isMuted);
      }
    };
    document.addEventListener('micStatusUpdate', micStatusListener);

    // Listen for speaking status changes
    const speakingStatusListener = (event: any) => {
      if (connectionId && event.detail?.connectionId === connectionId) {
        updateSpeakingStatus(event.detail.isSpeaking);
      }
    };
    document.addEventListener('speakingStatusUpdate', speakingStatusListener);
    
    // Clean up listeners when container is cleared
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const hasOverlay = container.querySelector('[data-participant-info-overlay]');
        if (!hasOverlay) {
          document.removeEventListener('signalStrengthUpdate', signalStrengthListener);
          document.removeEventListener('micStatusUpdate', micStatusListener);
          document.removeEventListener('speakingStatusUpdate', speakingStatusListener);
          observer.disconnect();
        }
        }
      });
    });
    
    observer.observe(container, { childList: true, subtree: true });
  }, [signalStrength, audioLevel, switchMicrophone]);

  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  const sendChatMessage = useCallback((content: string, type: 'text' | 'image' | 'file' = 'text', attachment?: any) => {
    console.log('�� sendChatMessage called:', {
      content,
      type,
      attachment,
      hasSession: !!sessionRef.current,
      participantName,
      isConnected
    });
    
    if (!sessionRef.current || !participantName) {
      console.error('❌ Cannot send message: session or participant name missing', {
        hasSession: !!sessionRef.current,
        participantName
      });
      return;
    }
    
    if (!isConnected) {
      console.error('❌ Cannot send message: not connected to session');
      // Add a temporary message to show the user that the message couldn't be sent
      const tempMessage: ChatMessage = {
        id: `temp_${Date.now()}`,
        author: participantName,
        content: content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isOwn: true,
        type,
        attachment,
      };
      
      setChatMessages(prev => [...prev, tempMessage]);
      setError('Cannot send message: Please wait for the call to connect');
      return;
    }
    
    const messageData = JSON.stringify({
      author: participantName,
      content: content,
      type: type,
      attachment: attachment,
      timestamp: Date.now()
    });
    
    // Check message size (Vonage has a limit of ~8KB for signaling)
    const messageSize = new Blob([messageData]).size;
    console.log('🔴 Message size check:', {
      size: messageSize,
      sizeKB: Math.round(messageSize / 1024),
      hasAttachment: !!attachment,
      attachmentSize: attachment?.url ? new Blob([attachment.url]).size : 0
    });
    
    if (messageSize > 8000) { // 8KB limit
      console.warn('⚠️ Message too large for Vonage signaling. Consider reducing file size.');
      setError('File too large to send. Please use a smaller file (under 5KB).');
      return;
    }
    
    console.log('🔴 Sending signal:', {
      type: 'msg',
      data: messageData,
      sessionId: sessionRef.current.sessionId
    });
    
    (sessionRef.current as any).signal({
      type: 'msg',
      data: messageData
    }, (error?: Error) => {
      if (error) {
        console.error('❌ Failed to send chat message:', error);
      } else {
        console.log('✅ Chat message sent successfully');
        // Add message to local state immediately for better UX
        const newMessage: ChatMessage = {
          id: `sent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          author: participantName,
          content: content,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isOwn: true,
          type,
          attachment,
        };
        
        setChatMessages(prev => [...prev, newMessage]);
      }
    });
  }, [participantName, isConnected]);

  const sendTypingIndicator = useCallback(() => {
    if (!sessionRef.current || !participantName || !isConnected) return;
    
    const typingData = JSON.stringify({
      name: participantName,
      timestamp: Date.now()
    });
    
    (sessionRef.current as any).signal({
      type: 'typing',
      data: typingData
    });
  }, [participantName, isConnected]);

  const stopTypingIndicator = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, []);

  const printParticipants = useCallback(() => {
    console.log('=== CURRENT PARTICIPANTS ===');
    console.log(`Total participants: ${participants.length}`);
    participants.forEach((participant, index) => {
      console.log(`Participant ${index + 1}:`, {
        connectionId: participant.connectionId,
        streamId: participant.streamId,
        hasVideo: participant.hasVideo,
        hasAudio: participant.hasAudio,
        isLocal: participant.isLocal,
        type: participant.isLocal ? 'You' : 'Remote'
      });
    });
    console.log('============================');
    
    // Also display in a user-friendly format
    const localParticipant = participants.find(p => p.isLocal);
    const remoteParticipants = participants.filter(p => !p.isLocal);
    
    console.log('📱 You:', localParticipant ? 
      `Video: ${localParticipant.hasVideo ? '✅' : '❌'}, Audio: ${localParticipant.hasAudio ? '✅' : '❌'}` : 
      'Not connected');
    
    remoteParticipants.forEach((participant, index) => {
      console.log(`👨‍⚕️ Doctor ${index + 1}:`, 
        `Video: ${participant.hasVideo ? '✅' : '❌'}, Audio: ${participant.hasAudio ? '✅' : '❌'}`);
    });
    
    // Debug remote container state
    const remoteEl = remoteContainerRef.current;
    console.log('🔍 REMOTE CONTAINER DEBUG:', {
      remoteEl,
      exists: !!remoteEl,
      id: remoteEl?.id,
      className: remoteEl?.className,
      children: remoteEl?.children.length,
      innerHTML: remoteEl?.innerHTML.substring(0, 200) + '...'
    });
    
    if (remoteEl) {
      console.log('🔍 Remote container children:');
      Array.from(remoteEl.children).forEach((child, index) => {
        console.log(`  Child ${index}:`, {
          tagName: child.tagName,
          id: child.id,
          className: child.className,
          dataset: (child as HTMLElement).dataset,
          children: child.children.length
        });
      });
    }
  }, [participants]);

  const debugPublisherState = useCallback(() => {
    const publisher = publisherRef.current;
    const session = sessionRef.current;
    
    console.log('🔍 PUBLISHER DEBUG STATE:', {
      publisher: publisher,
      publisherExists: !!publisher,
      publisherStreamId: publisher?.streamId,
      publisherHasVideo: publisher?.hasVideo,
      publisherHasAudio: publisher?.hasAudio,
      session: session,
      sessionExists: !!session,
      sessionConnectionId: session?.connection?.connectionId,
      isConnected,
      isCameraOff,
      isVideoEnabled,
      isMicMuted,
      isAudioEnabled,
      timestamp: new Date().toISOString()
    });
  }, [isConnected, isCameraOff, isVideoEnabled, isMicMuted, isAudioEnabled]);

  const debugSessionConnections = useCallback(() => {
    const session = sessionRef.current;
    if (!session) {
      console.log('❌ No active session to debug connections');
      return;
    }

    // Ensure we have arrays to work with
    const connectionsArray = Array.isArray(session.connections) ? session.connections : [];
    const streamsArray = Array.isArray(session.streams) ? session.streams : [];

    console.log('🔍 SESSION CONNECTIONS DEBUG:', {
      sessionId: session.sessionId,
      connectionId: session.connection?.connectionId,
      connections: connectionsArray,
      streams: streamsArray,
      connectionsCount: connectionsArray.length,
      streamsCount: streamsArray.length,
      timestamp: new Date().toISOString()
    });

    // Log each connection
    connectionsArray.forEach((connection: any, index: number) => {
      console.log(`🔍 Connection ${index + 1}:`, {
        connectionId: connection.connectionId,
        data: connection.data,
        creationTime: connection.creationTime,
        isOwn: connection.connectionId === session.connection?.connectionId
      });
    });

    // Log each stream
    streamsArray.forEach((stream: any, index: number) => {
      console.log(`🔍 Stream ${index + 1}:`, {
        streamId: stream.streamId,
        connectionId: stream.connection?.connectionId,
        hasVideo: stream.hasVideo,
        hasAudio: stream.hasAudio,
        videoType: stream.videoType,
        isOwn: stream.connection?.connectionId === session.connection?.connectionId
      });
    });

    // Check if doctor has published a stream
    const doctorConnections = connectionsArray.filter((conn: any) => 
      conn.connectionId !== session.connection?.connectionId
    );
    
    const doctorStreams = streamsArray.filter((stream: any) => 
      stream.connection?.connectionId !== session.connection?.connectionId
    );

    console.log('🔍 DOCTOR STREAM ANALYSIS:', {
      doctorConnectionsCount: doctorConnections.length,
      doctorStreamsCount: doctorStreams.length,
      doctorConnections: doctorConnections.map((conn: any) => ({
        connectionId: conn.connectionId,
        creationTime: conn.creationTime
      })),
      doctorStreams: doctorStreams.map((stream: any) => ({
        streamId: stream.streamId,
        connectionId: stream.connection?.connectionId,
        hasVideo: stream.hasVideo,
        hasAudio: stream.hasAudio,
        videoType: stream.videoType
      }))
    });

    if (doctorConnections.length > 0 && doctorStreams.length === 0) {
      console.log('🚨 ISSUE FOUND: Doctor is connected but has NOT published any streams!');
      console.log('🚨 This means the doctor joined but did not start their camera/microphone.');
    } else if (doctorConnections.length === 0) {
      console.log('🚨 ISSUE FOUND: No doctor connections found!');
    } else if (doctorStreams.length > 0) {
      console.log('✅ Doctor has published streams - check subscription logic');
    }
  }, []);

  const startCameraPreview = useCallback(async () => {
    console.log('🎥 Manually starting camera preview...');

    if (!localContainerRef.current) {
      console.log('❌ No local container available');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPreviewStream(stream);

      const localEl = localContainerRef.current;
      if (localEl) {
        // Create a video element to show the preview
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';

        // Clear the container and add the preview
        localEl.innerHTML = '';
        localEl.appendChild(videoElement);

        console.log('✅ Manual camera preview started successfully!');
      }
    } catch (error) {
      console.error('❌ Manual camera preview failed:', error);
    }
  }, []);

  const checkExistingStreams = useCallback(() => {
    const session = sessionRef.current;
    if (!session) {
      console.log('❌ No active session to check streams');
      return;
    }

    console.log('🔍 MANUALLY CHECKING EXISTING STREAMS...');
    const existingStreams = Array.isArray(session.streams) ? session.streams : [];
    console.log('Total existing streams:', existingStreams.length);
    
    const currentConnectionId = session.connection?.connectionId;
    console.log('Current connection ID:', currentConnectionId);
    
    existingStreams.forEach((stream: any, index: number) => {
      const isOwn = stream.connection?.connectionId === currentConnectionId;
      console.log(`Stream ${index + 1}:`, {
        streamId: stream.streamId,
        connectionId: stream.connection?.connectionId,
        hasVideo: stream.hasVideo,
        hasAudio: stream.hasAudio,
        isOwn: isOwn,
        shouldSubscribe: !isOwn
      });
      
      if (!isOwn) {
        console.log('🔄 Manually subscribing to existing stream:', stream.streamId);
        // Manually trigger subscription to existing stream
        const remoteEl = remoteContainerRef.current;
        if (remoteEl) {
          const streamId = stream.streamId;
          const connectionId = stream.connection?.connectionId;
          
          // Create wrapper element
          const wrapper = document.createElement("div");
          wrapper.dataset.streamId = streamId;
          wrapper.dataset.connectionId = connectionId;
          wrapper.dataset.streamType = stream.hasVideo ? "camera" : "audio";
          wrapper.dataset.participantName = `Participant ${connectionId.slice(-4)}`; // Use last 4 chars of connection ID
          wrapper.style.width = "100%";
          wrapper.style.height = "100%";
          wrapper.style.backgroundColor = "#1e293b";
          wrapper.style.border = "1px solid #374151";
          wrapper.style.cursor = "pointer";
          wrapper.style.position = "relative";
          
          // Add loading message
          const loadingMessage = document.createElement("div");
          loadingMessage.style.color = "white";
          loadingMessage.style.padding = "10px";
          loadingMessage.style.textAlign = "center";
          loadingMessage.style.position = "absolute";
          loadingMessage.style.top = "50%";
          loadingMessage.style.left = "50%";
          loadingMessage.style.transform = "translate(-50%, -50%)";
          loadingMessage.style.zIndex = "5";
          loadingMessage.textContent = "Loading...";
          
          wrapper.appendChild(loadingMessage);
          
          // Add participant info overlay
          addParticipantInfoOverlay(wrapper, `Participant ${connectionId.slice(-4)}`, 'remote', connectionId);
          
          // Add click handler for focus functionality
          wrapper.addEventListener('click', () => {
            console.log('🎯 Participant clicked:', connectionId);
            // This will be handled by the video panel component
            const event = new CustomEvent('participantClick', {
              detail: { connectionId, streamId, participantName: wrapper.dataset.participantName }
            });
            document.dispatchEvent(event);
          });
          
          remoteEl.appendChild(wrapper);
          
          // Subscribe to the stream
          session.subscribe(stream, wrapper, { 
            insertMode: "append", 
            width: "100%", 
            height: "100%",
            // Disable default Vonage UI controls for subscribers
            showControls: false,
            controls: false,
            style: {
              buttonDisplayMode: "off",
              nameDisplayMode: "off",
              audioLevelDisplayMode: "off",
              archiveStatusDisplayMode: "off",
              backgroundImageURI: "off"
            }
          }, (error?: Error) => {
            if (error) {
              console.error('❌ Manual subscription failed:', error);
            } else {
              console.log('✅ Manual subscription successful:', streamId);
            }
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      cleanup({ message: "Call ended", fromDisconnect: true });
    };
  }, [cleanup]);

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(undefined);
      }, 5000); // Auto-dismiss after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error]);

  return useMemo(
    () => ({
      join,
      leave,
      toggleMic,
      toggleCamera,
      switchCamera,
      switchMicrophone,
      selectMicrophone,
      isConnected,
      isBusy,
      isMicMuted,
      isCameraOff,
      statusMessage,
      error,
      clearError,
      participants,
      printParticipants,
      checkExistingStreams,
      debugPublisherState,
      debugSessionConnections,
      startCameraPreview,
      callStatus,
      participantCount,
      isAudioEnabled,
      isVideoEnabled,
      signalStrength,
      audioLevel,
      audioDevices: audioDevicesRef.current,
      currentAudioDevice: currentAudioDeviceRef.current,
      chatMessages,
      sendChatMessage,
      typingUsers,
      sendTypingIndicator,
      stopTypingIndicator,
      clearChatHistory,
    }),
    [join, leave, toggleMic, toggleCamera, switchCamera, switchMicrophone, selectMicrophone, isConnected, isBusy, isMicMuted, isCameraOff, statusMessage, error, clearError, participants, printParticipants, checkExistingStreams, startCameraPreview, callStatus, participantCount, isAudioEnabled, isVideoEnabled, signalStrength, audioLevel, chatMessages, sendChatMessage, typingUsers, sendTypingIndicator, stopTypingIndicator, clearChatHistory],
  );
}
