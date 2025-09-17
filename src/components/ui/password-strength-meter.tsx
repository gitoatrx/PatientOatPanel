"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

interface PasswordStrengthMeterProps {
  password: string;
  requirements: PasswordRequirement[];
  className?: string;
}

export function PasswordStrengthMeter({
  password,
  requirements,
  className,
}: PasswordStrengthMeterProps) {
  const strength = useMemo(() => {
    if (!password) return 0;

    const metRequirements = requirements.filter((req) =>
      req.test(password),
    ).length;

    if (metRequirements === 0) return 0;
    if (metRequirements <= 2) return 1; // Weak
    if (metRequirements <= 4) return 2; // Medium
    if (metRequirements <= 5) return 3; // Strong
    return 4; // Very Strong
  }, [password, requirements]);

  const strengthLabels = ["", "Weak", "Medium", "Strong", "Very Strong"];
  const strengthColors = [
    "bg-gray-200",
    "bg-red-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  const progressWidth = password ? (strength / 4) * 100 : 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">
            Password Strength
          </span>
          {password && (
            <span
              className={cn(
                "text-sm font-medium",
                strength === 1 && "text-red-500",
                strength === 2 && "text-yellow-600",
                strength === 3 && "text-blue-500",
                strength === 4 && "text-green-500",
              )}
            >
              {strengthLabels[strength]}
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-300 ease-in-out",
              strengthColors[strength],
            )}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-2">
        {requirements.map((requirement, index) => (
          <div key={index} className="flex items-center gap-2">
            {requirement.met ? (
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
            <span
              className={cn(
                "text-sm",
                requirement.met
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400",
              )}
            >
              {requirement.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
