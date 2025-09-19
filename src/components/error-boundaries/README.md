# Error Boundary System

A comprehensive error boundary system for handling different types of errors in the Bimble application with specialized error boundaries for forms, network issues, and onboarding flows.

## Features

- **Multiple Error Boundary Types**: Specialized boundaries for different use cases
- **Dark Mode Support**: All error boundaries work seamlessly with light/dark themes
- **Development Debugging**: Detailed error information in development mode
- **Retry Mechanisms**: Built-in retry logic with exponential backoff
- **Offline Detection**: Automatic detection and handling of offline states
- **Customizable UI**: Configurable buttons and actions
- **Error Logging**: Integration ready for external error tracking services

## Error Boundary Types

### 1. BaseErrorBoundary

General-purpose error boundary for catching any React errors.

### 2. FormErrorBoundary

Specialized for form components with draft saving capabilities.

### 3. NetworkErrorBoundary

Handles network and API errors with retry mechanisms and offline detection.

### 4. OnboardingErrorBoundary

Specific to onboarding flows with step-specific error handling.

## Usage

### Basic Usage

```tsx
import { BaseErrorBoundary } from "@/components/error-boundaries";

function MyComponent() {
  return (
    <BaseErrorBoundary>
      <YourComponent />
    </BaseErrorBoundary>
  );
}
```

### Form Error Boundary

```tsx
import { FormErrorBoundary } from "@/components/error-boundaries";

function MyForm() {
  const handleSaveDraft = () => {
    // Save form data to localStorage or API
  };

  return (
    <FormErrorBoundary
      formName="User Registration"
      onSaveDraft={handleSaveDraft}
      onRetry={() => {
        // Custom retry logic
      }}
    >
      <RegistrationForm />
    </FormErrorBoundary>
  );
}
```

### Network Error Boundary

```tsx
import { NetworkErrorBoundary } from "@/components/error-boundaries";

function DataComponent() {
  return (
    <NetworkErrorBoundary
      maxRetries={5}
      retryDelay={2000}
      onRetry={() => {
        // Refetch data
      }}
    >
      <DataFetchingComponent />
    </NetworkErrorBoundary>
  );
}
```

### Onboarding Error Boundary

```tsx
import { OnboardingErrorBoundary } from "@/components/error-boundaries";

function DoctorOnboarding() {
  return (
    <OnboardingErrorBoundary
      stepName="NAMES"
      userType="doctor"
      onSaveDraft={() => {
        // Save onboarding progress
      }}
      onGoBack={() => {
        // Navigate to previous step
      }}
    >
      <NamesStep />
    </OnboardingErrorBoundary>
  );
}
```

### Using Higher-Order Component

```tsx
import { withErrorBoundary } from "@/components/error-boundaries";

const MyComponentWithErrorBoundary = withErrorBoundary(MyComponent, {
  type: "form",
  formName: "User Profile",
  onSaveDraft: () => saveDraft(),
  onRetry: () => retry(),
});

// Or for onboarding
const OnboardingStepWithErrorBoundary = withErrorBoundary(OnboardingStep, {
  type: "onboarding",
  stepName: "PROFESSIONAL",
  userType: "doctor",
  onSaveDraft: () => saveProgress(),
});
```

## Configuration Options

### BaseErrorBoundary Props

```tsx
interface BaseErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Custom fallback component
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: any[]; // Reset when these values change
  errorMessage?: string; // Custom error message
  showHomeButton?: boolean;
  showBackButton?: boolean;
  showRetryButton?: boolean;
}
```

### FormErrorBoundary Props

```tsx
interface FormErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  onSaveDraft?: () => void;
  formName?: string;
  resetKeys?: any[];
}
```

### NetworkErrorBoundary Props

```tsx
interface NetworkErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  maxRetries?: number; // Default: 3
  retryDelay?: number; // Default: 1000ms
  resetKeys?: any[];
}
```

### OnboardingErrorBoundary Props

```tsx
interface OnboardingErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  onSaveDraft?: () => void;
  onGoBack?: () => void;
  stepName?: string;
  userType?: "doctor" | "clinic" | "patient";
  resetKeys?: any[];
}
```

## Integration with External Services

### Sentry Integration

```tsx
// In BaseErrorBoundary componentDidCatch
if (process.env.NODE_ENV === "production") {
  Sentry.captureException(error, {
    extra: errorInfo,
    tags: {
      component: "MyComponent",
      userType: "doctor",
    },
  });
}
```

### Custom Error Tracking

```tsx
const handleError = (error: Error, errorInfo: ErrorInfo) => {
  // Send to your error tracking service
  analytics.track("error", {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
  });
};

<BaseErrorBoundary onError={handleError}>
  <YourComponent />
</BaseErrorBoundary>;
```

## Best Practices

### 1. Use Appropriate Error Boundary Type

- Use `FormErrorBoundary` for forms
- Use `NetworkErrorBoundary` for data fetching components
- Use `OnboardingErrorBoundary` for onboarding steps
- Use `BaseErrorBoundary` for general components

### 2. Provide Meaningful Error Messages

```tsx
<BaseErrorBoundary errorMessage="Unable to load your profile. Please try again.">
  <ProfileComponent />
</BaseErrorBoundary>
```

### 3. Implement Proper Retry Logic

```tsx
<NetworkErrorBoundary
  onRetry={() => {
    // Implement proper retry logic
    refetchData();
  }}
>
  <DataComponent />
</NetworkErrorBoundary>
```

### 4. Save User Progress

```tsx
<FormErrorBoundary
  onSaveDraft={() => {
    // Save form data to prevent loss
    saveFormData(formData);
  }}
>
  <LongForm />
</FormErrorBoundary>
```

### 5. Use Reset Keys for Dynamic Content

```tsx
<BaseErrorBoundary resetKeys={[userId, stepId]}>
  <DynamicComponent userId={userId} stepId={stepId} />
</BaseErrorBoundary>
```

## Error Boundary Hierarchy

```
App
├── BaseErrorBoundary (Global)
├── NetworkErrorBoundary (API calls)
├── FormErrorBoundary (Forms)
└── OnboardingErrorBoundary (Onboarding steps)
```

## Development vs Production

### Development Mode

- Shows detailed error information
- Displays component stack traces
- Logs errors to console
- Shows error details in collapsible sections

### Production Mode

- Shows user-friendly error messages
- Hides technical details
- Logs to external services (when configured)
- Focuses on recovery actions

## Accessibility

All error boundaries include:

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly messages
- High contrast error states
- Focus management

## Testing

```tsx
// Test error boundary behavior
import { render, screen } from "@testing-library/react";
import { BaseErrorBoundary } from "@/components/error-boundaries";

const ThrowError = () => {
  throw new Error("Test error");
};

test("renders error fallback when error occurs", () => {
  render(
    <BaseErrorBoundary>
      <ThrowError />
    </BaseErrorBoundary>,
  );

  expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  expect(screen.getByText("Try Again")).toBeInTheDocument();
});
```
