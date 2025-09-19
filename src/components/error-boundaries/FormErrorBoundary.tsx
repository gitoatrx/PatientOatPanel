"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Save } from "lucide-react";

interface FormErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  onSaveDraft?: () => void;
  formName?: string;
  resetKeys?: unknown[];
}

interface FormErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class FormErrorBoundary extends Component<
  FormErrorBoundaryProps,
  FormErrorBoundaryState
> {
  constructor(props: FormErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): FormErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    if (process.env.NODE_ENV === "development") {
      console.error("Form Error Boundary caught an error:", error, errorInfo);
    }

    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: FormErrorBoundaryProps) {
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

  render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Form Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              {this.props.formName
                ? `There was an error with the ${this.props.formName} form.`
                : "There was an error with this form."}{" "}
              Your data may have been lost.
            </p>

            {/* Development error details */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                <summary className="cursor-pointer font-medium text-foreground mb-2">
                  Error Details (Development)
                </summary>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    <strong>Error:</strong> {this.state.error.message}
                  </p>
                  <p>
                    <strong>Stack:</strong>
                  </p>
                  <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <p>
                        <strong>Component Stack:</strong>
                      </p>
                      <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={this.handleRetry}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>

              {this.props.onSaveDraft && (
                <Button
                  onClick={this.handleSaveDraft}
                  className="w-full"
                  variant="outline"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
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
      );
    }

    return this.props.children;
  }
}
