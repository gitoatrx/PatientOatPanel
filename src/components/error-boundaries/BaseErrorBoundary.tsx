"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BaseErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  resetKeys?: unknown[];
  errorMessage?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  showRetryButton?: boolean;
}

interface BaseErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class BaseErrorBoundary extends Component<
  BaseErrorBoundaryProps,
  BaseErrorBoundaryState
> {
  constructor(props: BaseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): BaseErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught an error:", error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    if (process.env.NODE_ENV === "production") {
      // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  componentDidUpdate(prevProps: BaseErrorBoundaryProps) {
    // Reset error state when resetKeys change
    if (this.state.hasError && prevProps.resetKeys !== this.props.resetKeys) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorMessage={this.props.errorMessage}
          showHomeButton={this.props.showHomeButton}
          showBackButton={this.props.showBackButton}
          showRetryButton={this.props.showRetryButton}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  errorMessage?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  showRetryButton?: boolean;
  onRetry: () => void;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  errorMessage,
  showHomeButton = true,
  showBackButton = true,
  showRetryButton = true,
  onRetry,
}: DefaultErrorFallbackProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {errorMessage ||
              "We encountered an unexpected error. Please try again or contact support if the problem persists."}
          </p>

          {/* Development error details */}
          {process.env.NODE_ENV === "development" && error && (
            <details className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
              <summary className="cursor-pointer font-medium text-foreground mb-2">
                Error Details (Development)
              </summary>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong>Error:</strong> {error.message}
                </p>
                <p>
                  <strong>Stack:</strong>
                </p>
                <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-32">
                  {error.stack}
                </pre>
                {errorInfo && (
                  <>
                    <p>
                      <strong>Component Stack:</strong>
                    </p>
                    <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-32">
                      {errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            {showRetryButton && (
              <Button onClick={onRetry} className="flex-1" variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}

            {showBackButton && (
              <Button
                onClick={handleGoBack}
                className="flex-1"
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            )}

            {showHomeButton && (
              <Button
                onClick={handleGoHome}
                className="flex-1"
                variant="outline"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>

          {/* Support contact */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>
              Need help? Contact{" "}
              <a
                href="mailto:support@bimble.com"
                className="text-primary hover:underline"
              >
                support@bimble.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
