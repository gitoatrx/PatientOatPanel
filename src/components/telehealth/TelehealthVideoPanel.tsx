"use client";

import { CSSProperties, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface TelehealthVideoPanelProps {
  sessionTitle: string;
  providerName: string;
  participants: Array<{ name: string; role: string }>;
  localParticipantName?: string;
  statusMessage?: string;
  onRemoteContainerReady?: (element: HTMLDivElement | null) => void;
  onLocalContainerReady?: (element: HTMLDivElement | null) => void;
  overlayControls?: ReactNode;
}

const normalizeVideoElements = (container: HTMLDivElement | null) => {
  if (!container) return;

  const isTiled = container.dataset.tiled === "true";
  const videos = container.querySelectorAll("video");
  videos.forEach((video) => {
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
      wrapper.style.backgroundColor = "#1e293b";
      wrapper.style.minHeight = "0";
      wrapper.style.width = "100%";
      wrapper.style.height = "100%";
      wrapper.style.maxWidth = "100%";
      wrapper.style.maxHeight = "100%";
      wrapper.style.aspectRatio = isTiled ? "16 / 9" : "";
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
}: TelehealthVideoPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const remoteRef = useRef<HTMLDivElement | null>(null);
  const localRef = useRef<HTMLDivElement | null>(null);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [localHasVideo, setLocalHasVideo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasUserPositioned, setHasUserPositioned] = useState(false);

  useEffect(() => {
    onRemoteContainerReady?.(remoteRef.current);
    return () => onRemoteContainerReady?.(null);
  }, [onRemoteContainerReady]);

  useEffect(() => {
    onLocalContainerReady?.(localRef.current);
    return () => onLocalContainerReady?.(null);
  }, [onLocalContainerReady]);

  useEffect(() => {
    const remoteElement = remoteRef.current;
    if (!remoteElement) return;

    const update = () => {
      const hasVideo = remoteElement.querySelector("video") !== null;
      setRemoteHasVideo(hasVideo);
      if (hasVideo) {
        normalizeVideoElements(remoteElement);
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
        normalizeVideoElements(localElement);
      }
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(localElement, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

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
      console.warn('Unable to toggle fullscreen', error);
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setHasUserPositioned(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !panelRef.current) return;
    
    e.preventDefault();
    
    const panelRect = panelRef.current.getBoundingClientRect();
    const newX = e.clientX - panelRect.left - dragOffset.x;
    const newY = e.clientY - panelRect.top - dragOffset.y;
    
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
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const participantCount = participants.length;
  const participantLabel = `${participantCount} ${participantCount === 1 ? "participant" : "participants"}`;
  const providerFirstName = providerName.split(" ")[0] ?? providerName;
  const hasNamedLocalParticipant = participants.some((participant) => participant.name === localParticipantName);
  const remoteParticipantCount = Math.max(1, participantCount - (hasNamedLocalParticipant ? 1 : 0));
  const remoteColumnCount = (
    remoteParticipantCount <= 1 ? 1 : remoteParticipantCount === 2 ? 2 : remoteParticipantCount <= 4 ? 2 : 3
  );
  const remoteLayoutClass =
    remoteParticipantCount > 1 ? "grid gap-4 p-4 sm:p-6 place-items-center" : "flex items-center justify-center";
  const remoteGridStyle: CSSProperties | undefined = (
    remoteParticipantCount > 1
      ? {
          gridTemplateColumns: `repeat(${remoteColumnCount}, minmax(0, 1fr))`,
          gridAutoRows: "1fr",
          justifyItems: "center",
          alignItems: "stretch",
        }
      : undefined
  );
  const panelClasses = cn(
    "relative overflow-hidden shadow-lg",
    isFullscreen ? "h-[100svh] max-h-[100svh] w-full  rounded-none bg-slate-800 sm:rounded-none" : "rounded-3xl bg-slate-800",
  );
  const remoteContainerClasses = cn(
    "relative w-full bg-slate-800 overflow-hidden h-full",
    remoteLayoutClass,
  );
  const localPreviewClasses = cn(
    "relative overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-lg backdrop-blur",
    isFullscreen ? "h-36 w-48 sm:h-40 sm:w-56" : "h-28 w-40 sm:h-32 sm:w-44",
  );
  const overlayControlsClasses = cn(
    "pointer-events-none absolute inset-x-0 bottom-5 flex justify-center",
    isFullscreen && "bottom-10",
  );
  const fullscreenToggleClasses = cn(
    "pointer-events-none absolute top-3 right-3 flex gap-2",
    isFullscreen && "top-6 right-6",
  );

  useEffect(() => {
    normalizeVideoElements(remoteRef.current);
  }, [remoteParticipantCount, isFullscreen]);

  return (
    <div ref={panelRef} className={cn(panelClasses, "h-full")}>
        <div
          ref={remoteRef}
          id="vonage-remote-container"
          className={remoteContainerClasses}
          style={remoteGridStyle}
          data-tiled={remoteParticipantCount > 1 ? "true" : "false"}
          aria-label="Remote video stream"
        />

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
            "absolute flex flex-col items-end gap-2 cursor-move select-none transition-all duration-75 ease-out focus:outline-none focus:ring-0",
            isDragging && "cursor-grabbing scale-105 transition-none"
          )}
          style={{
            left: hasUserPositioned ? `${cameraPosition.x}px` : (isFullscreen ? '24px' : '20px'),
            top: hasUserPositioned ? `${cameraPosition.y}px` : (isFullscreen ? 'calc(100% - 114px)' : 'calc(100% - 110px)'),
            right: hasUserPositioned ? 'auto' : (isFullscreen ? '24px' : '20px'),
            bottom: hasUserPositioned ? 'auto' : (isFullscreen ? '24px' : '20px'),
          }}
          onMouseDown={handleMouseDown}
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
            <div className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
              {localParticipantName}
            </div>
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
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/80"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>

        {overlayControls ? (
          <div className={overlayControlsClasses}>
            <div className="pointer-events-auto">{overlayControls}</div>
          </div>
        ) : null}
    </div>
  );
}
