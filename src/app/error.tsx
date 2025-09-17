"use client";

import { BaseErrorBoundary } from "@/components/error-boundaries";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <BaseErrorBoundary
      onError={(error, errorInfo) => {
        // Log the error to an error reporting service
        console.error("Global error:", error, errorInfo);
      }}
      onRetry={reset}
      errorMessage="We encountered an unexpected error. Please try again."
      showHomeButton={true}
      showBackButton={false}
      showRetryButton={true}
    >
      {/* This will never render because the error is already caught */}
      <div />
    </BaseErrorBoundary>
  );
}
