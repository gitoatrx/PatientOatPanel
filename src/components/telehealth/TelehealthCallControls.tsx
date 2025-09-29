"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Settings, RefreshCcw, MessageCircle, RotateCcw, PictureInPicture } from "lucide-react";
import { SignalStrengthIndicator } from "./SignalStrengthIndicator";
import { AudioLevelIndicator } from "./AudioLevelIndicator";
import { MicrophoneSelector } from "./MicrophoneSelector";

interface TelehealthCallControlsProps {
  isConnected?: boolean;
  isBusy?: boolean;
  isMicMuted?: boolean;
  isCameraOff?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onOpenDeviceSettings?: () => void;
  onSwitchMicrophone?: (deviceId: string) => void;
  onSwitchCamera?: () => void;
  variant?: "panel" | "overlay";
  // Signal strength and audio device props
  signalStrength?: 'excellent' | 'good' | 'fair' | 'poor';
  audioLevel?: number;
  audioDevices?: Array<{ deviceId?: string; label?: string }>;
  currentAudioDevice?: string | null;
  // Video device props
  videoDevices?: Array<{ deviceId?: string }>;
  currentVideoDevice?: string | null;
  // Chat button controls
  showChatButton?: boolean;
  isChatOpen?: boolean;
  chatUnreadCount?: number;
  onToggleChat?: () => void;
  // Picture-in-Picture controls
  onTogglePictureInPicture?: () => void;
  isPictureInPicture?: boolean;
  pendingPiPRequest?: boolean;
}

export function TelehealthCallControls({
  isConnected = false,
  isBusy = false,
  isMicMuted: micMutedProp,
  isCameraOff: cameraOffProp,
  onJoin,
  onLeave,
  onToggleMic,
  onToggleCamera,
  onOpenDeviceSettings,
  onSwitchMicrophone,
  onSwitchCamera,
  variant = "panel",
  signalStrength = 'good',
  audioLevel = 0,
  audioDevices = [],
  currentAudioDevice = null,
  videoDevices = [],
  currentVideoDevice = null,
  showChatButton = false,
  isChatOpen = false,
  chatUnreadCount = 0,
  onToggleChat,
  onTogglePictureInPicture,
  isPictureInPicture = false,
  pendingPiPRequest = false,
}: TelehealthCallControlsProps) {
  const [micMuted, setMicMuted] = useState(micMutedProp ?? false);
  const [cameraOff, setCameraOff] = useState(cameraOffProp ?? false);

  useEffect(() => {
    if (micMutedProp !== undefined) {
      setMicMuted(micMutedProp);
    }
  }, [micMutedProp]);

  useEffect(() => {
    if (cameraOffProp !== undefined) {
      setCameraOff(cameraOffProp);
    }
  }, [cameraOffProp]);

  const handleToggleMic = () => {
    if (micMutedProp === undefined) {
      setMicMuted((prev) => !prev);
    }
    onToggleMic?.();
  };

  const handleToggleCamera = () => {
    if (cameraOffProp === undefined) {
      setCameraOff((prev) => !prev);
    }
    onToggleCamera?.();
  };

  const micIsMuted = micMutedProp ?? micMuted;
  const cameraIsOff = cameraOffProp ?? cameraOff;
  const isOverlay = variant === "overlay";
  const joinLabel = isConnected ? "Leave" : isBusy ? "Connecting..." : "Join";
  const joinDisabled = !isConnected && isBusy;
  const controlsDisabled = !isConnected || isBusy;
  const deviceSwitchDisabled = controlsDisabled || !onOpenDeviceSettings;

  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside settings menu and keyboard events
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showSettings]);

  return (
    <div className="space-y-3 relative">
      {/* Signal Strength, Audio Level and Microphone Selector (panel view) */}
      {isConnected && !isOverlay && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-4">
            <SignalStrengthIndicator
              strength={signalStrength}
            />
            <AudioLevelIndicator
              level={audioLevel}
              showPercentage={true}
            />
          </div>
          <MicrophoneSelector
            audioDevices={audioDevices}
            currentDevice={currentAudioDevice}
            onDeviceChange={onSwitchMicrophone || (() => {})}
            disabled={controlsDisabled}
          />
        </div>
      )}

      {/* Main Controls */}
      <section
        className={cn(
          "flex items-center gap-2",
          isOverlay
            ? "justify-center bg-black/40 backdrop-blur-md rounded-xl px-3 py-2"
            : "justify-center sm:justify-start rounded-3xl bg-white p-4 shadow-sm flex-wrap gap-3",
        )}
      >
        {showChatButton && (
          <div className="block lg:hidden order-1">
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "h-12 rounded-full px-4 text-base relative",
                isOverlay && "h-12 w-12 px-0 text-white hover:bg-white/20 bg-black/30",
                isChatOpen && !isOverlay && "bg-white text-black"
              )}
              onClick={onToggleChat}
              aria-label={isChatOpen ? "Close chat" : "Open chat"}
            >
              <MessageCircle className="h-5 w-5" />
              {!isOverlay && <span className="ml-2">Chat</span>}
              {!isChatOpen && chatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                  {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Microphone */}
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "order-1 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200",
            isOverlay && !micIsMuted && "h-12 w-12 px-0 rounded-full text-white hover:bg-white/20 bg-black/30",
            isOverlay && micIsMuted && "h-12 w-12 px-0 rounded-full text-white hover:bg-red-700 bg-red-600",
            micIsMuted && !isOverlay && "bg-red-600 hover:bg-red-700 text-white",
            !micIsMuted && !isOverlay && "bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white"
          )}
          onClick={handleToggleMic}
          aria-label={micIsMuted ? "Unmute microphone" : "Mute microphone"}
          disabled={controlsDisabled}
        >
          {micIsMuted ? <MicOff className={cn(isOverlay ? "h-8 w-8" : "h-7 w-7")} /> : <Mic className={cn(isOverlay ? "h-8 w-8" : "h-7 w-7")} />}
          {!isOverlay && <span className="ml-2">{micIsMuted ? "Unmute" : "Mute"}</span>}
        </Button>
  {/* Settings gear */}
  <div className="order-3 relative" ref={settingsRef}>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200",
              isOverlay && "h-12 w-12 px-0 rounded-full text-white hover:bg-white/20 bg-black/30",
              !isOverlay && "bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white"
            )}
            onClick={() => setShowSettings((v) => !v)}
            aria-label="Settings"
            disabled={controlsDisabled}
          >
            <Settings className={cn(isOverlay ? "h-8 w-8" : "h-7 w-7")} />
            {!isOverlay && <span className="ml-2">Settings</span>}
          </Button>

          {isOverlay && showSettings && (
            <>
              {/* Settings Menu */}
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30 w-[90vw] max-w-[320px] rounded-xl bg-slate-900/95 text-white shadow-2xl border border-white/10 p-2 backdrop-blur">
                <div className="px-3 py-2 text-[11px] font-semibold tracking-wide text-white/70 text-center">MICROPHONE</div>
                <div className="max-h-60 overflow-auto">
                  {audioDevices.map((device) => (
                    <button
                      key={device.deviceId}
                      onClick={() => { onSwitchMicrophone?.(device.deviceId || ""); setShowSettings(false); }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-3 text-sm rounded-md hover:bg-white/10 transition-colors",
                        (device.deviceId === currentAudioDevice) && "bg-white/5"
                      )}
                    >
                      <span className="truncate pr-2 text-left">{device.label || `Microphone ${device.deviceId?.slice(-4)}`}</span>
                      {device.deviceId === currentAudioDevice && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </button>
                  ))}
                  {audioDevices.length === 0 && (
                    <div className="px-3 py-3 text-sm text-white/70 text-center">No microphones found</div>
                  )}
                </div>
              </div>
              
              {/* Backdrop to close settings menu */}
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowSettings(false)}
              />
            </>
          )}
        </div>
        {/* Camera */}
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "order-2 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200",
            isOverlay && !cameraIsOff && "h-12 w-12 px-0 rounded-full text-white hover:bg-white/20 bg-black/30",
            isOverlay && cameraIsOff && "h-12 w-12 px-0 rounded-full text-white hover:bg-red-700 bg-red-600",
            cameraIsOff && !isOverlay && "bg-red-600 hover:bg-red-700 text-white",
            !cameraIsOff && !isOverlay && "bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white"
          )}
          onClick={handleToggleCamera}
          aria-label={cameraIsOff ? "Start video" : "Stop video"}
          disabled={controlsDisabled}
        >
          {cameraIsOff ? <VideoOff className={cn(isOverlay ? "h-8 w-8" : "h-7 w-7")} /> : <Video className={cn(isOverlay ? "h-8 w-8" : "h-7 w-7")} />}
          {!isOverlay && <span className="ml-2">{cameraIsOff ? "Start video" : "Stop video"}</span>}
        </Button>

        {/* Camera Swap - Only show when multiple cameras available */}
        {videoDevices.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "order-2.5 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200",
              isOverlay && "h-12 w-12 px-0 rounded-full text-white hover:bg-white/20 bg-black/30",
              !isOverlay && "bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white"
            )}
            onClick={onSwitchCamera}
            aria-label="Switch camera"
            disabled={controlsDisabled}
          >
            <RotateCcw className={cn(isOverlay ? "h-8 w-8" : "h-7 w-7")} />
            {!isOverlay && <span className="ml-2">Switch</span>}
          </Button>
        )}

      
      
        {/* Join/Leave */}
        <Button
          type="button"
          className={cn(
            "order-4 h-12 w-12 rounded-full p-0 text-base font-semibold",
            isConnected
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-emerald-600 text-white hover:bg-emerald-700",
            isOverlay && "shadow-lg",
          )}
          onClick={isConnected ? onLeave : onJoin}
          aria-label={joinLabel}
          disabled={joinDisabled}
        >
          {isConnected ? <PhoneOff className={cn(isOverlay ? "h-8 w-8" : "h-7 w-7")} /> : <Phone className={cn(isOverlay ? "h-8 w-8" : "h-7 w-7")} />}
        </Button>

        {/* Picture-in-Picture Button - Always show if handler exists */}
        {onTogglePictureInPicture && (
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 relative",
              isOverlay && "text-white hover:bg-white/20 bg-black/30",
              !isOverlay && document.pictureInPictureEnabled 
                ? pendingPiPRequest && !isPictureInPicture
                  ? "bg-orange-600 hover:bg-orange-500 text-white animate-pulse"
                  : isPictureInPicture
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white"
                : "opacity-50 cursor-not-allowed bg-gray-700 text-gray-200"
            )}
            onClick={(e) => {
              console.log('🎬 PiP Button clicked!', e.target, e.currentTarget);
              console.log('🎬 PiP Button click event:', e);
              console.log('🎬 PiP Button click coordinates:', e.clientX, e.clientY);
              console.log('🎬 PiP Button element bounds:', e.currentTarget.getBoundingClientRect());
              if (document.pictureInPictureEnabled) {
                onTogglePictureInPicture?.();
              } else {
                console.warn('❌ PiP not supported in this browser');
              }
            }}
            aria-label={isPictureInPicture ? 'Exit Picture-in-Picture' : pendingPiPRequest ? 'Click to activate Picture-in-Picture' : 'Enter Picture-in-Picture'}
            disabled={isBusy || !document.pictureInPictureEnabled}
            title={document.pictureInPictureEnabled 
              ? (isPictureInPicture 
                  ? 'Exit Picture-in-Picture' 
                  : pendingPiPRequest 
                    ? 'Click to activate Picture-in-Picture (pending request)'
                    : 'Enter Picture-in-Picture')
              : 'Picture-in-Picture not supported in this browser'
            }
          >
            <PictureInPicture className="h-7 w-7" />
            {pendingPiPRequest && !isPictureInPicture && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full animate-ping" />
            )}
            {/* <span className="ml-2 hidden sm:inline">
              {isPictureInPicture ? 'Exit PiP' : 'PiP'}
            </span> */}
          </Button>
        )}

        {/* Optional switch camera icon (panel view retains it) */}
        {!isOverlay && (
          <Button
            type="button"
            variant="outline"
            className="h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white"
            onClick={() => onOpenDeviceSettings?.()}
            aria-label="Switch camera"
            disabled={deviceSwitchDisabled}
          >
            <RefreshCcw className="h-7 w-7" />
            <span className="ml-2">Switch</span>
          </Button>
        )}
      </section>
    </div>
  );
}