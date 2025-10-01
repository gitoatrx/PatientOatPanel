"use client";

import { CSSProperties, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, GripVertical, X } from "lucide-react";
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

const normalizeVideoElements = (
  container: HTMLDivElement | null,
  opts?: { strength?: TileStrength; names?: string[] }
) => {
  if (!container) return;

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
    if (wrapper) {
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.style.justifyContent = "center";
      wrapper.style.backgroundColor = "#111827";
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

      if (!wrapper.querySelector('.tile-signal-badge')) {
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
}: TelehealthVideoPanelProps) {
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

  // Simple follow-speaker effect
  useEffect(() => {
    if (!pipFollowsSpeaker || !activeSpeakerId) return;
    
    // If PiP is active and active speaker changes, swap the video
    if (document.pictureInPictureElement) {
      const speakerVideo = document.querySelector(`[data-connection-id="${activeSpeakerId}"] video`) as HTMLVideoElement;
      if (speakerVideo && speakerVideo.srcObject) {
        // Get the current PiP video element
        const pipVideo = document.pictureInPictureElement as HTMLVideoElement;
        if (pipVideo && pipVideo.srcObject !== speakerVideo.srcObject) {

          pipVideo.srcObject = speakerVideo.srcObject as MediaStream;
        }
      }
    }
  }, [pipFollowsSpeaker, activeSpeakerId]);

  // PiP control functions - COMMENTED OUT FOR SIMPLICITY
  /*
  const handleCurrentViewPiP = useCallback(() => {
    const v = pipRef.current;

    if (!v) {

      return;
    }

    // Check browser support first

    // ensure stream: remote -> fallback local (SYNCHRONOUS only)
    if (!v.srcObject) {

      const el = getVideoElementById?.(activeSpeakerId ?? '') as HTMLVideoElement | null;
      if (el?.srcObject) {
        v.srcObject = el.srcObject as MediaStream;

      }
      if (!v.srcObject) {
        const localEl = localRef.current?.querySelector('video') as HTMLVideoElement | null;
        if (localEl?.srcObject) {
          v.srcObject = localEl.srcObject as MediaStream;

        } else {

          return;
        }
      }
    } else {

    }

    // make the element "ready" (SYNCHRONOUS only)
    v.muted = true;            // avoid autoplay block
    v.playsInline = true;
    v.autoplay = true;

    // Check if video is ready for PiP
    if (v.readyState < 2) {

    }

    // Request PiP IMMEDIATELY - no awaits before this!
    try {

      const win = (v as any).requestPictureInPicture();

      // Use ref to track state without triggering re-render
      pipStateRef.current = true;
      
      // Update state in next tick to avoid render issues
      setTimeout(() => {
        setLocalIsPictureInPicture(true);
      }, 0);
      
    } catch (err: any) {

      pipStateRef.current = false;
    }
  }, [getVideoElementById, activeSpeakerId]);

  // Set up autopictureinpicture for the hidden PiP video
  useEffect(() => {
    if (pipRef.current) {

      pipRef.current.setAttribute('autopictureinpicture', '');
      // If supported, also set runtime flag:
      (pipRef.current as any).autoPictureInPicture = true;

    } else {

    }
  }, []);

  // Handle PiP toggle
  const handleTogglePictureInPicture = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setLocalIsPictureInPicture(false);
        return;
      }
      
      // Default to Follow Speaker mode
      if (enablePiPFollowSpeaker) {
        enablePiPFollowSpeaker();
        await handleCurrentViewPiP();
      }
    } catch (err) {

    }
  }, [enablePiPFollowSpeaker, handleCurrentViewPiP]);

  // Note: Registration system removed - PiP is now handled directly by parent

  // Swap PiP video stream when active speaker changes
  useEffect(() => {
    if (!pipFollowsSpeaker || !localIsPictureInPicture || !activeSpeakerId || !getVideoElementById) return;
    
    // Get the video element for the active speaker using the registry
    const activeSpeakerVideo = getVideoElementById(activeSpeakerId);
    
    if (activeSpeakerVideo && pipRef.current && activeSpeakerVideo.srcObject) {
      // Swap the stream without leaving PiP
      if (pipRef.current.srcObject !== activeSpeakerVideo.srcObject) {
        pipRef.current.srcObject = activeSpeakerVideo.srcObject as MediaStream;

        // Ensure it's playing
        pipRef.current.play().catch(() => {});
      }
    }
  }, [pipFollowsSpeaker, localIsPictureInPicture, activeSpeakerId, getVideoElementById]);
  */

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

  useEffect(() => {
    onLocalContainerReady?.(localRef.current);
    return () => onLocalContainerReady?.(null);
  }, [onLocalContainerReady]);

  useEffect(() => {
    const remoteElement = remoteRef.current;
    if (!remoteElement) return;

    const update = () => {
      const videos = remoteElement.querySelectorAll("video");
      const hasVideo = videos.length > 0;
      setRemoteHasVideo(hasVideo);
      setRemoteTileCount(videos.length);
      if (hasVideo) {
        normalizeVideoElements(remoteElement, { strength: signalStrength, names: remoteNames });
      }
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(remoteElement, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

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

  useEffect(() => {
    const localElement = localRef.current;
    if (!localElement) return;

    const update = () => {
      const hasVideo = localElement.querySelector("video") !== null;
      setLocalHasVideo(hasVideo);
      if (hasVideo) {
        // Do not add name badge here; we already render "You" label below
        normalizeVideoElements(localElement, { strength: signalStrength });
      }
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(localElement, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

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
    "relative overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-lg",
    // Smaller camera preview on mobile for better space utilization
    isMobileOrTablet 
      ? (isFullscreen ? "h-24 w-32" : "h-20 w-28")
      : (isFullscreen ? "h-36 w-48 sm:h-40 sm:w-56" : "h-28 w-40 sm:h-32 sm:w-44"),
  );
  const overlayControlsClasses = cn(
    "pointer-events-none absolute inset-x-0 flex justify-center",
    // Better positioning on mobile
    isMobileOrTablet ? "bottom-3" : "bottom-5",
    isFullscreen && "bottom-10",
  );
  const fullscreenToggleClasses = cn(
    "pointer-events-none absolute flex gap-2",
    // Better positioning on mobile
    isMobileOrTablet ? "top-3 right-3" : "top-12 right-3 sm:top-14",
    isFullscreen && "top-6 right-6",
  );

  useEffect(() => {
    normalizeVideoElements(remoteRef.current, { strength: signalStrength, names: remoteNames });
  }, [remoteParticipantCount, isFullscreen, signalStrength, remoteNames.join('|')]);

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
              Waiting for video
            </div>
            <p className="text-sm text-slate-200/80">
              {statusMessage ?? `Video will appear automatically once ${providerFirstName}'s camera connects.`}
            </p>
          </div>
        ) : null}

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
              ref={localRef}
              id="vonage-local-container"
              className="h-full w-full"
              aria-label="Your video preview"
            />
            {!localHasVideo ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center text-xs text-slate-100">
                <span>Your camera preview will appear here.</span>
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
          <div className={overlayControlsClasses}>
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
