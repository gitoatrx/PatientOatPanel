"use client";

import { ChevronDown } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  name: string;
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  className?: string;
}

export function FormSelect({
  name,
  label,
  options,
  placeholder,
  className,
}: FormSelectProps) {
  const {
    register,
    formState: { errors },
    setValue,
    trigger,
  } = useFormContext();

  const fieldError = (errors[name] as { message?: string })?.message;
  const errorId = fieldError ? `${name}-error` : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setValue(name, value, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
    // Trigger validation for the entire form to update isValid state
    setTimeout(() => {
      trigger();
    }, 0);
  };

  return (
    <div className={cn("space-y-2 w-full", className)}>
      <label
        htmlFor={name}
        className="block text-lg font-semibold text-foreground"
      >
        {label}
      </label>
      <div className="relative w-full overflow-hidden">
        <select
          id={name}
          {...register(name, {
            onChange: handleChange,
          })}
          className="w-full p-4 pr-12 border border-border rounded-lg transition-colors text-base bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-foreground" />
        </div>
      </div>
      {fieldError && (
        <p id={errorId} className="text-destructive text-sm">
          {fieldError}
        </p>
      )}
    </div>
  );
}
