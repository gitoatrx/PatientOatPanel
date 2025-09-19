"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { ReactNode } from "react";

interface EnhancedCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: string;
  error?: string;
  className?: string;
}

export function EnhancedCheckbox({
  id,
  checked,
  onChange,
  label,
  description,
  error,
  className,
}: EnhancedCheckboxProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={!!error}
          />
          <label
            htmlFor={id}
            className={cn(
              "flex h-4 w-4 cursor-pointer items-center justify-center rounded border-2 transition-colors mt-0.5",
              checked
                ? "border-primary bg-primary"
                : "border-border hover:border-primary/50",
              error && "border-destructive",
            )}
          >
            {checked && (
              <Check className="h-2.5 w-2.5 text-primary-foreground" />
            )}
          </label>
        </div>
        <div className="space-y-1">
          <label
            htmlFor={id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
