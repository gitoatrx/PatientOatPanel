
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface OnboardingErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  resetKeys?: unknown[];
  stepName?: string;
}

interface OnboardingErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class OnboardingErrorBoundary extends Component<
  OnboardingErrorBoundaryProps,
  OnboardingErrorBoundaryState
> {
  constructor(props: OnboardingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): OnboardingErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Onboarding Error Boundary caught an error:", error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    if (process.env.NODE_ENV === "production") {
      // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
      // Sentry.captureException(error, { 
      //   extra: errorInfo,
      //   tags: {
      //     component: 'OnboardingErrorBoundary',
      //     step: this.props.stepName || 'unknown'
      //   }
      // });
    }
  }

  componentDidUpdate(prevProps: OnboardingErrorBoundaryProps) {
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

      // Default onboarding error UI
      return (
        <OnboardingErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          stepName={this.props.stepName}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface OnboardingErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  stepName?: string;
  onRetry: () => void;
}

function OnboardingErrorFallback({
  error,
  errorInfo,
  stepName,
  onRetry,
}: OnboardingErrorFallbackProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push("/");
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
            {stepName 
              ? `We encountered an error in the ${stepName} step. Please try again.`
              : "We encountered an unexpected error during onboarding. Please try again or contact support if the problem persists."
            }
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
                  <strong>Step:</strong> {stepName || 'Unknown'}
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
            <Button onClick={onRetry} className="flex-1" variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Button
              onClick={handleGoBack}
              className="flex-1"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>

            <Button
              onClick={handleGoHome}
              className="flex-1"
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
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