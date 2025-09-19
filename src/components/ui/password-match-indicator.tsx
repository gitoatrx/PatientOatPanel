"use client";

import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface PasswordMatchIndicatorProps {
  password: string;
  confirmPassword: string;
  className?: string;
}

export function PasswordMatchIndicator({
  password,
  confirmPassword,
  className,
}: PasswordMatchIndicatorProps) {
  const isMatching =
    password && confirmPassword && password === confirmPassword;
  const hasConfirmPassword = confirmPassword.length > 0;

  if (!hasConfirmPassword) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isMatching ? (
        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
      ) : (
        <X className="h-4 w-4 text-red-500 flex-shrink-0" />
      )}
    </div>
  );
}
