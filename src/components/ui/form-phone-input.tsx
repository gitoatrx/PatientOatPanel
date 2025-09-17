import { useFormContext, type RegisterOptions } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface FormPhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  name: string;
  label: string;
  options?: RegisterOptions;
  error?: string;
  type?: string;
}

export function FormPhoneInput({
  name,
  label,
  options,
  error,
  className,
  type = "tel",
  ...props
}: FormPhoneInputProps) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const [displayValue, setDisplayValue] = useState("");
  const fieldValue = watch(name);

  const fieldError = (errors[name] as { message?: string })?.message || error;
  const errorId = fieldError ? `${name}-error` : undefined;

  // Format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, "");

    // Limit to 10 digits
    const trimmed = cleaned.slice(0, 10);

    if (trimmed.length === 0) return "";
    if (trimmed.length <= 3) return `(${trimmed}`;
    if (trimmed.length <= 6)
      return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`;
    return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if ((props as { disabled?: boolean }).disabled) return;
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    setDisplayValue(formatted);

    // Store only up to 10 digits in the form value (keeps UI and value in sync)
    const digitsOnly = input.replace(/\D/g, "").slice(0, 10);
    setValue(name, digitsOnly, { shouldValidate: true, shouldTouch: true });
  };

  // Update display value when form value changes (e.g., from validation)
  useEffect(() => {
    // Always reflect the current stored value in the UI so prefilled/locked
    // numbers show up even when the input is disabled.
    if (fieldValue) {
      setDisplayValue(formatPhoneNumber(fieldValue));
    } else {
      setDisplayValue("");
    }
  }, [fieldValue]);

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-lg font-semibold text-foreground"
      >
        {label}
      </label>
      <input
        id={name}
        type={type}
        value={displayValue}
        onChange={handleChange}
        onBlur={(e) => {
          register(name, options).onBlur(e);
          // Trigger validation on blur
          setValue(name, fieldValue, {
            shouldValidate: true,
            shouldTouch: true,
          });
        }}
        {...props}
        className={cn(
          "w-full p-4 border border-border rounded-lg transition-colors text-base bg-background text-foreground placeholder:text-muted-foreground",
          // Disabled styling: greyed background and no country code/formatting changes
          "disabled:bg-muted disabled:text-muted-foreground disabled:border-muted disabled:cursor-not-allowed disabled:opacity-80",
          fieldError
            ? "border-destructive focus:border-destructive"
            : "focus:border-primary",
          className,
        )}
        aria-describedby={errorId}
        placeholder="(555) 123-4567"
      />
      <AnimatePresence>
        {fieldError && (
          <motion.p
            id={errorId}
            className="text-destructive text-sm"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {fieldError}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
