"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FloatingInputProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
}

export function FloatingInput({
  label,
  error,
  className,
  value,
  onChange,
  ...props
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(!!value);

  React.useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    onChange?.(e);
  };

  const isLabelFloating = isFocused || hasValue;

  return (
    <div className="relative">
      <input
        {...props}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "peer w-full rounded-md border-2 bg-transparent px-3 py-2 text-base transition-all duration-200",
          "placeholder:text-transparent focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-destructive focus:border-destructive"
            : isFocused
              ? "border-primary"
              : "border-gray-300 dark:border-gray-600",
          className,
        )}
        placeholder={label}
      />
      <label
        className={cn(
          "absolute left-3 transition-all duration-200 ease-in-out pointer-events-none bg-white px-1",
          isLabelFloating
            ? "top-0 -translate-y-1/2 text-xs"
            : "top-1/2 -translate-y-1/2 text-base",
          error
            ? "text-destructive"
            : isFocused
              ? "text-primary"
              : "text-muted-foreground",
        )}
      >
        {label}
      </label>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
