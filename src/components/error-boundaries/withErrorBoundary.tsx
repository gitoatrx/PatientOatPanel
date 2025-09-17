"use client";

import React, { ComponentType } from "react";
import {
  BaseErrorBoundary,
  FormErrorBoundary,
  NetworkErrorBoundary,
  OnboardingErrorBoundary,
} from "./index";

interface ErrorBoundaryConfig {
  type?: "base" | "form" | "network" | "onboarding";
  errorMessage?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  showRetryButton?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  formName?: string;
  stepName?: string;
  userType?: "doctor" | "clinic" | "patient";
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
  onSaveDraft?: () => void;
  onGoBack?: () => void;
  resetKeys?: unknown[];
}

export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  config: ErrorBoundaryConfig = {},
) {
  const {
    type = "base",
    errorMessage,
    showHomeButton = true,
    showBackButton = true,
    showRetryButton = true,
    maxRetries = 3,
    retryDelay = 1000,
    formName,
    stepName,
    userType,
    onError,
    onRetry,
    onSaveDraft,
    onGoBack,
    resetKeys,
  } = config;

  const WrappedComponent = (props: P) => {
    const errorBoundaryProps = {
      onError,
      resetKeys,
    };

    switch (type) {
      case "form":
        return (
          <FormErrorBoundary
            {...errorBoundaryProps}
            formName={formName}
            onRetry={onRetry}
            onSaveDraft={onSaveDraft}
          >
            <Component {...props} />
          </FormErrorBoundary>
        );

      case "network":
        return (
          <NetworkErrorBoundary
            {...errorBoundaryProps}
            onRetry={onRetry}
            maxRetries={maxRetries}
            retryDelay={retryDelay}
          >
            <Component {...props} />
          </NetworkErrorBoundary>
        );

      case "onboarding":
        return (
          <OnboardingErrorBoundary
            {...errorBoundaryProps}
            stepName={stepName}
            userType={userType}
            onRetry={onRetry}
            onSaveDraft={onSaveDraft}
            onGoBack={onGoBack}
          >
            <Component {...props} />
          </OnboardingErrorBoundary>
        );

      default:
        return (
          <BaseErrorBoundary
            {...errorBoundaryProps}
            errorMessage={errorMessage}
            showHomeButton={showHomeButton}
            showBackButton={showBackButton}
            showRetryButton={showRetryButton}
          >
            <Component {...props} />
          </BaseErrorBoundary>
        );
    }
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
