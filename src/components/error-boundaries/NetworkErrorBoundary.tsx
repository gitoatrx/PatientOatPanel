"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Signal } from "lucide-react";

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  maxRetries?: number;
  retryDelay?: number;
  resetKeys?: unknown[];
}

interface NetworkErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  isRetrying: boolean;
  isOffline: boolean;
}

export class NetworkErrorBoundary extends Component<
  NetworkErrorBoundaryProps,
  NetworkErrorBoundaryState
> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isRetrying: false,
      isOffline: !navigator.onLine,
    };
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<NetworkErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    if (process.env.NODE_ENV === "development") {
      console.error(
        "Network Error Boundary caught an error:",
        error,
        errorInfo,
      );
    }

    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: NetworkErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKeys !== this.props.resetKeys) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: 0,
        isRetrying: false,
      });
    }
  }

  handleOnline = () => {
    this.setState({ isOffline: false });
  };

  handleOffline = () => {
    this.setState({ isOffline: true });
  };

  isNetworkError = (error: Error): boolean => {
    const networkErrorMessages = [
      "network",
      "fetch",
      "timeout",
      "connection",
      "offline",
      "failed to fetch",
      "network error",
      "connection refused",
      "net::err_",
      "http error",
    ];

    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || "";

    return networkErrorMessages.some(
      (msg) => errorMessage.includes(msg) || errorStack.includes(msg),
    );
  };

  handleRetry = async () => {
    const { retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;
    const retryDelay = this.props.retryDelay || 1000;

    if (retryCount >= maxRetries) {
      // Reset retry count and show final error
      this.setState({
        retryCount: 0,
        isRetrying: false,
        hasError: true,
      });
      return;
    }

    this.setState({ isRetrying: true });

    // Exponential backoff
    const delay = retryDelay * Math.pow(2, retryCount);

    this.retryTimeout = setTimeout(() => {
      this.setState((prevState) => ({
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
        hasError: false,
      }));

      this.props.onRetry?.();
    }, delay);
  };

  render() {
    const { hasError, error, isOffline, isRetrying, retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;

    if (hasError && error) {
      const isNetworkError = this.isNetworkError(error);

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                {isOffline ? (
                  <WifiOff className="h-6 w-6 text-destructive" />
                ) : isNetworkError ? (
                  <Signal className="h-6 w-6 text-destructive" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                )}
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                {isOffline
                  ? "You're Offline"
                  : isNetworkError
                    ? "Network Error"
                    : "Connection Error"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                {isOffline
                  ? "Please check your internet connection and try again."
                  : isNetworkError
                    ? "We're having trouble connecting to our servers. Please check your connection and try again."
                    : "There was a problem with your request. Please try again."}
              </p>

              {retryCount > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Retry attempt {retryCount} of {maxRetries}
                </p>
              )}

              {/* Development error details */}
              {process.env.NODE_ENV === "development" && (
                <details className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                  <summary className="cursor-pointer font-medium text-foreground mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <strong>Error:</strong> {error.message}
                    </p>
                    <p>
                      <strong>Type:</strong>{" "}
                      {isNetworkError ? "Network Error" : "Other Error"}
                    </p>
                    <p>
                      <strong>Online Status:</strong>{" "}
                      {navigator.onLine ? "Online" : "Offline"}
                    </p>
                    <p>
                      <strong>Retry Count:</strong> {retryCount}
                    </p>
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-4">
                {!isOffline && retryCount < maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="default"
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </>
                    )}
                  </Button>
                )}

                {isOffline && (
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full"
                    variant="default"
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                )}
              </div>

              {/* Support contact */}
              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                <p>
                  Still having issues? Contact{" "}
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

    return this.props.children;
  }
}
