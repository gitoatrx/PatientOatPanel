import { useFormContext, type RegisterOptions } from "react-hook-form";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface FormRadioGroupProps {
  name: string;
  label: string;
  options: RadioOption[];
  registerOptions?: RegisterOptions;
  error?: string;
  className?: string;
  type?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function FormRadioGroup({
  name,
  label,
  options,
  registerOptions,
  error,
  className,
  type = "radio",
  onKeyDown,
}: FormRadioGroupProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const fieldError = (errors[name] as { message?: string })?.message || error;
  const errorId = fieldError ? `${name}-error` : undefined;

  return (
    <div
      className={cn("space-y-2", className)}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <label className="block text-lg font-semibold text-foreground">
        {label}
      </label>
      <div className="space-y-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-start p-4 border border-border rounded-lg cursor-pointer hover:bg-muted  transition-colors"
          >
            <input
              {...register(name, registerOptions)}
              type={type}
              value={option.value}
              className="w-4 h-4 text-primary border-border focus:ring-primary mt-1.5"
            />
            <div className="ml-3">
              <span className="block text-base font-medium text-foreground">
                {option.label}
              </span>
              {option.description && (
                <span className="block text-sm text-muted-foreground">
                  {option.description}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>
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
