"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "success" | "info" | "warning" | "error";
};

type Listener = (t: { id: number } & ToastOptions) => void;
const listeners = new Set<Listener>();
let idCounter = 0;

function emitToast(opts: ToastOptions) {
  const toast = { id: ++idCounter, ...opts };
  listeners.forEach((l) => l(toast));
  return toast.id;
}

export function Toaster() {
  const [toasts, setToasts] = useState<Array<{ id: number } & ToastOptions>>(
    [],
  );
  const dismiss = useCallback(
    (id: number) => setToasts((prev) => prev.filter((x) => x.id !== id)),
    [],
  );

  useEffect(() => {
    const onToast: Listener = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => dismiss(t.id), 3500);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, [dismiss]);

  return (
    <ToastProvider>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          className={[
            "relative",
            // base look
            "border rounded-xl",
            // variant styles
            t.variant === "success"
              ? "bg-green-50 border-green-300 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100"
              : t.variant === "warning"
                ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100"
                : t.variant === "error"
                  ? "bg-red-50 border-red-300 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100"
                  : t.variant === "info" || t.variant === "default"
                    ? "bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100"
                    : undefined,
            // left accent bar similar to screenshot
            t.variant === "success"
              ? "border-l-4 border-l-green-500"
              : t.variant === "warning"
                ? "border-l-4 border-l-amber-500"
                : t.variant === "error"
                  ? "border-l-4 border-l-red-500"
                  : "border-l-4 border-l-blue-500",
          ]
            .filter(Boolean)
            .join(" ")}
          onOpenChange={(o) => !o && dismiss(t.id)}
        >
          <button
            aria-label="Close"
            className="absolute right-3 top-3 opacity-70 hover:opacity-100"
            onClick={() => dismiss(t.id)}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className="mt-0.5">
              {t.variant === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : t.variant === "warning" ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              ) : t.variant === "error" ? (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="space-y-1">
              {t.title && (
                <ToastTitle className="text-base font-semibold">
                  {t.title}
                </ToastTitle>
              )}
              {t.description && (
                <ToastDescription className="text-sm opacity-90">
                  {t.description}
                </ToastDescription>
              )}
            </div>
          </div>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

export function useToast() {
  return {
    toast: (opts: ToastOptions) => emitToast(opts),
  };
}
