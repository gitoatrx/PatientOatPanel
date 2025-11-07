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
  callMode?: 'audio' | 'video' | null;
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

type PiPVideoElement = HTMLVideoElement & {
  autoPictureInPicture?: boolean;
  disablePictureInPicture?: boolean;
  audioTracks?: MediaStreamTrack[];
  mozHasAudio?: boolean;
  webkitAudioDecodedByteCount?: number;
};

const enablePiPSupportOnVideo = (video: HTMLVideoElement) => {
  const pipVideo = video as PiPVideoElement;

  // Ensure video is ready for PiP
  pipVideo.playsInline = true;
  pipVideo.setAttribute('playsinline', 'true');
  
  // Remove any PiP disabling attributes
  pipVideo.removeAttribute('disablepictureinpicture');
  pipVideo.removeAttribute('disablePictureInPicture');

  // Enable PiP support
  if ('disablePictureInPicture' in pipVideo) {
    pipVideo.disablePictureInPicture = false;
  }

  // Set auto PiP if supported (Chrome 134+)
  if ('autoPictureInPicture' in pipVideo) {
    pipVideo.autoPictureInPicture = true;
  } else {
    pipVideo.setAttribute('autoPictureInPicture', 'true');
  }

  // Ensure video has proper attributes for PiP
  pipVideo.setAttribute('data-pip-enabled', 'true');
  
  // Ensure video has audio for Chrome 134+ auto PiP requirements
  if (pipVideo.muted) {
    pipVideo.muted = false; // Unmute for auto PiP eligibility
  }

  // Ensure video is playing for auto PiP eligibility
  if (pipVideo.paused) {
    pipVideo.play().catch(error => {

    });
  }

};

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
  openDeviceSettings: () => void;
  setCallMode?: (mode: 'audio' | 'video') => void;
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
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
  audioLevel: number;
  audioDevices: Array<{ deviceId?: string; label?: string }>;
  currentAudioDevice: string | null;
  chatMessages: ChatMessage[];
  sendChatMessage: (content: string, type?: 'text' | 'image' | 'file', attachment?: any) => void;
  typingUsers: TypingUser[];
  sendTypingIndicator: () => void;
  stopTypingIndicator: () => void;
  clearChatHistory: () => void;
  // PiP and speaker detection props
  onParticipantVideoReady: (id: string, el: HTMLVideoElement | null) => void;
  activeSpeakerId: string | null;
  enablePiPFollowSpeaker: () => void;
  disablePiPFollowSpeaker: () => void;
  pipFollowsSpeaker: boolean;
  getVideoElementById: (connectionId: string) => HTMLVideoElement | null;
  isPictureInPicture: boolean;
  pendingPiPRequest: boolean;
  setPendingPiPRequest: (value: boolean) => void;
  togglePictureInPicture: () => Promise<void>;
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
  // Disabled verbose logging
  // if (details) {
  //   console.info(TELEHEALTH_LOG_PREFIX, message, details);
  // } else {
  //   console.info(TELEHEALTH_LOG_PREFIX, message);
  // }
};

const logWarn = (message: string, details?: TelehealthLogDetails) => {
  if (details) {

  } else {

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
    const child: ChildNode | null = element.firstChild;
    if (!child) break;
    // Verify child is actually a direct child before removing
    if (child.parentNode === element) {
      try {
        element.removeChild(child);
      } catch (e) {
        // If removeChild fails, try using remove() method as fallback
        if (child instanceof Element) {
          child.remove();
        }
        // If that also fails, break to avoid infinite loop
        break;
      }
    } else {
      // If child is no longer a direct child, break to avoid infinite loop
      break;
    }
  }
};

// Safe detach helper for publisher element cleanup on leave/destroy
const safeDetach = (node: Node | null | undefined) => {
  if (!node?.parentNode) return;
  if (node.parentNode.contains(node)) {
    try {
      node.parentNode.removeChild(node);
    } catch {
      // Ignore errors - node may have already been removed
    }
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
  callMode: initialCallMode,
}: UseVonageSessionArgs): UseVonageSessionResult {
  const sessionRef = useRef<VonageSession | null>(null);
  const publisherRef = useRef<VonagePublisher | null>(null);
  const remoteContainerRef = useRef<HTMLDivElement | null>(remoteContainer);
  const localContainerRef = useRef<HTMLDivElement | null>(localContainer);
  const dummyContainerRef = useRef<HTMLDivElement | null>(null); // For audio-only mode
  const isJoiningRef = useRef(false);
  const videoDevicesRef = useRef<Array<{ deviceId?: string }>>([]);
  const currentVideoDeviceRef = useRef<string | null>(null);
  const audioDevicesRef = useRef<Array<{ deviceId?: string; label?: string }>>([]);
  const currentAudioDeviceRef = useRef<string | null>(null);
  const callModeRef = useRef<'audio' | 'video' | null>(initialCallMode || null);
  const transitionLockRef = useRef<Promise<void> | null>(null);
  const debounceIdRef = useRef<number | null>(null);
  const lastRequestedModeRef = useRef<'audio' | 'video' | null>(null);
  const didInitRef = useRef(false); // Guard to ensure publisher is only created once
  const didInitPublisher = useRef(false); // Track if publisher has been initialized
  const subscribersRef = useRef<Map<string, any>>(new Map()); // Track subscribers by streamId for idempotence

  const [isConnected, setIsConnected] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(initialCallMode === 'audio');
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [callStatus, setCallStatus] = useState<CallStatus>(CALL_STATUSES.IDLE);
  const [participantCount, setParticipantCount] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialCallMode !== 'audio');
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [signalStrength, setSignalStrength] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [audioLevel, setAudioLevel] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // PiP and speaker detection state
  const participantVideoMap = useRef(new Map<string, HTMLVideoElement>());
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [pipFollowsSpeaker, setPipFollowsSpeaker] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [pendingPiPRequest, setPendingPiPRequest] = useState(false);

  // Ensure publisher is mounted exactly once into the fixed local container
  // Mount the publisher into the stable container with fixed ID
  const ensurePublisher = useCallback(() => {
    if (didInitPublisher.current) {
      // Verify publisher is still in the correct container
      const pub = publisherRef.current;
      if (pub) {
        const pubEl = (pub as any)?.element as HTMLElement | undefined;
        const parentId = pubEl?.parentElement?.id;
        if (parentId !== 'vonage-local-container') {
          console.error('⚠️ Publisher is not under local container, re-mounting', { parentId });
          try {
            pub.destroy();
          } catch (e) {
            // Ignore errors
          }
          publisherRef.current = null;
          didInitPublisher.current = false;
        } else {
          return; // Publisher exists and is in correct place
        }
      }
    }

    const container = document.getElementById('vonage-local-container') as HTMLElement | null;
    if (!container) {
      console.warn('⚠️ No local container to mount publisher yet');
      return;
    }

    // Clean any stray OT nodes once (dev hot-reload guard)
    Array.from(container.children).forEach((n: any) => {
      if (n?.classList?.contains('OT_publisher') || n?.dataset?.ot === 'publisher') {
        try {
          n.remove();
        } catch (e) {
          // Ignore errors
        }
      }
    });

    const OT = window.OT;
    if (!OT) {
      console.warn('⚠️ OpenTok SDK not loaded yet');
      return;
    }

    didInitPublisher.current = true;

    const pub = OT.initPublisher(container, {
      insertMode: 'append',
      width: '100%',
      height: '100%',
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
    }, (err?: Error) => {
      if (err) {
        console.error('❌ initPublisher error', err);
        didInitPublisher.current = false;
      }
    });

    publisherRef.current = pub;
    
  }, []);

  // One-time publisher initialization - call when container is ready
  useEffect(() => {
    if (didInitRef.current) return; // Prevents StrictMode double-run
    if (!localContainer) return; // Wait for container to be ready
    
    didInitRef.current = true;
    
    // Try to ensure publisher is mounted (will wait for container if not ready)
    ensurePublisher();

    return () => {
      // Only reset on full unmount
      didInitRef.current = false;
    };
  }, [localContainer, ensurePublisher]); // Only depend on localContainer, not callMode

  // Hard guard: Immediately reject any non-publisher nodes appended to local container
  // This prevents subscribers from being mounted in the local container
  useEffect(() => {
    const root = localContainerRef.current || localContainer;
    if (!root) return;

    const mo = new MutationObserver((recs) => {
      for (const r of recs) {
        r.addedNodes.forEach((n) => {
          const el = n as HTMLElement;
          if (!el) return;

          const isPublisher = el?.classList?.contains('OT_publisher') || el?.dataset?.ot === 'publisher';
          const isSubscriber = el?.classList?.contains('OT_subscriber') || el?.dataset?.ot === 'subscriber';
          
          if (isSubscriber) {
            console.warn('🚫 Subscriber appended to LOCAL container; detaching immediately', {
              streamId: el.dataset?.streamId,
              connectionId: el.dataset?.connectionId
            });
            try {
              el.parentElement?.removeChild(el);
            } catch (e) {
              // If removeChild fails, try remove()
              try {
                el.remove();
              } catch (e2) {
                // Ignore
              }
            }
            return;
          }
        });
      }
    });

    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [localContainer]);

  // One-child policy guard - belt-and-suspenders to prevent duplicates
  // Removes duplicate OT publisher nodes AND manual video elements when publisher exists
  useEffect(() => {
    const root = localContainerRef.current || localContainer;
    if (!root) return;

    const tidy = () => {
      const otNodes = Array.from(root.querySelectorAll('.OT_publisher,[data-ot="publisher"]'));
      const allVideos = Array.from(root.querySelectorAll('video'));
      
      // If we have an OT publisher, remove any manual video elements (preview/fallback)
      if (otNodes.length > 0 && allVideos.length > otNodes.length) {
        // Find manual video elements (not inside OT publisher nodes)
        allVideos.forEach((video) => {
          const isInsideOT = otNodes.some((otNode) => otNode.contains(video));
          if (!isInsideOT) {
            try {
              console.warn('🧹 Removing manual video element (preview/fallback) - OT publisher exists');
              video.remove();
            } catch (e) {
              // Ignore errors
            }
          }
        });
      }
      
      // Keep only the first OT publisher node, remove any duplicates
      if (otNodes.length > 1) {
        otNodes.slice(1).forEach((n) => {
          try {
            console.warn('🧹 Removing duplicate OT publisher node');
            n.parentElement?.removeChild(n);
          } catch (e) {
            // Ignore errors
          }
        });
      }
    };

    tidy();

    // Observe in dev to catch accidental appends
    if (process.env.NODE_ENV === 'development') {
      const mo = new MutationObserver(tidy);
      mo.observe(root, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
  }, [localContainer]);

  // Register participant video elements for PiP
  const onParticipantVideoReady = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (!el) { 
      participantVideoMap.current.delete(id); 

      return; 
    }
    participantVideoMap.current.set(id, el);

  }, []);

  // PiP control functions
  const enablePiPFollowSpeaker = useCallback(() => {
    setPipFollowsSpeaker(true);

  }, []);

  const disablePiPFollowSpeaker = useCallback(() => {
    setPipFollowsSpeaker(false);

  }, []);

  // Getter function for video elements by connection ID
  const getVideoElementById = useCallback((connectionId: string): HTMLVideoElement | null => {
    return participantVideoMap.current.get(connectionId) || null;
  }, []);

  // PiP toggle function
  const togglePictureInPicture = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPictureInPicture(false);
        setPipFollowsSpeaker(false);
        return;
      }
      
      // Find the best video element to use for PiP
      let targetVideo: HTMLVideoElement | null = null;

      // Priority: active speaker > first remote video > local video
      if (activeSpeakerId) {
        targetVideo = getVideoElementById(activeSpeakerId);
      }

      if (!targetVideo && remoteContainerRef.current) {
        const remoteVideo = remoteContainerRef.current.querySelector('video') as HTMLVideoElement;
        if (remoteVideo && remoteVideo.srcObject) {
          targetVideo = remoteVideo;
        }
      }

      if (!targetVideo && localContainerRef.current) {
        const localVideo = localContainerRef.current.querySelector('video') as HTMLVideoElement;
        if (localVideo && localVideo.srcObject) {
          targetVideo = localVideo;
        }
      }

      if (!targetVideo) {
        console.warn('No video element available for PiP');
        setPendingPiPRequest(false);
        return;
      }

      // Enable PiP support on the video
      enablePiPSupportOnVideo(targetVideo);

      // Ensure video is playing
      if (targetVideo.paused) {
        await targetVideo.play();
      }

      // Request Picture-in-Picture
      await targetVideo.requestPictureInPicture();
      setIsPictureInPicture(true);
      setPendingPiPRequest(false);

      // Enable follow speaker if available
      if (activeSpeakerId) {
        enablePiPFollowSpeaker();
      }

    } catch (err: any) {
      console.error('PiP error:', err);
      setPendingPiPRequest(false);
      setIsPictureInPicture(false);
      
      // Handle specific errors
      if (err.name === 'InvalidStateError') {
        console.warn('PiP: Video not ready or already in PiP');
      } else if (err.name === 'NotAllowedError') {
        console.warn('PiP: User denied PiP permission');
      }
    }
  }, [activeSpeakerId, getVideoElementById, enablePiPFollowSpeaker]);

  // Listen for PiP events
  useEffect(() => {
    const handleEnterPiP = () => {
      setIsPictureInPicture(true);
      setPendingPiPRequest(false);
    };
    const handleLeavePiP = () => {
      setIsPictureInPicture(false);
      setPipFollowsSpeaker(false);
    };

    document.addEventListener('enterpictureinpicture', handleEnterPiP);
    document.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      document.removeEventListener('enterpictureinpicture', handleEnterPiP);
      document.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, []);

  // Swap PiP video when active speaker changes (if follow speaker is enabled)
  useEffect(() => {
    if (!pipFollowsSpeaker || !isPictureInPicture || !activeSpeakerId) return;
    
    const activeSpeakerVideo = getVideoElementById(activeSpeakerId);
    const currentPiPVideo = document.pictureInPictureElement as HTMLVideoElement;
    
    if (activeSpeakerVideo && currentPiPVideo && activeSpeakerVideo.srcObject) {
      // Swap the stream without leaving PiP
      if (currentPiPVideo.srcObject !== activeSpeakerVideo.srcObject) {
        currentPiPVideo.srcObject = activeSpeakerVideo.srcObject as MediaStream;
        currentPiPVideo.play().catch(() => {});
      }
    }
  }, [pipFollowsSpeaker, isPictureInPicture, activeSpeakerId, getVideoElementById]);

  // Active speaker detection from audio level events
  useEffect(() => {
    let lastSpeakerChangeTime = 0;
    const SPEAKER_CHANGE_THROTTLE = 1000; // Minimum 1 second between speaker changes
    const audioLevels = new Map<string, number>();
    
    const handleAudioLevel = (event: CustomEvent) => {
      const { connectionId, audioLevel, isSpeaking } = event.detail || {};
      
      if (!connectionId) return;
      
      // Store audio level for this participant
      audioLevels.set(connectionId, audioLevel || 0);
      
      // Find the participant with the highest audio level
      let maxLevel = 0;
      let loudestSpeaker: string | null = null;
      
      for (const [id, level] of audioLevels.entries()) {
        if (level > maxLevel && level > 0.05) { // Threshold to avoid noise
          maxLevel = level;
          loudestSpeaker = id;
        }
      }
      
      // Update active speaker with throttling
      const now = Date.now();
      if (loudestSpeaker && now - lastSpeakerChangeTime > SPEAKER_CHANGE_THROTTLE) {
        setActiveSpeakerId(prev => {
          if (prev !== loudestSpeaker) {

            lastSpeakerChangeTime = now;
            return loudestSpeaker;
          }
          return prev;
        });
      }
    };

    // Listen to both remote and local audio level events
    document.addEventListener('remoteParticipantAudioLevel', handleAudioLevel as EventListener);
    document.addEventListener('speakingStatusUpdate', handleAudioLevel as EventListener);
    
    return () => {
      document.removeEventListener('remoteParticipantAudioLevel', handleAudioLevel as EventListener);
      document.removeEventListener('speakingStatusUpdate', handleAudioLevel as EventListener);
    };
  }, []);

  // Function to assess network quality from WebRTC stats
  const assessNetworkQuality = useCallback(async (session: any) => {
    try {
      if (!session || !session.connection) return;

      // Get WebRTC stats from the session - wrap in try/catch to handle SDK errors
      let stats;
      try {
        stats = await session.getStats();
      } catch (statsError) {
        // SDK might not be ready yet or connection not established
        // Silently return to avoid errors in console
        return;
      }
      
      if (!stats || !Array.isArray(stats)) return;
      let rtt = 0;
      let packetLoss = 0;
      let jitter = 0;
      let bitrate = 0;

      // Parse stats to get network metrics
      stats.forEach((report: any) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          rtt = report.currentRoundTripTime * 1000 || 0; // Convert to ms
        }
        if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
          packetLoss = (report.packetsLost / (report.packetsReceived + report.packetsLost)) * 100 || 0;
          jitter = report.jitter * 1000 || 0; // Convert to ms
        }
        if (report.type === 'outbound-rtp' && report.mediaType === 'audio') {
          bitrate = report.bytesSent * 8 / 1000 || 0; // Convert to kbps
        }
      });

      // Assess quality based on metrics
      let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';

      // RTT assessment (lower is better)
      if (rtt < 100) {
        quality = 'excellent';
      } else if (rtt < 200) {
        quality = 'good';
      } else if (rtt < 400) {
        quality = 'fair';
      } else {
        quality = 'poor';
      }

      // Adjust based on packet loss (lower is better)
      if (packetLoss > 5) {
        quality = 'poor';
      } else if (packetLoss > 2) {
        quality = quality === 'excellent' ? 'good' : quality;
      }

      // Adjust based on jitter (lower is better)
      if (jitter > 50) {
        quality = quality === 'excellent' ? 'good' : quality === 'good' ? 'fair' : 'poor';
      }

      setNetworkQuality(quality);
      setSignalStrength(quality);

    } catch (error) {

    }
  }, []);

  // Clear chat messages when session ends
  const clearChatHistory = useCallback(() => {
    try {
      setChatMessages([]);

    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }, []);

  // Monitor video state changes
  useEffect(() => {

  }, [isCameraOff, isVideoEnabled, isConnected]);

  useEffect(() => {
    remoteContainerRef.current = remoteContainer;
  }, [remoteContainer]);

  useEffect(() => {
    localContainerRef.current = localContainer;
  }, [localContainer]);

  // Sync callMode prop to callModeRef when it changes
  useEffect(() => {
    if (initialCallMode !== undefined && initialCallMode !== callModeRef.current) {
      callModeRef.current = initialCallMode;
      
      // If publisher exists and we're switching to audio, stop video immediately
      if (initialCallMode === 'audio' && publisherRef.current) {
        const publisher = publisherRef.current;
        try {
          publisher.publishVideo(false);
          
          // Disable video tracks in publisher stream (don't stop - use enabled for mode toggles)
          const publisherStream = publisher.stream;
          if (publisherStream) {
            const videoTracks = (publisherStream as any).getVideoTracks?.() || [];
            videoTracks.forEach((track: MediaStreamTrack) => {
              track.enabled = false;
            });
          }
        } catch (error) {
          // Silently handle - publisher might not be ready
        }
        
        // Update state
        setIsCameraOff(true);
        setIsVideoEnabled(false);
      }
    }
  }, [initialCallMode]);

  // Start camera preview when local container is ready (skip in audio mode)
  useEffect(() => {
    // Don't start camera preview if in audio mode
    if (callModeRef.current === 'audio') {
      return;
    }

    const startCameraPreview = async () => {

      if (!localContainerRef.current) {

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

          enablePiPSupportOnVideo(videoElement);

          // Only append preview if publisher doesn't exist yet
          // Once publisher is created, it manages the video element
          if (!publisherRef.current) {
            localEl.appendChild(videoElement);
          } else {
          }

        }
      } catch (error) {

        // This is expected if permissions haven't been granted yet
      }
    };

    // Only start preview if we have a container and not in audio mode
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
        const publisher = publisherRef.current;
        if (publisher) {
          // Safely detach publisher element before destroy
          safeDetach((publisher as any)?.element);
          publisher.destroy();
        }
      } catch (publishError) {
        // Ignore cleanup errors
      }
      publisherRef.current = null;
      didInitRef.current = false; // Reset init flag on cleanup

      // Clean up dummy container if it was created for audio mode
      if (dummyContainerRef.current) {
        try {
          dummyContainerRef.current.remove();
          dummyContainerRef.current = null;
        } catch (e) {
          // Ignore cleanup errors
        }
      }

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
    const isAudioMode = callModeRef.current === 'audio';

    // In audio mode, we don't need local container (it can be null)
    // Only require remote container and local container for video mode
    if (!remoteEl) {
      setError("The video interface is not ready yet. Please wait a moment and try again.");
      return;
    }

    if (!isAudioMode && !localEl) {
      setError("The video interface is not ready yet. Please wait a moment and try again.");
      return;
    }

    isJoiningRef.current = true;
    setIsBusy(true);
    setError(undefined);
    // Update status message based on call mode
    setStatusMessage(isAudioMode ? "Preparing your microphone..." : "Preparing your camera and microphone...");
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
      // In audio mode, only request audio (no video)
      let currentPreviewStream = previewStream;
      if (!currentPreviewStream) {
        try {
          if (isAudioMode) {
            // Audio mode - only request audio, no video
            currentPreviewStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          } else {
            // Video mode - request both video and audio
            currentPreviewStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          }
          setPreviewStream(currentPreviewStream);

        } catch (mediaError) {

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

      // Only reset remote container, keep local preview until publisher is ready
      removeAllChildren(remoteContainerRef.current);
      setStatusMessage("Connecting to the secure session...");

      const session: VonageSession = OT.initSession(applicationId, sessionIdentifier);
      sessionRef.current = session;

      // Helper: Get remote target element - strict, no fallback to local
      const getRemoteTargetEl = (stream: any): HTMLElement | null => {
        const streamId = stream?.streamId;
        const connectionId = stream?.connection?.connectionId;
        
        // Prefer a per-participant tile by streamId
        const byStream = document.querySelector<HTMLElement>(`[data-remote-tile="${streamId}"]`);
        if (byStream) return byStream;

        // Fallback to connectionId-based tile
        const byConn = document.querySelector<HTMLElement>(`[data-remote-conn="${connectionId}"]`);
        if (byConn) return byConn;

        // Never return the local container as a fallback
        // Only return the remote container
        return remoteContainerRef.current ?? null;
      };

      // Helper: Track subscriber for idempotence
      const trackSubscriber = (streamId: string, sub: any) => {
        if (subscribersRef.current.has(streamId)) {
          console.warn('⚠️ Duplicate subscriber detected, destroying new one', { streamId });
          try {
            sub.destroy();
          } catch (e) {
            // Ignore errors
          }
          return;
        }
        subscribersRef.current.set(streamId, sub);
      };

      const handleStreamCreated = (event: any) => {
        const stream = event?.stream;
        const streamId: string | undefined = stream?.streamId;
        const connectionId: string | undefined = stream?.connection?.connectionId;

        if (!stream || !streamId || !connectionId) {
          logWarn('stream created event missing identifiers', { streamId, connectionId });
          return;
        }

        // Guard: NEVER subscribe to local publisher stream
        const currentConnectionId = session.connection?.connectionId;
        if (currentConnectionId && connectionId === currentConnectionId) {
          console.debug('⏭️ Skip subscribe: local stream', { streamId, connectionId });
          logInfo('ignoring local stream echo', { streamId, connectionId });
          return;
        }

        // Get remote target - strict, no fallback to local
        const target = getRemoteTargetEl(stream);
        if (!target) {
          console.warn('⚠️ Refusing to subscribe into local container - no remote target', { streamId, connectionId });
          logError('no remote target element; refusing to subscribe', { streamId, connectionId });
          return; // DO NOT fallback to local container
        }

        // Verify target is NOT the local container (session-level guard)
        const isLocalContainer = target === localContainerRef.current || 
                                 target === localContainer ||
                                 target.id === 'vonage-local-container' ||
                                 target.dataset?.role === 'local' ||
                                 target.closest('#vonage-local-container');
        if (isLocalContainer) {
          console.warn('⚠️ Refusing to subscribe into local container', { 
            streamId, 
            connectionId,
            targetId: target.id,
            targetRole: target.dataset?.role
          });
          logError('target is local container; refusing to subscribe', { streamId, connectionId });
          return;
        }

        // In audio mode, skip subscribing to remote video streams - only subscribe to audio streams
        // In video mode, subscribe to ALL streams (both video and audio-only) to show all participants
        const currentCallMode = callModeRef.current;
        if (currentCallMode === 'audio' && stream.hasVideo) {
          logInfo('skipping video stream subscription in audio mode', {
            streamId,
            connectionId,
            callMode: currentCallMode,
          });
          return; // Don't subscribe to video streams when in audio mode
        }
        
        // In video mode, subscribe to all streams regardless of hasVideo
        // This ensures both participants are visible even if one doesn't have video yet
        // (audio-only streams will show avatar placeholder)

        logInfo('remote stream detected', {
          streamId,
          connectionId,
          hasVideo: !!stream.hasVideo,
          hasAudio: !!stream.hasAudio,
          videoType: stream.videoType ?? null,
          callMode: currentCallMode,
        });

        // Check if subscriber already exists (idempotence)
        if (subscribersRef.current.has(streamId)) {
          console.warn('⏭️ Subscriber already exists for stream, skipping', { streamId, connectionId });
          logWarn('subscriber already exists for stream', { streamId, connectionId });
          return;
        }

        const streamType: string = stream.videoType || (stream.hasVideo ? "camera" : "audio");
        
        // Use the strict target (already verified to be remote container)
        const remoteEl = target;
        
        // Check for existing stream by streamId first (most reliable)
        const existingWrapper = remoteEl.querySelector<HTMLElement>(`[data-stream-id="${streamId}"]`);
        if (existingWrapper) {
          logWarn('remote stream already rendered with this streamId', { streamId, connectionId });
          return;
        }
        
        // Check for duplicate connection - but only remove if it's the same streamType
        // This allows multiple streams from same connection (e.g., screen share + camera)
        const duplicateSelector = `[data-connection-id="${connectionId}"][data-stream-type="${streamType}"]`;
        const existingForConnection = remoteEl.querySelector<HTMLElement>(duplicateSelector);
        if (existingForConnection) {
          const existingStreamId = existingForConnection.dataset.streamId;
          // Only remove if it's a different streamId (stream was replaced/updated)
          if (existingStreamId && existingStreamId !== streamId) {
            logWarn('removing previous remote stream container (replaced by new stream)', { 
              connectionId, 
              streamType,
              oldStreamId: existingStreamId,
              newStreamId: streamId
            });
            existingForConnection.remove();
          } else {
            // Same streamId, already rendered, skip
            logWarn('stream already exists with same streamId', { streamId, connectionId });
            return;
          }
        }

        const wrapper = document.createElement("div");
        wrapper.dataset.streamId = streamId;
        wrapper.dataset.connectionId = connectionId;
        wrapper.dataset.streamType = streamType;
        wrapper.dataset.remoteTile = streamId; // For strict targeting
        wrapper.dataset.remoteConn = connectionId; // For strict targeting
        wrapper.dataset.role = 'remote-tile'; // Mark as remote tile
        wrapper.dataset.participantName = `Participant ${connectionId.slice(-4)}`; // Use last 4 chars of connection ID
        wrapper.style.width = "100%";
        wrapper.style.height = "100%";
        wrapper.style.backgroundColor = "#1e293b";
        wrapper.style.border = "1px solid #374151";
        wrapper.style.cursor = "pointer";
        
        // Add click handler for focus functionality
        wrapper.addEventListener('click', () => {
          // This will be handled by the video panel component
          const event = new CustomEvent('participantClick', {
            detail: { connectionId, streamId, participantName: wrapper.dataset.participantName }
          });
          document.dispatchEvent(event);
        });

        remoteEl.appendChild(wrapper);

        logInfo('remote stream container appended', { streamId, connectionId, childCount: remoteEl.children.length });

        // Add participant info overlay to the new remote stream
        addParticipantInfoOverlay(wrapper, `Participant ${connectionId.slice(-4)}`, 'remote', connectionId);

        // Register the video element for PiP when it's ready
        // We'll register it after the video element is created by the subscription

        const sub = session.subscribe(
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
              subscribersRef.current.delete(streamId);
              return;
            }

            // Track subscriber on success
            trackSubscriber(streamId, sub);

            logInfo('remote stream subscribed', { streamId, connectionId });

            // ✅ Log successful doctor stream subscription

            // Register the video element for PiP after subscription
            setTimeout(() => {
              const videoElement = wrapper.querySelector('video') as HTMLVideoElement;
              if (videoElement) {
                onParticipantVideoReady(connectionId, videoElement);

              }
            }, 100);

            // 🎤 Add audio level monitoring for remote participant speaker detection
            // Wait a bit for the video element to be fully set up
            setTimeout(() => {
              const videoElement = wrapper.querySelector('video') as HTMLVideoElement;
              if (videoElement && videoElement.srcObject) {

                try {
                  // Monitor audio levels for this remote participant using Web Audio API
                  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const analyser = audioContext.createAnalyser();
                  const source = audioContext.createMediaStreamSource(videoElement.srcObject as MediaStream);
                  source.connect(analyser);
                  
                  analyser.fftSize = 256;
                  analyser.smoothingTimeConstant = 0.8;
                  const bufferLength = analyser.frequencyBinCount;
                  const dataArray = new Uint8Array(bufferLength);
                  
                  let lastAudioLevel = 0;
                  
                  const checkAudioLevel = () => {
                    analyser.getByteFrequencyData(dataArray);
                    
                    // Calculate RMS (Root Mean Square) for better audio level detection
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                      sum += dataArray[i] * dataArray[i];
                    }
                    const rms = Math.sqrt(sum / bufferLength);
                    const normalizedLevel = rms / 255;
                    
                    // Apply smoothing to avoid rapid fluctuations
                    const smoothedLevel = lastAudioLevel * 0.7 + normalizedLevel * 0.3;
                    lastAudioLevel = smoothedLevel;
                    
                    // Dispatch audio level event for this participant
                    document.dispatchEvent(new CustomEvent('remoteParticipantAudioLevel', {
                      detail: { 
                        connectionId, 
                        audioLevel: smoothedLevel,
                        isSpeaking: smoothedLevel > 0.05 // Lower threshold for better detection
                      }
                    }));
                  };
                  
                  // Check audio level every 150ms for better performance
                  const audioLevelInterval = setInterval(checkAudioLevel, 150);
                  
                  // Store interval reference for cleanup
                  (wrapper as any).audioLevelInterval = audioLevelInterval;
                  (wrapper as any).audioContext = audioContext;

                } catch (error) {

                }
              } else {

              }
            }, 500); // Wait 500ms for video element to be ready

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
            // 🎤 Clean up audio level monitoring for this participant
            const audioLevelInterval = (maybeNode as any).audioLevelInterval;
            const audioContext = (maybeNode as any).audioContext;
            
            if (audioLevelInterval) {
              clearInterval(audioLevelInterval);

            }
            
            if (audioContext && audioContext.state !== 'closed') {
              audioContext.close().catch(console.warn);

            }
            
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
        const stream = event?.stream;
        
        // Never subscribe to local stream
        if (stream?.connection?.connectionId === session.connection?.connectionId) {
          console.debug('⏭️ Skip subscribe: local stream (session-level guard)', { 
            streamId: stream?.streamId,
            connectionId: stream?.connection?.connectionId 
          });
          return;
        }

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
        const streamId = event.stream?.streamId;
        const connectionId = event.stream?.connection?.connectionId;
        
        logInfo('session event: streamDestroyed', {
          streamId,
          connectionId,
        });

        // Clean up subscriber tracking
        if (streamId) {
          const sub = subscribersRef.current.get(streamId);
          if (sub) {
            try {
              sub.destroy();
            } catch (e) {
              // Ignore errors
            }
            subscribersRef.current.delete(streamId);
          }
        }
        handleStreamDestroyed(event);
      });

      // Note: sessionConnected event is handled in the session.connect callback
      // to ensure proper publish flow

      // ✅ Add connection event listener to track when doctor joins
      session.on("connectionCreated", (event: any) => {

        // Check if this is a doctor connection (not our own)
        if (event.connection?.connectionId !== session.connection?.connectionId) {

          // Check existing streams for this connection
          const existingStreams = Array.isArray(session.streams) ? session.streams : [];
          const doctorStreams = existingStreams.filter((stream: any) => 
            stream.connection?.connectionId === event.connection?.connectionId
          );

          if (doctorStreams.length === 0) {

          } else {

          }
        }
      });

      session.on("connectionDestroyed", (event: any) => {

      });

      // Add chat signaling event listener
      session.on("signal:msg", (event: any) => {

        // Prevent echo - don't process messages from our own connection
        if (event.from?.connectionId === session.connection?.connectionId) {

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

      // Add network quality monitoring
      session.on("networkQuality", (event: any) => {

        const quality = event.quality || 'good';
        setNetworkQuality(quality);
        setSignalStrength(quality); // Update signal strength based on network quality
      });

      // Start WebRTC stats monitoring
      const startStatsMonitoring = () => {
        if (statsIntervalRef.current) {
          clearInterval(statsIntervalRef.current);
        }
        
        // Monitor stats every 5 seconds
        statsIntervalRef.current = setInterval(() => {
          assessNetworkQuality(session);
        }, 5000);
        
        // Initial assessment
        assessNetworkQuality(session);
      };

      // Start monitoring when session is connected
      if (session.connection) {
        startStatsMonitoring();
      } else {
        // Wait for connection to be established
        const handleSessionConnected = () => {
          startStatsMonitoring();
          session.off("sessionConnected", handleSessionConnected);
        };
        session.on("sessionConnected", handleSessionConnected);
      }

      const videoInputs = await listVideoInputs(OT);
      videoDevicesRef.current = videoInputs;
      currentVideoDeviceRef.current = videoInputs[0]?.deviceId ?? null;

      const audioInputs = await listAudioInputs(OT);
      audioDevicesRef.current = audioInputs;
      currentAudioDeviceRef.current = audioInputs[0]?.deviceId ?? null;

      // Determine initial video publishing based on call mode
      const shouldPublishVideo = callModeRef.current !== 'audio';
      
      const publisherOptions: Record<string, unknown> = {
        insertMode: "append",
        width: "100%",
        height: "100%",
        publishAudio: true,
        publishVideo: shouldPublishVideo,
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
      // Only set video source if we're not in audio mode
      if (currentPreviewStream && !isAudioMode) {
        const videoTracks = currentPreviewStream.getVideoTracks();
        if (videoTracks.length > 0) {
          publisherOptions.videoSource = videoTracks[0];
        }
        const audioTracks = currentPreviewStream.getAudioTracks();
        if (audioTracks.length > 0) {
          publisherOptions.audioSource = audioTracks[0];
        }
      } else if (currentPreviewStream && isAudioMode) {
        // Audio mode - only set audio source, explicitly exclude video
        const audioTracks = currentPreviewStream.getAudioTracks();
        if (audioTracks.length > 0) {
          publisherOptions.audioSource = audioTracks[0];
        }
        // Explicitly ensure no video source is set
        delete publisherOptions.videoSource;
        // Disable video tracks from the preview stream (don't stop - use enabled for mode toggles)
        const videoTracks = currentPreviewStream.getVideoTracks();
        if (videoTracks.length > 0) {
          videoTracks.forEach(track => {
            track.enabled = false;
          });
        }
      } else if (!isAudioMode) {
        // Video mode - ensure we have a video source
        if (currentVideoDeviceRef.current) {
          publisherOptions.videoSource = currentVideoDeviceRef.current;
        } else {
          // No preview stream and no device ref - Vonage will request camera access
          // But we should log this to help debug
          console.warn('⚠️ useVonageSession: Video mode but no preview stream or video device ref - Vonage will request camera');
          // Don't set videoSource - let Vonage handle it, but ensure publishVideo is true
        }
      } else if (isAudioMode) {
        // Explicitly ensure no video source is set in audio mode
        delete publisherOptions.videoSource;
      }
      
      // In video mode, ensure publishVideo is true even if we don't have a videoSource yet
      // (Vonage will request camera access when publisher is initialized)
      if (!isAudioMode && !publisherOptions.videoSource) {
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

      // Clear the container before creating the publisher to avoid duplicate videos
      // In audio mode, localEl can be null, so we'll create a dummy container if needed
      let publisherContainer = localEl;
      if (isAudioMode && !localEl) {
        // Create a hidden dummy container for audio-only publisher
        const dummyContainer = document.createElement('div');
        dummyContainer.style.display = 'none';
        dummyContainer.style.visibility = 'hidden';
        dummyContainer.style.position = 'absolute';
        dummyContainer.style.width = '1px';
        dummyContainer.style.height = '1px';
        dummyContainer.style.opacity = '0';
        document.body.appendChild(dummyContainer);
        dummyContainerRef.current = dummyContainer;
        publisherContainer = dummyContainer;
      }
      // Don't clear localEl - let OT manage its own nodes
      
      // For video mode, use ensurePublisher which mounts to fixed container ID
      // For audio mode, create publisher in dummy container if needed
      if (!isAudioMode) {
        // Video mode: ensure publisher is mounted in the fixed container
        ensurePublisher();
        publisher = publisherRef.current;
      } else {
        // Audio mode: create publisher in dummy container if it doesn't exist
        if (publisherRef.current) {
          publisher = publisherRef.current;
        } else if (publisherContainer) {
          publisher = OT.initPublisher(publisherContainer, publisherOptions, handlePublisherError);
          publisherRef.current = publisher;
        }
      }
      if (!publisher || publisherErrorOccurred) {

        isJoiningRef.current = false;
        return;
      }
      
      // Wait for publisher to initialize before manipulating video state
      // This prevents SDK errors from accessing uninitialized RTCPeerConnection
      setTimeout(() => {
        if (!publisher) return;
        
        // In audio mode, explicitly ensure video is not being published
        if (isAudioMode) {
          try {
            publisher.publishVideo(false);
            
            // Also check if publisher has any video tracks and stop them
            const publisherStream = publisher.stream;
            if (publisherStream) {
              const videoTracks = (publisherStream as any).getVideoTracks?.() || [];
              if (videoTracks.length > 0) {
                videoTracks.forEach((track: MediaStreamTrack) => {
                  track.enabled = false;
                });
              }
            }
          } catch (error) {
            // Silently handle - publisher might not be ready yet
          }
        } else {
          // Video mode - verify video publishing is enabled
          try {
            publisher.publishVideo(true);
          } catch (error) {
            // Silently handle - publisher might not be ready yet
          }
        }
      }, 100); // Small delay to let SDK initialize

      // Don't add participant info overlay to local container
      // The controls should only show on remote participants' video feeds

      // Add signal strength monitoring
      if (publisher.on) {
        publisher.on('audioLevelUpdated', (event: any) => {
          const level = event.audioLevel || 0;
          setAudioLevel(level);
          
          // Note: Signal strength is now based on network quality, not audio level
          // Audio level is kept separate for microphone input monitoring
          
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

        });

        // Listen for stream property changes (when camera is toggled)
        publisher.on('streamPropertyChanged', (event: any) => {
          if (event.changedProperty === 'videoActive' || event.changedProperty === 'hasVideo') {
            const hasVideo = event.stream?.hasVideo ?? event.newValue ?? false;
            setIsCameraOff(!hasVideo);
            setIsVideoEnabled(hasVideo);
            
            // Update participant state
            const session = sessionRef.current;
            if (session?.connection?.connectionId) {
              setParticipants((prev) => {
                return prev.map((participant) => 
                  participant.isLocal && participant.connectionId === session.connection?.connectionId
                    ? { ...participant, hasVideo }
                    : participant
                );
              });
            }

            // When camera is turned back on, ensure video element updates
            if (hasVideo) {
              setTimeout(() => {
                const currentPublisher = publisherRef.current;
                const localEl = localContainerRef.current;
                if (localEl && currentPublisher) {
                  const videoElement = localEl.querySelector('video') as HTMLVideoElement;
                  if (videoElement) {
                    // Try to get the stream from the publisher's internal video element
                    const publisherElement = (currentPublisher as any).element;
                    if (publisherElement) {
                      const publisherVideo = publisherElement.querySelector('video') as HTMLVideoElement;
                      if (publisherVideo && publisherVideo.srcObject) {
                        // Update the local video element's srcObject if it's different
                        if (videoElement.srcObject !== publisherVideo.srcObject) {
                          videoElement.srcObject = publisherVideo.srcObject as MediaStream;
                        }
                      }
                    }
                    
                    // Ensure video plays
                    videoElement.play().catch((err) => {
                      console.warn('Video play error after property change:', err);
                    });
                  }
                }
              }, 100);
            }
          }
        });
      }

      publisherRef.current = publisher;
      setIsMicMuted(false);
      
      // Set camera state based on call mode
      if (isAudioMode) {
        setIsCameraOff(true);
        setIsVideoEnabled(false);
      } else {
        setIsCameraOff(false);
        setIsVideoEnabled(true);
      }

      // Register the local video element for PiP (only in video mode)
      if (!isAudioMode && localEl) {
        setTimeout(() => {
          const localVideoElement = localEl.querySelector('video') as HTMLVideoElement;
          if (localVideoElement && session.connection?.connectionId) {
            onParticipantVideoReady('local', localVideoElement);

          }
        }, 100);
      }

      // Keep preview stream as backup until we confirm publisher is working
      // We'll stop it after successful publish

      session.connect(sessionToken, (connectError?: Error) => {

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

        setStatusMessage("Connected to session");
        setCallStatus(CALL_STATUSES.CONNECTED);
        setParticipantCount(1); // We are connected

        // Check for existing participants in the session

        const existingStreams = Array.isArray(session.streams) ? session.streams : [];

        existingStreams.forEach((existingStream: any, index: number) => {

          // If this is not our own stream, trigger subscription
          if (existingStream.connection?.connectionId !== session.connection?.connectionId) {

            // Simulate a streamCreated event for existing streams
            setTimeout(() => {
              handleStreamCreated({ stream: existingStream });
            }, 100);
          }
        });

        session.publish(publisher, (publishError?: Error) => {

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

          // Add local participant to tracking
          const localConnectionId = session.connection?.connectionId;
          if (localConnectionId) {
            const localParticipant: Participant = {
              connectionId: localConnectionId,
              streamId: publisher.streamId, // Now we have the stream ID
              hasVideo: !isAudioMode && !isCameraOff, // In audio mode, hasVideo is always false
              hasAudio: !isMicMuted,
              isLocal: true
            };

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

          }
          
          // In audio mode, double-check that video is not being published
          if (isAudioMode && publisher) {
            // Verify publisher stream doesn't have video
            const stream = publisher.stream;
            if (stream && (stream as any).hasVideo) {
              console.warn('⚠️ useVonageSession: Publisher stream has video in audio mode, disabling...');
              publisher.publishVideo(false);
              
              // Disable all video tracks (don't stop - use enabled for mode toggles)
              const videoTracks = (stream as any).getVideoTracks?.() || [];
              videoTracks.forEach((track: MediaStreamTrack) => {
                track.enabled = false;
              });
            }
            
            // Also ensure publishVideo is false
            try {
              publisher.publishVideo(false);
            } catch (e) {
              console.warn('⚠️ useVonageSession: Could not disable video publishing:', e);
            }
          }

          // Add a fallback check - if video doesn't appear in 3 seconds, restore preview
          setTimeout(() => {
            const localEl = localContainerRef.current;
            if (localEl && localEl.children.length === 0) {
              // Restart camera preview as fallback
              // Only if publisher doesn't exist - once publisher is created, it manages video
              if (!publisherRef.current) {
                navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                  .then(stream => {
                    // Append fallback video only if publisher doesn't exist
                    const videoElement = document.createElement('video');
                    videoElement.srcObject = stream;
                    videoElement.autoplay = true;
                    videoElement.muted = true;
                    videoElement.playsInline = true;
                    videoElement.style.width = '100%';
                    videoElement.style.height = '100%';
                    videoElement.style.objectFit = 'cover';

                    enablePiPSupportOnVideo(videoElement);
                    
                    localEl.appendChild(videoElement);
                  })
                  .catch(error => {
                    // Ignore errors
                  });
              } else {
              }
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

            if (doctorConnections.length > 0 && doctorStreams.length === 0) {

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

    }
    cleanup({ message: "Call ended", fromDisconnect: true });
    // Clear chat history when leaving the session
    clearChatHistory();
  }, [cleanup, clearChatHistory]);

  const toggleMic = useCallback(async () => {
    const publisher = publisherRef.current;
    if (!publisher) {
      console.warn('toggleMic: No publisher available');
      return;
    }
    
    const nextMuted = !isMicMuted;
    
    try {
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
      
    } catch (error) {
      console.error('toggleMic: Error toggling microphone:', error);
    }
  }, [isMicMuted]);

  const toggleCamera = useCallback(async () => {
    const publisher = publisherRef.current;
    if (!publisher) {
      return;
    }
    
    const nextOff = !isCameraOff;

    publisher.publishVideo(!nextOff);
    setIsCameraOff(nextOff);
    setIsVideoEnabled(!nextOff);

    // When turning camera back on, ensure the video element updates properly
    if (!nextOff) {
      // Camera is being turned ON - wait a bit for the publisher to update
      setTimeout(() => {
        const localEl = localContainerRef.current;
        if (localEl) {
          const videoElement = localEl.querySelector('video') as HTMLVideoElement;
          if (videoElement) {
            // Get the stream from the publisher's internal video element
            const publisherElement = (publisher as any).element;
            if (publisherElement) {
              const publisherVideo = publisherElement.querySelector('video') as HTMLVideoElement;
              if (publisherVideo && publisherVideo.srcObject) {
                // Update the local video element's srcObject if it's different
                if (videoElement.srcObject !== publisherVideo.srcObject) {
                  videoElement.srcObject = publisherVideo.srcObject as MediaStream;
                }
              }
            }
            
            // Ensure video plays
            videoElement.play().catch((err) => {
              console.warn('Video play error after camera toggle:', err);
            });
          }
        }
      }, 200);
    } else {
      // Camera is being turned OFF - ensure proper cleanup
      setTimeout(() => {
        const localEl = localContainerRef.current;
        if (localEl) {
          const videoElement = localEl.querySelector('video') as HTMLVideoElement;
          if (videoElement && videoElement.srcObject instanceof MediaStream) {
            // Disable video tracks to ensure proper state detection
            const videoTracks = videoElement.srcObject.getVideoTracks();
            videoTracks.forEach(track => {
              track.enabled = false;
            });
          }
        }
      }, 100);
    }

    // Update participant state
    const session = sessionRef.current;
    if (session?.connection?.connectionId) {
      setParticipants((prev) => {
        return prev.map((participant) => 
          participant.isLocal && participant.connectionId === session.connection?.connectionId
            ? { ...participant, hasVideo: !nextOff }
            : participant
        );
      });
    }

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

    }

    // Fallback: If setVideoSource is not available, we cannot switch without recreating
    // But we should avoid this path - it creates duplicate DOM nodes
    console.warn('⚠️ useVonageSession: setVideoSource not available, cannot switch camera without recreating publisher');
    setError("Camera switching requires setVideoSource support. Please try leaving and rejoining the call.");
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

          // Dispatch event to update participant info controls
          document.dispatchEvent(new CustomEvent('audioDeviceUpdate'));
          return;
        }
    } catch (error) {

    }

    // Fallback: If setAudioSource is not available, we cannot switch without recreating
    // But we should avoid this path - it creates duplicate DOM nodes
    console.warn('⚠️ useVonageSession: setAudioSource not available, cannot switch microphone without recreating publisher');
    setError("Microphone switching requires setAudioSource support. Please try leaving and rejoining the call.");
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
    // participantInfo.appendChild(participantNameElement);
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

  // Cleanup stats monitoring
  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, []);

  const sendChatMessage = useCallback((content: string, type: 'text' | 'image' | 'file' = 'text', attachment?: any) => {

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

    if (messageSize > 8000) { // 8KB limit

      setError('File too large to send. Please use a smaller file (under 5KB).');
      return;
    }

    (sessionRef.current as any).signal({
      type: 'msg',
      data: messageData
    }, (error?: Error) => {
      if (error) {
        console.error('❌ Failed to send chat message:', error);
      } else {

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

    participants.forEach((participant, index) => {

    });

    // Also display in a user-friendly format
    const localParticipant = participants.find(p => p.isLocal);
    const remoteParticipants = participants.filter(p => !p.isLocal);

    remoteParticipants.forEach((participant, index) => {

    });
    
    // Debug remote container state
    const remoteEl = remoteContainerRef.current;

    if (remoteEl) {

      Array.from(remoteEl.children).forEach((child, index) => {

      });
    }
  }, [participants]);

  const debugPublisherState = useCallback(() => {
    const publisher = publisherRef.current;
    const session = sessionRef.current;

  }, [isConnected, isCameraOff, isVideoEnabled, isMicMuted, isAudioEnabled]);

  const debugSessionConnections = useCallback(() => {
    const session = sessionRef.current;
    if (!session) {

      return;
    }

    // Ensure we have arrays to work with
    const connectionsArray = Array.isArray(session.connections) ? session.connections : [];
    const streamsArray = Array.isArray(session.streams) ? session.streams : [];

    // Log each connection
    connectionsArray.forEach((connection: any, index: number) => {

    });

    // Log each stream
    streamsArray.forEach((stream: any, index: number) => {

    });

    // Check if doctor has published a stream
    const doctorConnections = connectionsArray.filter((conn: any) => 
      conn.connectionId !== session.connection?.connectionId
    );
    
    const doctorStreams = streamsArray.filter((stream: any) => 
      stream.connection?.connectionId !== session.connection?.connectionId
    );

    if (doctorConnections.length > 0 && doctorStreams.length === 0) {

    } else if (doctorConnections.length === 0) {

    } else if (doctorStreams.length > 0) {

    }
  }, []);

  const startCameraPreview = useCallback(async () => {

    if (!localContainerRef.current) {

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

        enablePiPSupportOnVideo(videoElement);

        // Only append manual preview if publisher doesn't exist yet
        // Once publisher is created, it manages the video element
        if (!publisherRef.current) {
          localEl.appendChild(videoElement);
        } else {
        }

      }
    } catch (error) {
      console.error('❌ Manual camera preview failed:', error);
    }
  }, []);

  const checkExistingStreams = useCallback(() => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }

    const existingStreams = Array.isArray(session.streams) ? session.streams : [];
    const currentConnectionId = session.connection?.connectionId;
    const currentCallMode = callModeRef.current;

    existingStreams.forEach((stream: any, index: number) => {
      const isOwn = stream.connection?.connectionId === currentConnectionId;

      if (!isOwn) {
        // In audio mode, skip subscribing to remote video streams - only subscribe to audio streams
        // In video mode, subscribe to ALL streams (both video and audio-only)
        if (currentCallMode === 'audio' && stream.hasVideo) {
          return; // Don't subscribe to video streams when in audio mode
        }

        // Check if stream is already subscribed (avoid duplicate subscriptions)
        const remoteEl = remoteContainerRef.current;
        if (!remoteEl) {
          return; // No remote container available
        }
        
        const streamId = stream.streamId;
        const existingWrapper = remoteEl.querySelector(`[data-stream-id="${streamId}"]`);
        if (existingWrapper) {
          return; // Already subscribed, skip
        }

        // Manually trigger subscription to existing stream
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
          }
        });
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

  // Settings function to open device settings
  const openDeviceSettings = useCallback(() => {
    // This function can be used to trigger device settings UI
    // For now, it's a placeholder that can be extended
    // In the future, this could open a modal with device settings options
  }, []);

  // Helper: hide/show local publisher video without removing nodes
  const setLocalVideoVisibility = useCallback((show: boolean) => {
    const root = localContainerRef.current || localContainer;
    if (!root) return;
    
    const videos = root.querySelectorAll('video');
    videos.forEach((v: HTMLVideoElement) => {
      v.style.display = show ? '' : 'none';
      v.style.visibility = show ? 'visible' : 'hidden';
      v.style.opacity = show ? '1' : '0';
    });
  }, [localContainer]);

  // Set call mode and update video publishing
  // Idempotent with guards to prevent redundant calls and stale overwrites
  const setCallMode = useCallback(async (mode: 'audio' | 'video') => {
    // Drop exact duplicate - already in this mode and no pending change
    if (callModeRef.current === mode && lastRequestedModeRef.current === mode) {
      return;
    }

    // Serialize transitions - wait for any in-flight transition
    if (transitionLockRef.current) {
      await transitionLockRef.current;
    }

    lastRequestedModeRef.current = mode;

    const run = (async () => {
      // If a newer request superseded us, bail
      if (lastRequestedModeRef.current !== mode) {
        return;
      }


      // Idempotent guard - already in this mode
      if (callModeRef.current === mode) {
        return;
      }

      callModeRef.current = mode;

      // Ensure publisher exists and is in the correct container
      ensurePublisher();
      const publisher = publisherRef.current;
      
      if (!publisher) {
        // Try to ensure it exists
        ensurePublisher();
        const retryPublisher = publisherRef.current;
        if (!retryPublisher) {
          console.error('❌ Publisher still not available after ensurePublisher');
          setIsCameraOff(mode === 'audio');
          setIsVideoEnabled(mode === 'video');
          return;
        }
      }

      // Make sure publisher is mounted under the correct container
      if (!publisher) {
        console.error('❌ Publisher is null after ensurePublisher');
        setIsCameraOff(mode === 'audio');
        setIsVideoEnabled(mode === 'video');
        return;
      }
      
      const pubEl = (publisher as any)?.element as HTMLElement | undefined;
      const parentId = pubEl?.parentElement?.id;
      if (parentId !== 'vonage-local-container') {
        console.error('❌ Publisher is not under local container, re-mounting', { parentId });
        // Destroy and re-create in the right place (last resort)
        try {
          publisher.destroy();
        } catch (e) {
          // Ignore errors
        }
        publisherRef.current = null;
        didInitPublisher.current = false;
        ensurePublisher();
        const newPublisher = publisherRef.current;
        if (!newPublisher) {
          console.error('❌ Failed to re-create publisher in correct container');
          setIsCameraOff(mode === 'audio');
          setIsVideoEnabled(mode === 'video');
          return;
        }
        // Use the new publisher
        const updatedPublisher: VonagePublisher = newPublisher;
        
        // Runtime check after switch
        const pubElAfter = (updatedPublisher as any)?.element as HTMLElement | undefined;
        
        // Continue with mode switch using new publisher
        if (mode === 'audio') {
          updatedPublisher.publishVideo(false);
          setLocalVideoVisibility(false);
          setIsCameraOff(true);
          setIsVideoEnabled(false);
          return;
        } else {
          updatedPublisher.publishVideo(true);
          setLocalVideoVisibility(true);
          setIsCameraOff(false);
          setIsVideoEnabled(true);
          return;
        }
      }
      
      // Runtime check after switch

      // Check current video state to avoid redundant publishVideo calls
      if (!publisher) {
        console.error('❌ Publisher is null after verification');
        setIsCameraOff(mode === 'audio');
        setIsVideoEnabled(mode === 'video');
        return;
      }
      
      const publisherStream = publisher.stream;
      const hasVideo = !!(publisherStream && (publisherStream as any).hasVideo);

      if (mode === 'audio') {
        // Only toggle if actually on
        if (hasVideo) {
          try {
            // Call publishVideo (OpenTok SDK returns void, not a Promise)
            publisher.publishVideo(false);
            setLocalVideoVisibility(false);
            setIsCameraOff(true);
            setIsVideoEnabled(false);
            
            // Hide publisher element visually (don't destroy, just hide)
            const pubEl = (publisher as any)?.element as HTMLElement | undefined;
            if (pubEl) {
              pubEl.style.display = 'none';
            }
            
            // Update local participant's hasVideo property
            const session = sessionRef.current;
            if (session?.connection?.connectionId) {
              setParticipants((prev) => {
                return prev.map((participant) => 
                  participant.isLocal && participant.connectionId === session.connection?.connectionId
                    ? { ...participant, hasVideo: false }
                    : participant
                );
              });
            }
          } catch (error) {
            console.warn('⚠️ useVonageSession: Error disabling video publishing:', error);
            setIsCameraOff(true);
            setIsVideoEnabled(false);
          }
        } else {
          // Already in audio mode, just ensure state is correct
          setLocalVideoVisibility(false);
          setIsCameraOff(true);
          setIsVideoEnabled(false);
          
          // Hide publisher element visually
          const pubEl = (publisher as any)?.element as HTMLElement | undefined;
          if (pubEl) {
            pubEl.style.display = 'none';
          }
        }
      } else {
        // Video mode: only toggle if actually off
        if (!hasVideo) {
          try {
            // Check if publisher already has video stream
            if (!hasVideo) {
              // Publisher doesn't have video, need to get camera access
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const videoTracks = stream.getVideoTracks();
                
                if (videoTracks.length > 0) {
                  // Ensure all video tracks are enabled (don't stop existing tracks)
                  videoTracks.forEach(track => {
                    track.enabled = true;
                  });
                  
                  // Set video source if supported
                  if (publisher.setVideoSource && typeof publisher.setVideoSource === 'function') {
                    try {
                      const deviceId = videoTracks[0].getSettings().deviceId;
                      if (deviceId) {
                        await publisher.setVideoSource(deviceId);
                      }
                    } catch (setSourceError: any) {
                      const errorCode = setSourceError?.code;
                      const errorName = setSourceError?.name;
                      if (errorCode !== 1040 && errorName !== 'OT_SET_VIDEO_SOURCE_FAILURE') {
                        console.warn('⚠️ useVonageSession: Could not set video source:', setSourceError);
                      }
                    }
                  }
                }
              } catch (permError) {
                console.error('❌ useVonageSession: Error requesting camera permissions:', permError);
                setIsCameraOff(true);
                setIsVideoEnabled(false);
                return;
              }
            }
            
            // Show publisher element visually (unhide)
            const pubEl = (publisher as any)?.element as HTMLElement | undefined;
            if (pubEl) {
              pubEl.style.display = '';
            }
            
            // Enable video publishing (OpenTok SDK returns void, not a Promise)
            if (publisher) {
              publisher.publishVideo(true);
              setLocalVideoVisibility(true);
              setIsCameraOff(false);
              setIsVideoEnabled(true);
            }
            
            // Update local participant's hasVideo property
            const session = sessionRef.current;
            if (session?.connection?.connectionId) {
              setParticipants((prev) => {
                return prev.map((participant) => 
                  participant.isLocal && participant.connectionId === session.connection?.connectionId
                    ? { ...participant, hasVideo: true }
                    : participant
                );
              });
            }
            
            // Subscribe to any existing remote streams that were skipped while in audio mode
            setTimeout(() => {
              checkExistingStreams();
            }, 1000);
            
          } catch (error) {
            console.error('❌ useVonageSession: Error enabling video publishing:', error);
            setIsCameraOff(true);
            setIsVideoEnabled(false);
          }
        } else {
          // Already in video mode, just ensure state is correct
          setLocalVideoVisibility(true);
          setIsCameraOff(false);
          setIsVideoEnabled(true);
        }
      }
    })();

    transitionLockRef.current = run.finally(() => { 
      transitionLockRef.current = null; 
    });
    
    await run;
  }, [setLocalVideoVisibility, checkExistingStreams]);

  return useMemo(
    () => ({
      join,
      leave,
      toggleMic,
      toggleCamera,
      switchCamera,
      switchMicrophone,
      selectMicrophone,
      openDeviceSettings,
      setCallMode,
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
      networkQuality,
      audioLevel,
      audioDevices: audioDevicesRef.current,
      currentAudioDevice: currentAudioDeviceRef.current,
      chatMessages,
      sendChatMessage,
      typingUsers,
      sendTypingIndicator,
      stopTypingIndicator,
      clearChatHistory,
      // PiP and speaker detection props
      onParticipantVideoReady,
      activeSpeakerId,
      enablePiPFollowSpeaker,
      disablePiPFollowSpeaker,
      pipFollowsSpeaker,
      getVideoElementById,
      isPictureInPicture,
      pendingPiPRequest,
      setPendingPiPRequest,
      togglePictureInPicture,
    }),
    [join, leave, toggleMic, toggleCamera, switchCamera, switchMicrophone, selectMicrophone, openDeviceSettings, setCallMode, isConnected, isBusy, isMicMuted, isCameraOff, statusMessage, error, clearError, participants, printParticipants, checkExistingStreams, startCameraPreview, callStatus, participantCount, isAudioEnabled, isVideoEnabled, signalStrength, networkQuality, audioLevel, chatMessages, sendChatMessage, typingUsers, sendTypingIndicator, stopTypingIndicator, clearChatHistory, assessNetworkQuality, onParticipantVideoReady, activeSpeakerId, enablePiPFollowSpeaker, disablePiPFollowSpeaker, pipFollowsSpeaker, getVideoElementById, isPictureInPicture, pendingPiPRequest, setPendingPiPRequest, togglePictureInPicture],
  );
}