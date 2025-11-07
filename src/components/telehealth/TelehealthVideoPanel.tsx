"use client";

import { CSSProperties, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, GripVertical, X, User, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface TelehealthVideoPanelProps {
  sessionTitle: string;
  providerName: string;
  participants: Array<{ connectionId: string; streamId?: string; hasVideo: boolean; hasAudio: boolean; isLocal: boolean; }>;
  localParticipantName?: string;
  statusMessage?: string;
  onRemoteContainerReady?: (element: HTMLDivElement | null) => void;
  onLocalContainerReady?: (element: HTMLDivElement | null) => void;
  overlayControls?: ReactNode;
  signalStrength?: 'excellent' | 'good' | 'fair' | 'poor';
  pendingPiPRequest?: boolean;
  isPictureInPicture?: boolean;
  onTogglePictureInPicture?: () => void;
  onCurrentViewPiP?: () => void;
  setPendingPiPRequest?: (value: boolean) => void;
  onParticipantVideoReady?: (connectionId: string, el: HTMLVideoElement | null) => void;
  enablePiPFollowSpeaker?: () => void;
  pipFollowsSpeaker?: boolean;
  activeSpeakerId?: string | null;
  participantAudioLevels?: Map<string, number>;
  getVideoElementById?: (connectionId: string) => HTMLVideoElement | null;
  registerPiPToggle?: (fn: () => void) => void;
  callMode?: 'audio' | 'video' | null;
}

type TileStrength = 'excellent' | 'good' | 'fair' | 'poor';

type PiPEnabledVideo = HTMLVideoElement & {
  autoPictureInPicture?: boolean;
  disablePictureInPicture?: boolean;
  audioTracks?: MediaStreamTrack[];
  mozHasAudio?: boolean;
  webkitAudioDecodedByteCount?: number;
};

const ensurePictureInPictureReady = (video: HTMLVideoElement) => {
  const pipVideo = video as PiPEnabledVideo;

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
  }
  // Set HTML attribute for better compatibility (boolean attribute)
  pipVideo.setAttribute('autopictureinpicture', '');

  // Ensure video has proper attributes for PiP
  pipVideo.setAttribute('data-pip-enabled', 'true');
  
  // Do NOT forcibly unmute here - let the app control audio policy
  // Chrome doesn't require unmuting for PiP eligibility

  // Ensure video is playing for auto PiP eligibility
  if (pipVideo.paused) {
    pipVideo.play().catch(error => {

    });
  }

};

// Track normalized videos and event listeners to prevent duplicates
const normalizedVideos = new WeakMap<HTMLVideoElement, {
  checkVideoState: () => void;
  listeners: Array<{ element: EventTarget; event: string; handler: EventListener }>;
}>();

// Throttled function type with cancel method
type ThrottledFunction = (() => void) & { cancel: () => void };

// Throttled checkVideoState to prevent excessive calls
const throttle = (fn: () => void, delay: number): ThrottledFunction => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecTime = 0;
  const throttled = (() => {
    const currentTime = Date.now();
    const timeSinceLastExec = currentTime - lastExecTime;
    
    if (timeSinceLastExec > delay) {
      fn();
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn();
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay - timeSinceLastExec);
    }
  }) as ThrottledFunction;
  
  // Add cleanup method
  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return throttled;
};

const normalizeVideoElements = (
  container: HTMLDivElement | null,
  opts?: { strength?: TileStrength; names?: string[]; skipOverlays?: boolean }
) => {
  if (!container) return;
  
  // Check if this is the local container - skip overlays for local container
  const isLocalContainer = container.id === 'vonage-local-container' || container.closest('#vonage-local-container');
  const skipOverlays = opts?.skipOverlays || isLocalContainer;

  const isTiled = container.dataset.tiled === "true";
  const videos = container.querySelectorAll("video");
  videos.forEach((video, index) => {
    ensurePictureInPictureReady(video);
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.maxHeight = "100%";
    video.style.objectFit = isTiled ? "cover" : "contain";
    video.style.borderRadius = "0";
    const wrapper = video.parentElement as HTMLElement | null;
    
    if (!wrapper) return;
    
    // For local container: just size the video and bail out - skip all overlays
    if (skipOverlays) {
      // Remove any overlays that may have been added previously
      const existing = wrapper.querySelectorAll('.camera-off-overlay, .avatar-placeholder, .tile-signal-badge, .tile-name-badge');
      existing.forEach(el => el.remove());
      
      // Do NOT create avatar/overlays for local
      // Just mark as normalized to prevent re-processing
      if (!normalizedVideos.has(video)) {
        normalizedVideos.set(video, { checkVideoState: () => {}, listeners: [] });
      }
      return; // Important: early return for local container
    }
    
    // Skip if already normalized (except for name updates or when forced)
    const existing = normalizedVideos.get(video);
    const hasNameUpdate = opts?.names?.[index] && opts.names[index] !== wrapper.dataset.participantName;
    
    if (existing && !hasNameUpdate) {
      // Already normalized, just update state if needed
      existing.checkVideoState();
      return;
    }
    
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.backgroundColor = "transparent";
    wrapper.style.minHeight = "0";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.maxWidth = "100%";
    wrapper.style.maxHeight = "100%";
    wrapper.style.aspectRatio = isTiled ? "16 / 9" : "";
    wrapper.style.borderRadius = isTiled ? "12px" : "8px";
    wrapper.style.overflow = "hidden";
    wrapper.style.boxShadow = isTiled ? "0 6px 24px rgba(0,0,0,0.25)" : "0 4px 16px rgba(0,0,0,0.2)";
    wrapper.style.position = "relative";

      // Always ensure avatar placeholder exists for this wrapper
      // Get participant name from wrapper dataset, fallback to options or default
      const participantNameFromWrapper = wrapper.dataset.participantName;
      const participantName = participantNameFromWrapper || opts?.names?.[index] || `Participant ${index + 1}`;
      
      // Extract initials from name (first letter of each word, max 2 letters)
      const getInitials = (name: string) => {
        const words = name.trim().split(/\s+/);
        if (words.length >= 2) {
          return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
      };
      const initials = getInitials(participantName);
      
      const avatarPlaceholder = wrapper.querySelector('.avatar-placeholder') as HTMLElement;
      const cameraOffOverlay = wrapper.querySelector('.camera-off-overlay') as HTMLElement;
      
      // Remove overlay if it exists (we don't want overlays on local container)
      if (skipOverlays && cameraOffOverlay) {
        cameraOffOverlay.remove();
      }
      
      // Don't create overlay for local container
      if (!skipOverlays && !cameraOffOverlay) {
        // A full-bleed black overlay we can toggle to fully cover any SDK UI when camera is off
        const overlay = document.createElement('div');
        overlay.className = 'camera-off-overlay';
        overlay.style.position = 'absolute';
        overlay.style.inset = '0';
        overlay.style.backgroundColor = '#000000';
        overlay.style.zIndex = '9'; // Below the avatar (zIndex 10), above the video element
        overlay.style.display = 'none';
        wrapper.appendChild(overlay);
      }

      if (!avatarPlaceholder) {
        const avatar = document.createElement('div');
        avatar.className = 'avatar-placeholder';
        avatar.style.position = 'absolute';
        avatar.style.top = '50%';
        avatar.style.left = '50%';
        avatar.style.transform = 'translate(-50%, -50%)';
        avatar.style.zIndex = '10';
        avatar.style.display = 'flex';
        avatar.style.flexDirection = 'column';
        avatar.style.alignItems = 'center';
        avatar.style.gap = '8px';
        avatar.style.pointerEvents = 'none';
        
        // Create avatar circle with initials or User icon
        const avatarCircle = document.createElement('div');
        avatarCircle.style.width = isTiled ? '64px' : '48px';
        avatarCircle.style.height = isTiled ? '64px' : '48px';
        avatarCircle.style.borderRadius = '50%';
        avatarCircle.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
        avatarCircle.style.display = 'flex';
        avatarCircle.style.alignItems = 'center';
        avatarCircle.style.justifyContent = 'center';
        avatarCircle.style.color = 'white';
        avatarCircle.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        avatarCircle.style.fontWeight = '600';
        avatarCircle.style.fontSize = isTiled ? '20px' : '16px';
        avatarCircle.style.letterSpacing = '0.5px';
        
        // Use initials if we have a real participant name, otherwise User icon
        // Check if name is more than just "Participant" followed by numbers
        const hasRealName = participantNameFromWrapper && 
          !participantNameFromWrapper.match(/^Participant\s+[a-f0-9]{4}$/i);
        
        if (hasRealName) {
          avatarCircle.textContent = initials;
        } else {
          // Create User icon SVG as fallback
          const userIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          userIcon.setAttribute('width', isTiled ? '32' : '24');
          userIcon.setAttribute('height', isTiled ? '32' : '24');
          userIcon.setAttribute('viewBox', '0 0 24 24');
          userIcon.setAttribute('fill', 'none');
          userIcon.setAttribute('stroke', 'currentColor');
          userIcon.setAttribute('stroke-width', '2');
          userIcon.setAttribute('stroke-linecap', 'round');
          userIcon.setAttribute('stroke-linejoin', 'round');
          
          const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path1.setAttribute('d', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2');
          userIcon.appendChild(path1);
          
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', '12');
          circle.setAttribute('cy', '7');
          circle.setAttribute('r', '4');
          userIcon.appendChild(circle);
          
          avatarCircle.appendChild(userIcon);
        }
        
        // Create participant name text (truncate if too long)
        const participantNameText = document.createElement('span');
        participantNameText.className = 'participant-name-text';
        participantNameText.style.color = '#e2e8f0';
        participantNameText.style.fontSize = isTiled ? '13px' : '12px';
        participantNameText.style.fontWeight = '500';
        participantNameText.style.textAlign = 'center';
        participantNameText.style.maxWidth = '120px';
        participantNameText.style.overflow = 'hidden';
        participantNameText.style.textOverflow = 'ellipsis';
        participantNameText.style.whiteSpace = 'nowrap';
        participantNameText.textContent = participantName;
        
        // Create camera off indicator text
        const cameraOffText = document.createElement('span');
        cameraOffText.className = 'camera-off-text';
        cameraOffText.style.color = '#94a3b8';
        cameraOffText.style.fontSize = isTiled ? '11px' : '10px';
        cameraOffText.style.fontWeight = '400';
        cameraOffText.textContent = 'Camera off';
        
        avatar.appendChild(avatarCircle);
        avatar.appendChild(participantNameText);
        avatar.appendChild(cameraOffText);
        wrapper.appendChild(avatar);
        
        // Store participant name in dataset for later updates
        avatar.dataset.participantName = participantName;
        
        // Initially hide the avatar - it will be shown by checkVideoState if needed
        avatar.style.display = 'none';
      } else {
        // Update existing avatar with participant name if available
        const nameText = avatarPlaceholder.querySelector('.participant-name-text') as HTMLElement;
        if (nameText && participantNameFromWrapper) {
          nameText.textContent = participantName;
        }
        // Update initials in circle if it exists
        const avatarCircle = avatarPlaceholder.querySelector('div') as HTMLElement;
        if (avatarCircle && participantNameFromWrapper) {
          const hasRealName = !participantNameFromWrapper.match(/^Participant\s+[a-f0-9]{4}$/i);
          // Clear existing content and add initials if we have a real name
          if (hasRealName && avatarCircle.querySelector('svg')) {
            avatarCircle.innerHTML = '';
            avatarCircle.textContent = getInitials(participantName);
          }
        }
      }

      // Check if video is actually playing and show/hide avatar accordingly
      const checkVideoStateInner = () => {
        const avatar = wrapper.querySelector('.avatar-placeholder') as HTMLElement;
        const overlay = wrapper.querySelector('.camera-off-overlay') as HTMLElement;
        if (!avatar) return;
        
        // Check if THIS specific video has a valid srcObject and is playing
        let hasValidVideo = false;
        
        if (video.srcObject && video.srcObject instanceof MediaStream) {
          const videoTracks = video.srcObject.getVideoTracks();
          
          // Check if there are video tracks and they are enabled
          if (videoTracks.length > 0) {
            const videoTrack = videoTracks[0];
            hasValidVideo = videoTrack.enabled && 
              !videoTrack.muted &&
              videoTrack.readyState === 'live' &&
              !video.paused &&
              video.readyState >= 2 && // HAVE_CURRENT_DATA
              video.videoWidth > 0 && video.videoHeight > 0; // Ensure video has dimensions
          }
        }
        
        if (hasValidVideo) {
          // Video is active - hide avatar and overlay
          avatar.style.display = 'none';
          if (overlay && !skipOverlays) {
            overlay.style.display = 'none';
          } else if (overlay && skipOverlays) {
            overlay.remove(); // Remove overlay completely for local container
          }
          wrapper.style.backgroundColor = 'transparent'; // Transparent background
        } else {
          // Video is not active - show avatar with black background
          avatar.style.display = 'flex';
          if (overlay && !skipOverlays) {
            overlay.style.display = 'block';
          } else if (overlay && skipOverlays) {
            overlay.remove(); // Remove overlay for local container
          }
          wrapper.style.backgroundColor = '#000000'; // Black background
        }
      };

      // Throttle checkVideoState - timeupdate fires multiple times per second
      const checkVideoState = throttle(checkVideoStateInner, 200);

      // Clean up existing listeners if video was already normalized
      if (existing) {
        existing.listeners.forEach(({ element, event, handler }) => {
          element.removeEventListener(event, handler);
        });
        normalizedVideos.delete(video);
      }

      // Store listeners for cleanup
      const listeners: Array<{ element: EventTarget; event: string; handler: EventListener }> = [];

      // Check initially
      checkVideoState();
      
      // Add event listeners (non-frequent events)
      const addListener = (element: EventTarget, event: string, handler: EventListener) => {
        element.addEventListener(event, handler);
        listeners.push({ element, event, handler });
      };

      addListener(video, 'loadeddata', checkVideoState);
      addListener(video, 'canplay', checkVideoState);
      addListener(video, 'pause', checkVideoState);
      addListener(video, 'play', checkVideoState);
      // Throttle timeupdate which fires very frequently
      addListener(video, 'timeupdate', checkVideoState);
      
      // Also listen to track changes
      if (video.srcObject instanceof MediaStream) {
        addListener(video.srcObject, 'removetrack', checkVideoState);
        addListener(video.srcObject, 'addtrack', checkVideoState);
        
        // Listen to individual track state changes
        const videoTracks = video.srcObject.getVideoTracks();
        videoTracks.forEach(track => {
          addListener(track, 'ended', checkVideoState);
          addListener(track, 'mute', checkVideoState);
          addListener(track, 'unmute', checkVideoState);
        });
      }
      
      // Fallback: check again after a short delay to ensure avatar is created
      setTimeout(checkVideoState, 500);

      // Store the checkVideoState function and listeners for cleanup
      normalizedVideos.set(video, { checkVideoState, listeners });

      // Remove signal badge if it exists (especially for local container)
      const existingBadge = wrapper.querySelector('.tile-signal-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
      
      // Don't create signal badge for local container
      if (!skipOverlays && !wrapper.querySelector('.tile-signal-badge')) {
        const badge = document.createElement('div');
        badge.className = 'tile-signal-badge';
        badge.style.position = 'absolute';
        badge.style.bottom = '6px';
        badge.style.right = '6px';
        badge.style.display = 'flex';
        badge.style.gap = '2px';
        badge.style.alignItems = 'flex-end';
        badge.style.padding = '2px 4px';
        badge.style.borderRadius = '9999px';
        badge.style.background = 'rgba(0,0,0,0.45)';
        badge.style.backdropFilter = 'blur(6px)';

        const levels = 4;
        const s = opts?.strength;
        const active = s === 'excellent' ? 4 : s === 'good' ? 3 : s === 'fair' ? 2 : s === 'poor' ? 1 : 3;
        for (let i = 1; i <= levels; i++) {
          const bar = document.createElement('span');
          bar.style.width = '3px';
          bar.style.height = `${3 + i * 3}px`;
          bar.style.borderRadius = '2px';
          bar.style.background = i <= active ? '#22c55e' : 'rgba(255,255,255,0.35)';
          badge.appendChild(bar);
        }
        wrapper.appendChild(badge);
      }

      // Add participant name badge (mobile/tablet only)
      const nm = opts?.names?.[index];
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
      // Remove existing on desktop to avoid showing names there
      const existingName = wrapper.querySelector('.tile-name-badge');
      if (isDesktop && existingName) existingName.remove();
      if (!isDesktop && nm && !existingName) {
        const nameEl = document.createElement('div');
        nameEl.className = 'tile-name-badge';
        nameEl.textContent = nm;
        nameEl.style.position = 'absolute';
        nameEl.style.left = '8px';
        nameEl.style.bottom = '8px';
        nameEl.style.padding = '2px 8px';
        nameEl.style.fontSize = '12px';
        nameEl.style.fontWeight = '600';
        nameEl.style.color = '#fff';
        nameEl.style.background = 'rgba(0,0,0,0.55)';
        nameEl.style.borderRadius = '9999px';
        nameEl.style.backdropFilter = 'blur(6px)';
        nameEl.style.pointerEvents = 'none';
        wrapper.appendChild(nameEl);
      }
  });
};

export function TelehealthVideoPanel({
  sessionTitle,
  providerName,
  participants,
  localParticipantName = "You",
  statusMessage,
  onRemoteContainerReady,
  onLocalContainerReady,
  overlayControls,
  signalStrength,
  pendingPiPRequest = false,
  isPictureInPicture = false,
  onTogglePictureInPicture,
  onCurrentViewPiP,
  setPendingPiPRequest,
  onParticipantVideoReady,
  enablePiPFollowSpeaker,
  pipFollowsSpeaker = false,
  activeSpeakerId,
  participantAudioLevels,
  getVideoElementById,
  registerPiPToggle,
  callMode = null,
}: TelehealthVideoPanelProps) {
  // Log callMode changes to debug UI updates
  useEffect(() => {
    console.log('🎨 TelehealthVideoPanel: callMode changed to:', callMode);
  }, [callMode]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const remoteRef = useRef<HTMLDivElement | null>(null);
  const localRef = useRef<HTMLDivElement | null>(null);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [localHasVideo, setLocalHasVideo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remoteTileCount, setRemoteTileCount] = useState(0);
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasUserPositioned, setHasUserPositioned] = useState(false);
  
  // Simple PiP state
  const [localIsPictureInPicture, setLocalIsPictureInPicture] = useState(false);

  // Handle PiP toggle - request PiP for a video element
  const handleTogglePictureInPicture = useCallback(async () => {
    try {
      // Check if PiP is already active
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setLocalIsPictureInPicture(false);
        if (setPendingPiPRequest) setPendingPiPRequest(false);
        return;
      }

      // Enable follow speaker if available
      if (enablePiPFollowSpeaker && activeSpeakerId) {
        enablePiPFollowSpeaker();
      }

      // Find the best video element to use for PiP
      let targetVideo: HTMLVideoElement | null = null;

      // Priority: active speaker > first remote video > local video
      if (activeSpeakerId && getVideoElementById) {
        targetVideo = getVideoElementById(activeSpeakerId);
      }

      if (!targetVideo && remoteRef.current) {
        const remoteVideo = remoteRef.current.querySelector('video') as HTMLVideoElement;
        if (remoteVideo && remoteVideo.srcObject) {
          targetVideo = remoteVideo;
        }
      }

      if (!targetVideo && localRef.current) {
        const localVideo = localRef.current.querySelector('video') as HTMLVideoElement;
        if (localVideo && localVideo.srcObject) {
          targetVideo = localVideo;
        }
      }

      if (!targetVideo) {
        console.warn('No video element available for PiP');
        return;
      }

      // Ensure video is ready for PiP
      ensurePictureInPictureReady(targetVideo);

      // Ensure video is playing
      if (targetVideo.paused) {
        await targetVideo.play();
      }

      // Request Picture-in-Picture
      await targetVideo.requestPictureInPicture();
      setLocalIsPictureInPicture(true);
      if (setPendingPiPRequest) setPendingPiPRequest(false);

    } catch (err) {
      console.error('PiP error:', err);
      if (setPendingPiPRequest) setPendingPiPRequest(false);
      
      // Handle specific errors
      const error = err as Error & { name?: string };
      if (error.name === 'InvalidStateError') {
        console.warn('PiP: Video not ready or already in PiP');
      } else if (error.name === 'NotAllowedError') {
        console.warn('PiP: User denied PiP permission');
      }
    }
  }, [activeSpeakerId, getVideoElementById, enablePiPFollowSpeaker, setPendingPiPRequest]);

  // Swap PiP video stream when active speaker changes (if follow speaker is enabled)
  useEffect(() => {
    if (!pipFollowsSpeaker || !isPictureInPicture || !activeSpeakerId || !getVideoElementById) return;
    
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

  // Listen for PiP events
  useEffect(() => {
    const handleEnterPiP = () => setLocalIsPictureInPicture(true);
    const handleLeavePiP = () => setLocalIsPictureInPicture(false);

    document.addEventListener('enterpictureinpicture', handleEnterPiP);
    document.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      document.removeEventListener('enterpictureinpicture', handleEnterPiP);
      document.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, []);

  useEffect(() => {
    onRemoteContainerReady?.(remoteRef.current);
    return () => onRemoteContainerReady?.(null);
  }, [onRemoteContainerReady]);

  // Track viewport width for responsive tiling decisions and auto-fullscreen on mobile/tablet
  useEffect(() => {
    const onResize = () => {
      const newWidth = window.innerWidth;
      setViewportWidth(newWidth);
      // Auto-enable fullscreen on mobile/tablet devices
      if (newWidth < 1024) {
        setIsFullscreen(true);
      }
    };
    
    // Set initial fullscreen state for mobile/tablet
    if (viewportWidth < 1024) {
      setIsFullscreen(true);
    }
    
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [viewportWidth]);

  // Hand the container ONLY when in video. Do NOT null it during a video switch.
  useEffect(() => {
    if (callMode === 'video') {
      onLocalContainerReady?.(localRef.current);
      
      // Belt-and-suspenders: enforce one publisher subtree in the local container
      const root = localRef.current;
      if (root) {
        const pubs = root.querySelectorAll('.OT_publisher');
        pubs.forEach((n, i) => {
          if (i > 0) {
            try {
              n.parentElement?.removeChild(n);
            } catch (e) {
              // Ignore errors
            }
          }
        });
      }
    }
    // No cleanup here that nulls the container - prevents race during mode switch
  }, [callMode, onLocalContainerReady]);

  // In audio mode, explicitly hand back null once (no cleanup race).
  useEffect(() => {
    if (callMode === 'audio') {
      onLocalContainerReady?.(null);
    }
  }, [callMode, onLocalContainerReady]);

  // Add a short grace period after switching to video so the overlay doesn't flash while OT mounts
  useEffect(() => {
    if (callMode !== 'video') return;
    
    // Optimistic: assume video will appear in the next few ticks
    setLocalHasVideo(true);
    const t1 = setTimeout(() => {
      // Observer will correct this if needed
    }, 800);
    
    return () => clearTimeout(t1);
  }, [callMode]);

  // Hard block OT nodes from appearing in audio mode (panel-level guard)
  useEffect(() => {
    if (callMode !== 'audio') return;

    const root = panelRef.current;
    if (!root) return;

    const kill = (el: Element) => { 
      try { 
        el.parentElement?.removeChild(el); 
      } catch {} 
    };
    
    const purge = () => {
      // Purge any OT nodes or video elements from local container
      const localContainer = root.querySelector('#vonage-local-container');
      if (localContainer) {
        localContainer.querySelectorAll('.OT_publisher, .OT_subscriber, video').forEach(kill);
      }
      // Also check for any OT nodes directly in the panel
      root.querySelectorAll('.OT_publisher, .OT_subscriber').forEach((el) => {
        // Only remove if it's inside or near the local container area
        if (el.closest('#vonage-local-container') || el.closest('[data-role="local"]')) {
          kill(el);
        }
      });
    };

    purge(); // once immediately

    // Keep enforcing while in audio mode
    const mo = new MutationObserver(() => purge());
    mo.observe(root, { childList: true, subtree: true });
    
    return () => mo.disconnect();
  }, [callMode]);

  useEffect(() => {
    const remoteElement = remoteRef.current;
    if (!remoteElement) return;

    // Derive remote names from participants
    const remoteNamesList = participants
      .filter(p => !p.isLocal)
      .map(p => `Participant ${p.connectionId.slice(-4)}`);

    let timeoutId: NodeJS.Timeout | null = null;

    const update = () => {
      const videos = remoteElement.querySelectorAll("video");
      const hasVideo = videos.length > 0;
      setRemoteHasVideo(hasVideo);
      setRemoteTileCount(videos.length);
      if (hasVideo) {
        normalizeVideoElements(remoteElement, { strength: signalStrength, names: remoteNamesList });
      }
    };

    // Debounced update to avoid excessive calls
    const debouncedUpdate = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(update, 100);
    };

    update(); // Initial update immediately

    const observer = new MutationObserver(debouncedUpdate);
    observer.observe(remoteElement, { childList: true, subtree: true });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [signalStrength, participants]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const panel = panelRef.current;
      setIsFullscreen(document.fullscreenElement === panel);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Set participant name in dataset whenever it changes (skip in audio mode to avoid duplicates)
  useEffect(() => {
    if (callMode === 'audio') return; // Skip in audio mode - we show custom avatar instead
    
    const localElement = localRef.current;
    if (!localElement) return;

    const participantName = localParticipantName || "You";
    localElement.dataset.participantName = participantName;
    // Also set on parent wrapper if it exists
    const videoWrapper = localElement.parentElement;
    if (videoWrapper) {
      videoWrapper.dataset.participantName = participantName;
    }
    // Set on the container element itself
    const container = localElement.closest('[id*="container"], [class*="container"]');
    if (container) {
      (container as HTMLElement).dataset.participantName = participantName;
    }
  }, [localParticipantName, callMode]);

  // Observe local element changes and normalize video elements (skip in audio mode)
  useEffect(() => {
    if (callMode === 'audio') {
      setLocalHasVideo(false); // In audio mode, no video
      return; // Skip normalization in audio mode to avoid duplicate avatars
    }
    
    const localElement = localRef.current;
    if (!localElement) return;

    // Remove any badges and overlays from local container
    const badges = localElement.querySelectorAll('.tile-signal-badge');
    badges.forEach(badge => badge.remove());
    const nameBadges = localElement.querySelectorAll('.tile-name-badge');
    nameBadges.forEach(badge => badge.remove());
    const overlays = localElement.querySelectorAll('.camera-off-overlay');
    overlays.forEach(overlay => overlay.remove());

    const participantName = localParticipantName || "You";
    const strength = signalStrength || 'good';

    let timeoutId: NodeJS.Timeout | null = null;

    const update = () => {
      // Make the local-video detector more tolerant during the mount window
      const publisherRoot = localElement.querySelector('.OT_publisher, [data-ot="publisher"]') as HTMLElement | null;
      const videoEl = localElement.querySelector('video') as HTMLVideoElement | null;

      // Consider video present if OT has mounted a publisher OR any <video> exists.
      // Do not rely on srcObject/readyState for the local tile.
      const hasVideo = callMode === 'video' && (!!publisherRoot || !!videoEl);

      setLocalHasVideo(hasVideo);

      if (hasVideo) {
        // Remove badges before normalizing
        const badges = localElement.querySelectorAll('.tile-signal-badge');
        badges.forEach(badge => badge.remove());
        const nameBadges = localElement.querySelectorAll('.tile-name-badge');
        nameBadges.forEach(badge => badge.remove());
        // Keep normalization (no overlays for local)
        normalizeVideoElements(localElement, {
          strength: signalStrength || 'good',
          names: [participantName],
          skipOverlays: true,
        });
      }
      // REMOVED: Do not delete video elements during transient switch
      // Just set localHasVideo and let the publisher element live
      // UI already covers the "camera off" case visually
    };

    // Debounced update to avoid excessive calls
    const debouncedUpdate = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(update, 100);
    };

    update(); // Initial update immediately
    
    // Recompute once shortly after switching to video mode to catch publisher mounting
    setTimeout(update, 250);

    const observer = new MutationObserver(debouncedUpdate);
    observer.observe(localElement, { childList: true, subtree: true });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [localParticipantName, signalStrength, callMode]);

  // Note: Participant video registration is now handled by the hook
  // when streams are created/destroyed, so we don't need to do it here

  const handleToggleFullscreen = useCallback(async () => {
    const panel = panelRef.current;
    if (!panel) return;

    try {
      if (document.fullscreenElement === panel) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } else if (!document.fullscreenElement) {
        await panel.requestFullscreen?.();
      }
    } catch (error) {

    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setHasUserPositioned(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !panelRef.current) return;
    
    e.preventDefault();
    
    const panelRect = panelRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - panelRect.left - dragOffset.x;
    const newY = clientY - panelRect.top - dragOffset.y;
    
    // Fixed camera dimensions
    const cameraWidth = 160;
    const cameraHeight = 90;
    
    // Constrain to panel bounds with proper margins
    const margin = 8;
    const maxX = panelRect.width - cameraWidth - margin;
    const maxY = panelRect.height - cameraHeight - margin;
    
    setCameraPosition({
      x: Math.max(margin, Math.min(newX, maxX)),
      y: Math.max(margin, Math.min(newY, maxY)),
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset camera position to default
  const resetCameraPosition = useCallback(() => {
    setCameraPosition({ x: 0, y: 0 });
    setHasUserPositioned(false);
  }, []);

  // Ensure camera stays visible when toggling fullscreen
  useEffect(() => {
    if (hasUserPositioned && panelRef.current) {
      const panelRect = panelRef.current.getBoundingClientRect();
      const margin = 8;
      const cameraWidth = 160;
      const cameraHeight = 90;
      
      const maxX = panelRect.width - cameraWidth - margin;
      const maxY = panelRect.height - cameraHeight - margin;
      
      setCameraPosition(prev => ({
        x: Math.max(margin, Math.min(prev.x, maxX)),
        y: Math.max(margin, Math.min(prev.y, maxY)),
      }));
    }
  }, [isFullscreen, hasUserPositioned]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleMouseMove);
        document.removeEventListener('touchend', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const participantCount = participants.length;
  const participantLabel = `${participantCount} ${participantCount === 1 ? "participant" : "participants"}`;
  const providerFirstName = providerName.split(" ")[0] ?? providerName;
  // Since participants don't have names in the new structure, we'll use connectionId for identification
  const remoteNames = participants
    .filter(p => !p.isLocal)
    .map(p => `Participant ${p.connectionId.slice(-4)}`);
  const hasLocalParticipant = participants.some((participant) => participant.isLocal);
  const remoteParticipantCount = Math.max(1, participantCount - (hasLocalParticipant ? 1 : 0));
  const tileCount = Math.max(1, remoteTileCount || remoteParticipantCount);
  // Meet/Zoom-like tiling: near-square grid using sqrt
  const calcColumns = (n: number) => {
    if (n <= 1) return 1;
    const cols = Math.ceil(Math.sqrt(n));
    return Math.min(cols, 3);
  };
  const isMobileOrTablet = viewportWidth < 1024; // < lg
  const remoteColumnCount = isMobileOrTablet && tileCount === 2 ? 1 : calcColumns(tileCount);
  const remoteLayoutClass =
    tileCount > 1 ? "grid gap-2 sm:gap-3 p-0 sm:p-4 items-stretch content-start" : "flex items-center justify-center";
  const remoteGridStyle: CSSProperties | undefined = (
    tileCount > 1
      ? {
          gridTemplateColumns: `repeat(${remoteColumnCount}, minmax(0, 1fr))`,
          justifyItems: "stretch",
          alignItems: "stretch",
          // For mobile with 2 users, use half height for each video
          gridAutoRows: isMobileOrTablet && tileCount === 2 ? "50vh" : "1fr",
        }
      : undefined
  );
  const panelClasses = cn(
    "relative overflow-hidden bg-slate-800",
    isFullscreen ? "h-[100svh] max-h-[100svh] w-full rounded-none" : "h-full rounded-none sm:rounded-none sm:shadow-none",
  );
  const remoteContainerClasses = cn(
    "relative w-full bg-slate-800 overflow-hidden h-full min-h-0",
    // Remove top padding on mobile for better space utilization
    isMobileOrTablet ? "pt-2" : "pt-8 sm:pt-10",
    remoteLayoutClass,
  );
  const localPreviewClasses = cn(
    "relative overflow-hidden rounded-2xl border border-white/20 bg-transparent shadow-lg",
    // Smaller camera preview on mobile for better space utilization
    isMobileOrTablet 
      ? (isFullscreen ? "h-24 w-32" : "h-20 w-28")
      : (isFullscreen ? "h-36 w-48 sm:h-40 sm:w-56" : "h-28 w-40 sm:h-32 sm:w-44"),
  );
  const overlayControlsClasses = cn(
    "pointer-events-none absolute inset-x-0 flex justify-center z-50",
    // Better positioning on mobile
    isMobileOrTablet ? "bottom-3" : "bottom-5",
    isFullscreen && "bottom-10",
  );
  const fullscreenToggleClasses = cn(
    "pointer-events-none absolute flex gap-2 z-50",
    // Better positioning on mobile
    isMobileOrTablet ? "top-3 right-3" : "top-12 right-3 sm:top-14",
    isFullscreen && "top-6 right-6",
  );

  // Note: normalizeVideoElements is now called via MutationObserver to avoid duplicate work
  // Only normalize when dependencies actually change (signal strength, names)
  useEffect(() => {
    const remoteElement = remoteRef.current;
    if (!remoteElement) return;
    
    // Derive remote names from participants
    const remoteNamesList = participants
      .filter(p => !p.isLocal)
      .map(p => `Participant ${p.connectionId.slice(-4)}`);
    
    // Only update if there are videos already present
    const videos = remoteElement.querySelectorAll("video");
    if (videos.length > 0) {
      normalizeVideoElements(remoteElement, { strength: signalStrength, names: remoteNamesList });
    }
  }, [signalStrength, participants]);

  // Compute "do we have a local publisher/video?" from the localRef, not document.querySelector
  // Only check the actual local container DOM - do not rely on participant props or state
  const localEl = localRef.current;
  const hasPublisherRoot = !!localEl?.querySelector('.OT_publisher, [data-ot="publisher"]');
  const hasAnyVideoEl = !!localEl?.querySelector('video');
  
  // "we should show live preview" if we're in video mode and have publisher/video in the container
  const localPreviewActive = callMode === 'video' && (hasPublisherRoot || hasAnyVideoEl);

  // Debug logging with local tile audit
  if (process.env.NODE_ENV === 'development') {
    const localTileAudit = {
      mode: callMode,
      hasPub: !!document.querySelector('#vonage-local-container .OT_publisher'),
      hasSub: !!document.querySelector('#vonage-local-container .OT_subscriber'),
      hasVid: !!document.querySelector('#vonage-local-container video'),
    };
    
    console.log('localPreviewActive', {
      callMode,
      hasVideo: localHasVideo,
      publisherRoot: hasPublisherRoot,
      videoEl: hasAnyVideoEl,
      localPreviewActive,
    });
    
    console.log('local tile audit', localTileAudit);
  }

  return (
    <div ref={panelRef} className={cn(panelClasses, "h-full")}>
        
        <div
          ref={remoteRef}
          id="vonage-remote-container"
          className={remoteContainerClasses}
          style={remoteGridStyle}
          data-tiled={tileCount > 1 ? "true" : "false"}
          aria-label="Remote video stream"
        />

        {/* Header overlay */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-10 flex items-center justify-start">
          <div className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white shadow-sm max-w-[70%] truncate">
            {sessionTitle}
          </div>
        </div>

        {/* Doctor name at bottom left - only show if name exists */}
        {providerName && providerName.trim() && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-10">
            <div className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white shadow-sm">
              {providerName}
            </div>
          </div>
        )}

        {!remoteHasVideo ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-slate-200">
            <div className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100">
              {callMode === 'audio' ? 'Waiting for audio' : 'Waiting for video'}
            </div>
            <p className="text-sm text-slate-200/80">
              {statusMessage ?? (callMode === 'audio' 
                ? `Audio will connect automatically once ${providerFirstName} joins.` 
                : `Video will appear automatically once ${providerFirstName}'s camera connects.`)}
            </p>
          </div>
        ) : null}

        {/* Local video preview - Show clean avatar when in audio mode */}
        {callMode === 'audio' ? (
          <div 
            className={cn(
              "absolute flex flex-col items-end gap-2 z-20",
              // Mobile: top-left positioning, Desktop: bottom-right positioning
              isMobileOrTablet ? "top-3 left-3" : (isFullscreen ? "bottom-6 right-6" : "top-5 left-5 sm:top-auto sm:left-auto sm:bottom-5 sm:right-5")
            )}
          >
            <div className={cn(localPreviewClasses, "relative border border-white/20 bg-transparent flex items-center justify-center overflow-hidden")}>
              {/* Clean avatar display - just avatar and name */}
              <div className="flex flex-col items-center justify-center gap-1.5 px-2">
                {/* Profile Avatar with Initials */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg font-semibold flex-shrink-0">
                  {localParticipantName && localParticipantName !== "You" ? (() => {
                    const words = localParticipantName.trim().split(/\s+/);
                    const initials = words.length >= 2 
                      ? (words[0][0] + words[1][0]).toUpperCase()
                      : localParticipantName.substring(0, 2).toUpperCase();
                    return <span className="text-lg">{initials}</span>;
                  })() : <User className="w-7 h-7" />}
                </div>
                <span className="text-[10px] text-slate-300 font-medium truncate max-w-[80px]">{localParticipantName || "You"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className={cn(
              "absolute flex flex-col items-end gap-2 cursor-move select-none transition-all duration-75 ease-out focus:outline-none focus:ring-0 z-20",
              // Mobile: top-left positioning, Desktop: bottom-right positioning
              hasUserPositioned ? "" : (isMobileOrTablet ? "top-3 left-3" : (isFullscreen ? "bottom-6 right-6" : "top-5 left-5 sm:top-auto sm:left-auto sm:bottom-5 sm:right-5")),
              isDragging && "cursor-grabbing scale-105 transition-none"
            )}
            style={hasUserPositioned ? {
              left: `${cameraPosition.x}px`,
              top: `${cameraPosition.y}px`,
              right: 'auto',
              bottom: 'auto',
            } : {}}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onDoubleClick={resetCameraPosition}
            title="Drag to move camera • Double-click to reset position"
          >
            <div className={cn(localPreviewClasses, "relative border border-gray-200 focus:border-primary focus:ring-0 focus:outline-none")}>
              <div
                id="vonage-local-container"
                data-role="local"
                ref={localRef}
                className="h-full w-full bg-transparent relative"
                style={{ backgroundColor: 'transparent' }}
                aria-label="Your video preview"
              >
                {/* Guaranteed local avatar for audio mode (and as fallback if video is absent) */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: ((callMode === 'audio' as any) || !localHasVideo) ? 'flex' : 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#000',
                    zIndex: 10,
                    pointerEvents: 'none',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 20,
                      letterSpacing: 0.5,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                  >
                    {localParticipantName && localParticipantName !== "You" ? (() => {
                      const words = (localParticipantName || 'You').trim().split(/\s+/).slice(0, 2);
                      const initials = words.map(w => w[0] || '').join('').toUpperCase();
                      return initials || 'U';
                    })() : <User className="w-7 h-7" />}
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>Audio Call</span>
                </div>
              </div>
              {!localPreviewActive && (callMode !== 'audio' as any) && callMode !== null ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-xs text-slate-100 bg-black">
                  {/* Profile Avatar with Initials */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg font-semibold">
                    {localParticipantName && localParticipantName !== "You" ? (() => {
                      const words = localParticipantName.trim().split(/\s+/);
                      const initials = words.length >= 2 
                        ? (words[0][0] + words[1][0]).toUpperCase()
                        : localParticipantName.substring(0, 2).toUpperCase();
                      return <span className="text-base">{initials}</span>;
                    })() : <User className="w-6 h-6" />}
                  </div>
                  <span className="text-xs text-slate-200 font-medium">{localParticipantName}</span>
                  <span className="text-xs text-slate-400">Camera off</span>
                </div>
              ) : null}

              {/* Drag handle */}
              <div className="absolute top-1 right-1 pointer-events-none">
                <GripVertical className="h-3 w-3 text-white/60" />
              </div>
              {/* Reset indicator */}
              {hasUserPositioned && (
                <div className="absolute top-1 left-1 pointer-events-none">
                  <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" title="Custom position" />
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Audio-only indicator when in audio mode */}
        {callMode === 'audio' && (
          <div className="absolute bottom-6 right-6 z-20">
            <div className="rounded-full bg-black/60 px-4 py-2 flex items-center gap-2 text-white shadow-lg">
              <Phone className="h-5 w-5" />
              <span className="text-sm font-medium">Audio Call</span>
            </div>
          </div>
        )}

        <div className={fullscreenToggleClasses}>
          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/80"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>

        {overlayControls ? (
          <div className={overlayControlsClasses} style={{ visibility: 'visible', opacity: 1 }}>
            <div className="pointer-events-auto rounded-full border-white/20 
             px-3 py-3">{overlayControls}</div>
          </div>
        ) : null}

        {/* PiP nudge banner removed - PiP button works directly */}

        {/* PiP Follow Speaker indicator - always active */}
        {localIsPictureInPicture && (
          <div className="absolute top-4 right-4 bg-blue-500/80 text-white rounded-full px-3 py-1 flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">
              {/* {activeSpeakerId ? `Following ${activeSpeakerId.slice(-4)}` : 'Following Speaker'} */}
            </span>
          </div>
        )}

        {/* Active Speaker indicator (when not in PiP) */}
        {activeSpeakerId && !localIsPictureInPicture && (
          <div className="absolute top-4 left-4 bg-green-500/80 text-white rounded-full px-3 py-1 flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            {/* <span className="text-xs font-medium">Speaking: {activeSpeakerId.slice(-4)}</span> */}
          </div>
        )}
    </div>
  );
}