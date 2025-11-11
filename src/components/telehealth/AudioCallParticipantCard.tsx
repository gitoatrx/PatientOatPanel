"use client";

import { UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioWaveform } from "./AudioWaveform";

interface AudioCallParticipantCardProps {
  participantName: string;
  isLocal?: boolean;
  audioStream: MediaStream | null;
  isMuted?: boolean;
  isActive?: boolean;
  className?: string;
}

export function AudioCallParticipantCard({
  participantName,
  isLocal = false,
  audioStream,
  isMuted = false,
  isActive = true,
  className,
}: AudioCallParticipantCardProps) {
  // Get initials from name
  const getInitials = (name: string) => {
    if (!name || name === "You") return null;
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(participantName);
  const displayName = isLocal ? "You" : participantName;
  
  // Color scheme: yellow for remote, blue for local (or vice versa based on design)
  const outlineColor = isLocal ? "border-blue-400" : "border-yellow-400";
  const waveformColor = isLocal ? "#60a5fa" : "#fbbf24"; // blue-400 : yellow-400

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 bg-slate-900/90 backdrop-blur-sm overflow-hidden",
        "flex flex-col items-center justify-between p-4",
        "min-h-[200px] h-full",
        outlineColor,
        className
      )}
    >
      {/* Participant Name/Status */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
        {!isLocal && (
          <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded bg-black/30">
            {participantName || "Participant"}
          </span>
        )}
        {isLocal && (
          <span className="text-xs text-slate-300 font-medium px-2 py-0.5 rounded bg-black/30">
            You
          </span>
        )}
      </div>

      {/* Avatar/Initials - Centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-800/90 backdrop-blur-sm">
          {initials ? (
            <span className="text-gray-400 font-semibold text-2xl">{initials}</span>
          ) : (
            <UserCircle className="h-16 w-16 text-gray-400" />
          )}
        </div>
      </div>

      {/* Waveform Visualization - Bottom */}
      <div className="w-full h-12 mb-2">
        <AudioWaveform
          audioStream={audioStream}
          barCount={12}
          color={waveformColor}
          isActive={isActive && !isMuted}
        />
      </div>

      {/* Muted Indicator */}
      {isMuted && (
        <div className="absolute bottom-2 right-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded-full">
          Muted
        </div>
      )}
    </div>
  );
}


