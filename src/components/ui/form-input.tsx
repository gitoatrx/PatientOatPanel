import { useFormContext, type RegisterOptions } from "react-hook-form";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  options?: RegisterOptions;
  error?: string;
}

export function FormInput({
  name,
  label,
  options,
  error,
  className,
  type = "text",
  onChange,
  onBlur,
  ...props
}: FormInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const fieldError = (errors[name] as { message?: string })?.message || error;
  const errorId = fieldError ? `${name}-error` : undefined;

  const {
    onChange: registerOnChange,
    onBlur: registerOnBlur,
    ...registerProps
  } = register(name, options);

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-lg font-normal text-foreground pb-[1.5px]"
      >
        {label}
      </label>
      <input
        id={name}
        type={type}
        {...registerProps}
        {...props}
        onChange={(e) => {
          // Call custom onChange if provided
          if (onChange) {
            onChange(e);
          }
          // Always call register's onChange for form validation
          registerOnChange(e);
        }}
        onBlur={(e) => {
          // Call custom onBlur if provided
          if (onBlur) {
            onBlur(e);
          }
          // Always call register's onBlur for form validation
          registerOnBlur(e);
        }}
        className={cn(
          "w-full p-4 border border-border rounded-lg transition-colors text-base bg-white text-foreground placeholder:text-muted-foreground placeholder:font-normal font-bold",
          // Disabled styling: subtle grey overlay and muted colors
          "disabled:bg-muted disabled:text-muted-foreground disabled:border-muted disabled:cursor-not-allowed disabled:opacity-80",
          fieldError
            ? "border-destructive focus:border-destructive"
            : "focus:border-primary",
          className,
        )}
        aria-describedby={errorId}
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
