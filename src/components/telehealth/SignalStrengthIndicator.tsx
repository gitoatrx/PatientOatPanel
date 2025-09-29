"use client";

import { cn } from "@/lib/utils";

interface SignalStrengthIndicatorProps {
  strength: 'excellent' | 'good' | 'fair' | 'poor';
  className?: string;
}

export function SignalStrengthIndicator({ 
  strength, 
  className 
}: SignalStrengthIndicatorProps) {
  const getSignalBars = () => {
    switch (strength) {
      case 'excellent':
        return [true, true, true, true, true];
      case 'good':
        return [true, true, true, true, false];
      case 'fair':
        return [true, true, true, false, false];
      case 'poor':
        return [true, true, false, false, false];
      default:
        return [false, false, false, false, false];
    }
  };

  const getSignalColor = () => {
    switch (strength) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-green-400';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getSignalLabel = () => {
    switch (strength) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  const bars = getSignalBars();
  const color = getSignalColor();
  const label = getSignalLabel();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Signal Strength Bars */}
      <div className="flex items-end gap-0.5">
        {bars.map((isActive, index) => (
          <div
            key={index}
            className={cn(
              "w-1 rounded-sm transition-colors duration-200",
              isActive ? color : "bg-gray-300",
              index === 0 && "h-2",
              index === 1 && "h-3",
              index === 2 && "h-4",
              index === 3 && "h-5",
              index === 4 && "h-6"
            )}
          />
        ))}
      </div>
      
      {/* Signal Label */}
      <span className="text-xs font-medium text-gray-600">
        {label}
      </span>
    </div>
  );
}
