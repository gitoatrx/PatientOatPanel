"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, RefreshCcw } from "lucide-react";

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
  variant?: "panel" | "overlay";
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
  variant = "panel",
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
  const joinLabel = isConnected ? "Leave call" : isBusy ? "Connecting..." : "Join call";
  const joinDisabled = !isConnected && isBusy;
  const controlsDisabled = !isConnected || isBusy;
  const deviceSwitchDisabled = controlsDisabled || !onOpenDeviceSettings;

  return (
    <section
      className={cn(
        "flex flex-wrap items-center gap-3",
        isOverlay
          ? "justify-center gap-4"
          : "justify-center sm:justify-start rounded-3xl bg-white p-4 shadow-sm",
      )}
    >
      <Button
        type="button"
        className={cn(
          "h-12 rounded-full px-5 text-base font-semibold",
          isConnected
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-emerald-500 text-white hover:bg-emerald-600",
          isOverlay && "h-14 w-14 px-0",
        )}
        onClick={isConnected ? onLeave : onJoin}
        aria-label={joinLabel}
        disabled={joinDisabled}
      >
        {isConnected ? <PhoneOff className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
        {isOverlay ? <span className="sr-only">{joinLabel}</span> : <span>{joinLabel}</span>}
      </Button>

      <Button
        type="button"
        variant={isOverlay ? "ghost" : "outline"}
        className={cn(
          "h-12 rounded-full px-4 text-base",
          isOverlay && "h-14 w-14 px-0 text-white bg-black/50 hover:bg-black/70",
          micIsMuted && "bg-red-500 hover:bg-red-600 text-white border-red-500",
          !micIsMuted && !isOverlay && "bg-green-500 hover:bg-green-600 text-white border-green-500",
        )}
        onClick={handleToggleMic}
        aria-label={micIsMuted ? "Unmute microphone" : "Mute microphone"}
        disabled={controlsDisabled}
      >
        {micIsMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        {isOverlay ? (
          <span className="sr-only">{micIsMuted ? "Unmute" : "Mute"}</span>
        ) : (
          <span>{micIsMuted ? "Unmute" : "Mute"}</span>
        )}
      </Button>

      <Button
        type="button"
        variant={isOverlay ? "ghost" : "outline"}
        className={cn(
          "h-12 rounded-full px-4 text-base",
          isOverlay && "h-14 w-14 px-0 text-white bg-black/50 hover:bg-black/70",
          cameraIsOff && "bg-red-500 hover:bg-red-600 text-white border-red-500",
          !cameraIsOff && !isOverlay && "bg-green-500 hover:bg-green-600 text-white border-green-500",
        )}
        onClick={handleToggleCamera}
        aria-label={cameraIsOff ? "Start video" : "Stop video"}
        disabled={controlsDisabled}
      >
        {cameraIsOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        {isOverlay ? (
          <span className="sr-only">{cameraIsOff ? "Start video" : "Stop video"}</span>
        ) : (
          <span>{cameraIsOff ? "Start video" : "Stop video"}</span>
        )}
      </Button>

      <Button
        type="button"
        variant={isOverlay ? "ghost" : "outline"}
        className={cn(
          "h-12 rounded-full px-4 text-base",
          isOverlay && "h-14 w-14 px-0 text-white bg-black/50 hover:bg-black/70",
        )}
        onClick={() => onOpenDeviceSettings?.()}
        aria-label="Switch camera"
        disabled={deviceSwitchDisabled}
      >
        <RefreshCcw className="h-5 w-5" />
        {isOverlay ? <span className="sr-only">Switch camera</span> : <span>Switch camera</span>}
      </Button>
    </section>
  );
}
