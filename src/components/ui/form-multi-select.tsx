"use client";

import { useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface FormMultiSelectProps {
  name: string;
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  className?: string;
}

export function FormMultiSelect({
  name,
  label,
  options,
  placeholder,
  className,
}: FormMultiSelectProps) {
  const {
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useFormContext();

  const selected: string[] = watch(name) || [];
  const fieldError = (errors[name] as { message?: string })?.message;
  const errorId = fieldError ? `${name}-error` : undefined;

  // Trigger validation when component mounts with existing values
  useEffect(() => {
    if (selected.length > 0) {
      // Use setTimeout to ensure the form state is properly updated
      setTimeout(() => {
        trigger(name);
      }, 0);
    }
  }, [selected.length, trigger, name]);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selected.includes(value)) {
      setValue(name, [...selected, value], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    e.target.value = "";
  };

  const removeValue = (value: string) => {
    setValue(
      name,
      selected.filter((v) => v !== value),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={name}
        className="block text-lg font-normal text-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={name}
          value=""
          onChange={handleSelect}
          className="w-full p-4 pr-12 border border-border rounded-lg transition-colors text-base bg-white text-foreground appearance-none font-bold"
        >
          {placeholder && (
            <option value="" disabled className="font-normal">
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
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map((value) => {
            const option = options.find((o) => o.value === value);
            return (
              <span
                key={value}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary rounded-md"
              >
                {option?.label || value}
                <button
                  type="button"
                  onClick={() => removeValue(value)}
                  className="ml-1 hover:text-primary/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      {fieldError && (
        <p id={errorId} className="text-destructive text-sm">
          {fieldError}
        </p>
      )}
    </div>
  );
}
