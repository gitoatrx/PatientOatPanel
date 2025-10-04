import { useFormContext, type RegisterOptions } from "react-hook-form";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  options?: RegisterOptions;
  error?: string;
}

export function FormTextarea({
  name,
  label,
  options,
  error,
  className,
  ...props
}: FormTextareaProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const fieldError = (errors[name] as { message?: string })?.message || error;
  const errorId = fieldError ? `${name}-error` : undefined;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={name}
          className="block text-lg font-normal text-foreground"
        >
          {label}
        </label>
      )}
      <textarea
        id={name}
        {...register(name, options)}
        {...props}
        className={cn(
          "w-full p-4 border border-border rounded-lg transition-colors resize-none text-base bg-white text-foreground placeholder:text-muted-foreground placeholder:font-normal font-bold",
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
