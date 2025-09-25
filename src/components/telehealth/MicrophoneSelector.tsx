"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mic, ChevronDown, Check } from "lucide-react";

interface MicrophoneSelectorProps {
  audioDevices: Array<{ deviceId?: string; label?: string }>;
  currentDevice: string | null;
  onDeviceChange: (deviceId: string) => void;
  className?: string;
  disabled?: boolean;
}

export function MicrophoneSelector({
  audioDevices,
  currentDevice,
  onDeviceChange,
  className,
  disabled = false
}: MicrophoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentDeviceLabel = audioDevices.find(
    device => device.deviceId === currentDevice
  )?.label || "Default Microphone";

  const handleDeviceSelect = (deviceId: string) => {
    onDeviceChange(deviceId);
    setIsOpen(false);
  };

  if (audioDevices.length <= 1) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Mic className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">
          {currentDeviceLabel}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 h-8 px-3"
      >
        <Mic className="h-4 w-4" />
        <span className="text-sm truncate max-w-32">
          {currentDeviceLabel}
        </span>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">
              Select Microphone
            </div>
            {audioDevices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => handleDeviceSelect(device.deviceId!)}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-2 text-sm rounded hover:bg-gray-50 transition-colors",
                  device.deviceId === currentDevice && "bg-blue-50"
                )}
              >
                <span className="truncate">
                  {device.label || `Microphone ${device.deviceId?.slice(-4)}`}
                </span>
                {device.deviceId === currentDevice && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
