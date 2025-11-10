"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  audioStream: MediaStream | null;
  barCount?: number;
  color?: string;
  className?: string;
  isActive?: boolean;
}

export function AudioWaveform({
  audioStream,
  barCount = 12,
  color = "#fbbf24", // Default yellow
  className,
  isActive = true,
}: AudioWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>(new Array(barCount).fill(0.1));

  useEffect(() => {
    if (!audioStream || !containerRef.current) {
      // Reset bars when no stream
      setBarHeights(new Array(barCount).fill(0.1));
      return;
    }

    // Create audio context and analyser
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(audioStream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaveform = () => {
        if (!analyser) return;

        analyser.getByteFrequencyData(dataArray);

        // Map frequency data to bar heights (0-1 normalized)
        const newHeights: number[] = [];

        // Group frequency bins and map to bars
        // Lower frequencies on left, higher on right
        for (let i = 0; i < barCount; i++) {
          const startBin = Math.floor((i / barCount) * bufferLength);
          const endBin = Math.floor(((i + 1) / barCount) * bufferLength);
          
          let sum = 0;
          let count = 0;
          for (let j = startBin; j < endBin && j < bufferLength; j++) {
            sum += dataArray[j];
            count++;
          }
          
          const average = count > 0 ? sum / count : 0;
          // Normalize to 0-1 range
          const normalized = average / 255;
          // Apply some amplification for better visibility
          const amplified = Math.pow(normalized, 0.5); // Square root for smoother curve
          
          newHeights.push(Math.max(amplified, 0.1)); // Minimum of 0.1 (10%)
        }

        setBarHeights(newHeights);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
    } catch (error) {
      console.error("Error setting up audio waveform:", error);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    };
  }, [audioStream, barCount]);

  return (
    <div 
      ref={containerRef}
      className={cn("flex items-end justify-center gap-1 h-full w-full", className)}
    >
      {barHeights.map((height, index) => {
        const heightPercent = Math.max(height * 100, 10); // At least 10% height
        return (
          <div
            key={index}
            className={cn(
              "rounded-sm transition-all duration-75 ease-out",
              isActive ? "" : "bg-gray-500"
            )}
            style={{
              width: `${100 / barCount - 1}%`,
              minWidth: "2px",
              height: `${heightPercent}%`,
              backgroundColor: isActive ? color : "#6b7280",
              minHeight: "10%",
              maxHeight: "90%",
            }}
          />
        );
      })}
    </div>
  );
}

