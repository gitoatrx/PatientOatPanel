"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Settings, RefreshCcw, MessageCircle } from "lucide-react";
import { SignalStrengthIndicator } from "./SignalStrengthIndicator";
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
  variant?: "panel" | "overlay";
  // Signal strength and audio device props
  signalStrength?: 'excellent' | 'good' | 'fair' | 'poor';
  audioLevel?: number;
  audioDevices?: Array<{ deviceId?: string; label?: string }>;
  currentAudioDevice?: string | null;
  // Chat button controls
  showChatButton?: boolean;
  isChatOpen?: boolean;
  chatUnreadCount?: number;
  onToggleChat?: () => void;
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
  variant = "panel",
  signalStrength = 'good',
  audioLevel = 0,
  audioDevices = [],
  currentAudioDevice = null,
  showChatButton = false,
  isChatOpen = false,
  chatUnreadCount = 0,
  onToggleChat,
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

  return (
    <div className="space-y-3 relative">
      {/* Signal Strength and Microphone Selector (panel view) */}
      {isConnected && !isOverlay && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <SignalStrengthIndicator
            strength={signalStrength}
            audioLevel={audioLevel}
          />
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
            "order-1 h-12 rounded-full px-4 text-base",
            isOverlay && "h-12 w-12 px-0 rounded-full text-white hover:bg-white/20 bg-black/30",
            micIsMuted && !isOverlay && "bg-red-500 hover:bg-red-600 text-white ",
            !micIsMuted && !isOverlay && "bg-green-500 hover:bg-green-600 text-white ",
              isOverlay && micIsMuted && "bg-red-500/20"
          )}
          onClick={handleToggleMic}
          aria-label={micIsMuted ? "Unmute microphone" : "Mute microphone"}
          disabled={controlsDisabled}
        >
          {micIsMuted ? <MicOff className={cn(isOverlay ? "h-6 w-6" : "h-5 w-5")} /> : <Mic className={cn(isOverlay ? "h-6 w-6" : "h-5 w-5")} />}
          {!isOverlay && <span className="ml-2">{micIsMuted ? "Unmute" : "Mute"}</span>}
        </Button>
  {/* Settings gear */}
  <div className="order-3 relative">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-12 rounded-full px-4 text-base",
              isOverlay && "h-12 w-12 px-0 rounded-full text-white hover:bg-white/20 bg-black/30",
            )}
            onClick={() => setShowSettings((v) => !v)}
            aria-label="Settings"
            disabled={controlsDisabled}
          >
            <Settings className={cn(isOverlay ? "h-6 w-6" : "h-5 w-5")} />
            {!isOverlay && <span className="ml-2">Settings</span>}
          </Button>

          {isOverlay && showSettings && (
            <div className="absolute bottom-16 right-0 z-30 w-[88vw] max-w-[360px] rounded-xl bg-slate-900/95 text-white shadow-2xl border border-white/10 p-2 backdrop-blur">
              <div className="px-3 py-2 text-[11px] font-semibold tracking-wide text-white/70">MICROPHONE</div>
              <div className="max-h-60 overflow-auto">
                {audioDevices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => { onSwitchMicrophone?.(device.deviceId || ""); setShowSettings(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-white/10",
                      (device.deviceId === currentAudioDevice) && "bg-white/5"
                    )}
                  >
                    <span className="truncate pr-2">{device.label || `Microphone ${device.deviceId?.slice(-4)}`}</span>
                    {device.deviceId === currentAudioDevice && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </button>
                ))}
                {audioDevices.length === 0 && (
                  <div className="px-3 py-3 text-sm text-white/70">No microphones found</div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Camera */}
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "order-2 h-12 rounded-full px-4 text-base",
            isOverlay && "h-12 w-12 px-0 rounded-full text-white hover:bg-white/20 bg-black/30",
            cameraIsOff && !isOverlay && "bg-red-500 hover:bg-red-600 text-white ",
            !cameraIsOff && !isOverlay && "bg-green-500 hover:bg-green-600 text-white ",
              isOverlay && cameraIsOff && "bg-red-500/20"
          )}
          onClick={handleToggleCamera}
          aria-label={cameraIsOff ? "Start video" : "Stop video"}
          disabled={controlsDisabled}
        >
          {cameraIsOff ? <VideoOff className={cn(isOverlay ? "h-6 w-6" : "h-5 w-5")} /> : <Video className={cn(isOverlay ? "h-6 w-6" : "h-5 w-5")} />}
          {!isOverlay && <span className="ml-2">{cameraIsOff ? "Start video" : "Stop video"}</span>}
        </Button>

      
      
        {/* Join/Leave */}
        <Button
          type="button"
          className={cn(
            "order-4 h-12 rounded-full px-5 text-base font-semibold",
            isConnected
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-emerald-500 text-white hover:bg-emerald-600",
            isOverlay && "h-12 px-5 rounded-full shadow-lg",
          )}
          onClick={isConnected ? onLeave : onJoin}
          aria-label={joinLabel}
          disabled={joinDisabled}
        >
          {isConnected ? <PhoneOff className={cn(isOverlay ? "h-6 w-6" : "h-5 w-5")} /> : <Phone className={cn(isOverlay ? "h-6 w-6" : "h-5 w-5")} />}
          <span className="ml-2 hidden sm:inline">{joinLabel}</span>
        </Button>


        {/* Optional switch camera icon (panel view retains it) */}
        {!isOverlay && (
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-full px-4 text-base"
            onClick={() => onOpenDeviceSettings?.()}
            aria-label="Switch camera"
            disabled={deviceSwitchDisabled}
          >
            <RefreshCcw className="h-5 w-5" />
            <span className="ml-2">Switch</span>
          </Button>
        )}
      </section>
    </div>
  );
}
