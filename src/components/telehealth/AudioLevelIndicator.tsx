"use client";

import { cn } from "@/lib/utils";

interface AudioLevelIndicatorProps {
  level: number; // 0-1
  className?: string;
  showPercentage?: boolean;
}

export function AudioLevelIndicator({ 
  level, 
  className,
  showPercentage = false 
}: AudioLevelIndicatorProps) {
  const getLevelBars = () => {
    const bars = [];
    const barCount = 5;
    const activeBars = Math.ceil(level * barCount);
    
    for (let i = 0; i < barCount; i++) {
      bars.push(i < activeBars);
    }
    
    return bars;
  };

  const getLevelColor = () => {
    if (level > 0.7) return 'bg-green-500';
    if (level > 0.4) return 'bg-yellow-500';
    if (level > 0.1) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  const bars = getLevelBars();
  const color = getLevelColor();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Audio Level Bars */}
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
      
      {/* Audio Level Label */}
      <span className="text-xs font-medium text-gray-600">
        Mic
      </span>
      
      {/* Audio Level Percentage (optional) */}
      {showPercentage && level > 0 && (
        <span className="text-xs text-blue-600">
          {Math.round(level * 100)}%
        </span>
      )}
    </div>
  );
}
