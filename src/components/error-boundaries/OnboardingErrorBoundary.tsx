"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft, Save, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface OnboardingErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  onSaveDraft?: () => void;
  onGoBack?: () => void;
  stepName?: string;
  userType?: "doctor" | "clinic" | "patient";
  resetKeys?: unknown[];
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

    if (process.env.NODE_ENV === "development") {
      console.error(
        "Onboarding Error Boundary caught an error:",
        error,
        errorInfo,
      );
    }

    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: OnboardingErrorBoundaryProps) {
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

  handleSaveDraft = () => {
    this.props.onSaveDraft?.();
  };

  handleGoBack = () => {
    this.props.onGoBack?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <OnboardingErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          stepName={this.props.stepName}
          userType={this.props.userType}
          onRetry={this.handleRetry}
          onSaveDraft={this.handleSaveDraft}
          onGoBack={this.handleGoBack}
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
  userType?: "doctor" | "clinic" | "patient";
  onRetry: () => void;
  onSaveDraft?: () => void;
  onGoBack?: () => void;
}

function OnboardingErrorFallback({
  error,
  errorInfo,
  stepName,
  userType,
  onRetry,
  onSaveDraft,
  onGoBack,
}: OnboardingErrorFallbackProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  const getStepDisplayName = () => {
    if (!stepName) return "this step";

    const stepNames: Record<string, string> = {
      NAMES: "Personal Information",
      BIRTHDAY: "Birthday",
      GENDER: "Gender",
      PROFESSIONAL: "Professional Profile",
      FILES: "Document Upload",
      PAYMENT: "Payment",
      COMPLETE: "Completion",
    };

    return stepNames[stepName] || stepName;
  };

  const getUserTypeDisplayName = () => {
    const userTypes: Record<string, string> = {
      doctor: "Doctor",
      clinic: "Clinic",
      patient: "Patient",
    };

    return userTypes[userType || ""] || "User";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            Onboarding Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {stepName
              ? `There was an error with the ${getStepDisplayName()} step in your ${getUserTypeDisplayName()} onboarding.`
              : "There was an error during your onboarding process."}{" "}
            Your progress has been saved.
          </p>

          {/* Development error details */}
          {process.env.NODE_ENV === "development" && error && (
            <details className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
              <summary className="cursor-pointer font-medium text-foreground mb-2">
                Error Details (Development)
              </summary>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong>Step:</strong> {stepName || "Unknown"}
                </p>
                <p>
                  <strong>User Type:</strong> {getUserTypeDisplayName()}
                </p>
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
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={onRetry} className="w-full" variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            {onSaveDraft && (
              <Button
                onClick={onSaveDraft}
                className="w-full"
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Progress
              </Button>
            )}

            {onGoBack && (
              <Button onClick={onGoBack} className="w-full" variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            )}

            <Button onClick={handleGoHome} className="w-full" variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          {/* Support contact */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>
              Need help with onboarding? Contact{" "}
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
