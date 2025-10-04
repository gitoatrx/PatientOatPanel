"use client";

import { useState } from "react";
import { useFormContext, type RegisterOptions } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface FormPasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  options?: RegisterOptions;
  error?: string;
  isSuccess?: boolean;
}

export function FormPasswordInput({
  name,
  label,
  options,
  error,
  isSuccess,
  className,
  ...props
}: FormPasswordInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const fieldError = (errors[name] as { message?: string })?.message || error;
  const errorId = fieldError ? `${name}-error` : undefined;
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-lg font-normal text-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          type={visible ? "text" : "password"}
          {...register(name, options)}
          {...props}
          className={cn(
            "w-full p-4 border border-border rounded-lg transition-colors text-base bg-white text-foreground placeholder:text-muted-foreground placeholder:font-normal font-bold",
            fieldError
              ? "border-destructive focus:border-destructive"
              : isSuccess
                ? "border-green-500 focus:border-green-500"
                : "focus:border-primary",
            className,
          )}
          aria-describedby={errorId}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          {visible ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
      {fieldError && (
        <p id={errorId} className="text-destructive text-sm">
          {fieldError}
        </p>
      )}
    </div>
  );
}
