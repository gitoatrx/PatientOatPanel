"use client";

import { useEffect, useState, useRef } from "react";
import { AudioCallParticipantCard } from "./AudioCallParticipantCard";
import { cn } from "@/lib/utils";

interface Participant {
  connectionId: string;
  streamId?: string;
  hasVideo: boolean;
  hasAudio: boolean;
  isLocal: boolean;
  name?: string;
}

interface AudioCallGridProps {
  participants: Participant[];
  localParticipantName?: string;
  remoteContainerId?: string;
  localContainerId?: string;
  className?: string;
}

export function AudioCallGrid({
  participants,
  localParticipantName = "You",
  remoteContainerId = "vonage-remote-container",
  localContainerId = "vonage-local-container",
  className,
}: AudioCallGridProps) {
  const [audioStreams, setAudioStreams] = useState<Map<string, MediaStream | null>>(new Map());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extract audio streams from video elements
  useEffect(() => {
    const extractAudioStreams = () => {
      const streams = new Map<string, MediaStream | null>();

      // Get local participant stream
      const localContainer = document.getElementById(localContainerId);
      if (localContainer) {
        // Look for video in publisher or any video element
        const localVideo = localContainer.querySelector("video") as HTMLVideoElement | null;
        if (localVideo?.srcObject instanceof MediaStream) {
          const localParticipant = participants.find((p) => p.isLocal);
          if (localParticipant) {
            streams.set(localParticipant.connectionId, localVideo.srcObject);
          } else {
            // Fallback: use "local" as key if no local participant found
            streams.set("local", localVideo.srcObject);
          }
        }
      }

      // Get remote participant streams
      const remoteContainer = document.getElementById(remoteContainerId);
      if (remoteContainer) {
        // Find all wrapper divs with data-connection-id (Vonage sets these)
        const wrappers = remoteContainer.querySelectorAll("[data-connection-id]");
        wrappers.forEach((wrapper) => {
          const connectionId = wrapper.getAttribute("data-connection-id");
          if (!connectionId) return;

          const video = wrapper.querySelector("video") as HTMLVideoElement | null;
          if (video?.srcObject instanceof MediaStream) {
            // Try to find matching participant
            const participant = participants.find(
              (p) => !p.isLocal && (p.connectionId === connectionId || p.connectionId.includes(connectionId))
            );
            if (participant) {
              streams.set(participant.connectionId, video.srcObject);
            } else {
              // Fallback: use connectionId directly
              streams.set(connectionId, video.srcObject);
            }
          }
        });

        // Fallback: if no wrappers found, try direct video elements
        if (wrappers.length === 0) {
          const videos = remoteContainer.querySelectorAll("video");
          videos.forEach((video, index) => {
            if (video.srcObject instanceof MediaStream) {
              // Try to get connectionId from parent
              const connectionId = 
                video.closest("[data-connection-id]")?.getAttribute("data-connection-id") ||
                null;

              if (connectionId) {
                const participant = participants.find(
                  (p) => !p.isLocal && (p.connectionId === connectionId || p.connectionId.includes(connectionId))
                );
                if (participant) {
                  streams.set(participant.connectionId, video.srcObject);
                } else {
                  streams.set(connectionId, video.srcObject);
                }
              } else {
                // Last resort: match by index
                const remoteParticipants = participants.filter((p) => !p.isLocal);
                if (remoteParticipants[index]) {
                  streams.set(remoteParticipants[index].connectionId, video.srcObject);
                }
              }
            }
          });
        }
      }

      setAudioStreams(streams);
    };

    // Initial extraction
    extractAudioStreams();

    // Poll for video elements (they may not be ready immediately)
    checkIntervalRef.current = setInterval(extractAudioStreams, 500);

    // Also listen for DOM changes
    const observer = new MutationObserver(extractAudioStreams);
    const remoteContainer = document.getElementById(remoteContainerId);
    const localContainer = document.getElementById(localContainerId);
    
    if (remoteContainer) {
      observer.observe(remoteContainer, { childList: true, subtree: true });
    }
    if (localContainer) {
      observer.observe(localContainer, { childList: true, subtree: true });
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      observer.disconnect();
    };
  }, [participants, remoteContainerId, localContainerId]);

  // Prepare participants for display (ensure we have local + remote)
  const displayParticipants = participants.length > 0 
    ? participants 
    : [
        {
          connectionId: "local",
          hasVideo: false,
          hasAudio: true,
          isLocal: true,
        },
      ];

  // Calculate grid layout
  const participantCount = displayParticipants.length;
  const gridCols = participantCount === 1 ? 1 : participantCount === 2 ? 2 : 2;
  const gridRows = participantCount <= 2 ? 1 : 2;

  return (
    <div
      className={cn(
        "w-full h-full p-4 sm:p-6",
        "flex items-center justify-center",
        className
      )}
    >
      <div
        className={cn(
          "w-full h-full max-w-4xl",
          "grid gap-4",
          gridCols === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
          gridRows === 1 ? "grid-rows-1" : "grid-rows-2",
          "auto-rows-fr"
        )}
      >
        {displayParticipants.map((participant) => {
          const participantName = participant.isLocal
            ? localParticipantName
            : participant.name || `Participant ${participant.connectionId.slice(-4)}`;
          
          const audioStream = audioStreams.get(participant.connectionId) || null;
          const isMuted = !participant.hasAudio;

          return (
            <AudioCallParticipantCard
              key={participant.connectionId}
              participantName={participantName}
              isLocal={participant.isLocal}
              audioStream={audioStream}
              isMuted={isMuted}
              isActive={participant.hasAudio}
            />
          );
        })}

        {/* Fill empty slots if less than 4 participants */}
        {participantCount < 4 &&
          Array.from({ length: 4 - participantCount }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="rounded-2xl border-2 border-slate-700/50 bg-slate-900/50 backdrop-blur-sm min-h-[200px]"
            />
          ))}
      </div>
    </div>
  );
}

