# Patient Onboarding Implementation Guide

## Overview
This document provides comprehensive guidelines for implementing and maintaining the patient onboarding flow with proper API integration and error handling.

## Architecture Overview

### Current Flow Structure
The patient onboarding consists of **15 sequential steps**:

1. **Phone** → 2. **OTP Verification** → 3. **Health Card** → 4. **Personal Info** → 5. **Gender** → 6. **Date of Birth** → 7. **Email** → 8. **Address** → 9. **Health Concern** → 10. **Visit Type** → 11. **Emergency Contact** → 12. **Doctor Selection** → 13. **Appointment** → 14. **Review** → 15. **Confirmation**

### Key Components

#### 1. Configuration Layer
- **File**: `src/lib/features/patient-onboarding/config/patient-onboarding-config.ts`
- **Purpose**: Centralized step definitions, routes, and mappings
- **Key Features**:
  - Type-safe step configurations
  - Helper functions for navigation
  - Step completion tracking
  - Route mapping utilities

#### 2. Application Layer
- **File**: `src/lib/features/patient-onboarding/application/patient-onboarding-manager.ts`
- **Purpose**: Business logic and state management
- **Key Features**:
  - Singleton pattern for state management
  - LocalStorage persistence
  - API integration
  - Error recovery

#### 3. Presentation Layer
- **Directory**: `src/lib/features/patient-onboarding/presentation/`
- **Components**: Individual step components + shared shell
- **Context**: `PatientOnboardingContext` for state sharing

#### 4. Service Layer
- **API Client**: `src/lib/services/apiClient.ts`
- **Patient Service**: `src/lib/services/patientService.ts`
- **Configuration**: `src/lib/config/api.ts`

## API Implementation Best Practices

### 1. API Client Configuration

```typescript
// Enhanced configuration for real API integration
const DEFAULT_CONFIG: Required<ApiRequestConfig> = {
  timeout: 10000, // 10 seconds
  retries: 3, // Retry failed requests
  retryDelay: 1000, // 1 second
  showLoading: true,
  showErrorToast: true,
  showSuccessToast: false,
  skipErrorBoundary: false,
};
```

### 2. Error Handling Strategy

#### Error Types
```typescript
type ApiErrorType = 
  | 'validation' 
  | 'network' 
  | 'server' 
  | 'authentication' 
  | 'authorization' 
  | 'not_found' 
  | 'rate_limit';
```

#### Error Recovery Patterns
- **Network Errors**: Retry with exponential backoff
- **Validation Errors**: Show field-specific messages
- **Rate Limiting**: Implement cooldown periods
- **Server Errors**: Graceful degradation with local storage

### 3. API Endpoints Structure

```typescript
// OATRX API Integration
const API_CONFIG = {
  BASE_URL: 'https://cloud.oatrx.ca/api/v1',
  CLINIC_ID: 4,
  ENDPOINTS: {
    SEND_OTP: '/clinic/onboarding/send-otp',
    VERIFY_OTP: '/clinic/onboarding/verify-otp',
    ONBOARDING_PROGRESS: '/clinic/onboarding/progress',
  }
};
```

## Error Handling Implementation

### 1. Component-Level Error Handling

```typescript
// Enhanced error handling with specific error types
const [error, setError] = useState<string | null>(null);

// In your component
try {
  const response = await patientService.sendOtp(phone);
  if (!response.success) {
    // Handle specific error types
    if (response.error?.type === 'validation') {
      setError(`Please check your phone number: ${response.error.message}`);
    } else if (response.error?.type === 'rate_limit') {
      setError('Too many attempts. Please wait a moment before trying again.');
    } else {
      setError(response.message || 'Failed to send OTP');
    }
  }
} catch (err) {
  // Handle different error types
  if (err instanceof Error) {
    if (err.message.includes('Network error')) {
      setError('Network error. Please check your connection and try again.');
    } else if (err.message.includes('timeout')) {
      setError('Request timed out. Please try again.');
    } else {
      setError(err.message);
    }
  } else {
    setError('Failed to send verification code. Please try again.');
  }
}
```

### 2. Error Boundary Implementation

```typescript
// Wrap onboarding components
<OnboardingErrorBoundary 
  stepName="phone"
  onError={(error, errorInfo) => {
    // Log to external service
    console.error('Onboarding error:', error, errorInfo);
  }}
>
  <PatientPhoneStep />
</OnboardingErrorBoundary>
```

### 3. State Recovery

```typescript
// Enhanced state recovery with API error handling
if (response.error?.type === 'network') {
  // For network errors, save locally and continue
  console.warn('Network error during step save, saving locally:', response.error);
  this.state.draft = { ...this.state.draft, ...data };
  this.saveToLocalStorage();
  
  // Still throw the error to let the UI handle it
  throw new Error('Network error. Your data has been saved locally.');
}
```

## Implementation Guidelines

### 1. Creating New Onboarding Steps

#### Step 1: Add to Configuration
```typescript
// In patient-onboarding-config.ts
{
  id: 16,
  name: "newStep",
  title: "New Step Title",
  route: "/onboarding/patient/new-step",
  apiStepName: "NEW_STEP",
  isCompleted: false,
  isAccessible: false,
}
```

#### Step 2: Create Component
```typescript
// In presentation/components/PatientNewStep.tsx
export function PatientNewStep() {
  const { state, saveStep, isLoading } = usePatientOnboarding();
  const [error, setError] = useState<string | null>(null);
  
  const stepData = getStepComponentData("newStep");
  
  const handleSubmit = async (values: FormValues) => {
    try {
      setError(null);
      
      // Save step data locally (no API call needed)
      await saveStep(stepData.stepId, values);
      router.push("/onboarding/patient/next-step");
    } catch (err) {
      console.error('Error saving step:', err);
      setError('Failed to save step. Please try again.');
    }
  };
  
  return (
    <PatientStepShell
      title="Step Title"
      description="Step description"
      onNext={() => form.handleSubmit(handleSubmit)()}
      isSubmitting={isLoading}
    >
      {/* Form content */}
    </PatientStepShell>
  );
}
```

#### Step 3: Add Route
```typescript
// Create page.tsx in appropriate directory
// src/app/(onboarding)/onboarding/patient/new-step/page.tsx
```

### 2. API Integration Patterns

#### Standard Step Saving Pattern
```typescript
const handleStepSave = async (data: any) => {
  try {
    setError(null);
    setIsLoading(true);
    
    // Save step data locally (no API call needed)
    await saveStep(stepId, data);
    router.push(nextRoute);
  } catch (err) {
    // Handle errors
    setError('Failed to save step. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

#### OTP-Specific Pattern
```typescript
// For OTP operations, both sendOtp and verifyOtp make real API calls
const otpResponse = await patientService.sendOtp(phone);

if (otpResponse.success) {
  // Handle success
  await saveStep(stepId, data);
  router.push(nextRoute);
} else {
  // Handle API errors
  setError(otpResponse.message || 'Failed to send OTP');
}

// verifyOtp makes real API call to /clinic/onboarding/verify-otp
const verifyResponse = await patientService.verifyOtp(phone, code);

if (verifyResponse.success) {
  // Call progress API to get current step after successful OTP verification
  const progressResponse = await patientService.getOnboardingProgress(phone);
  
  if (progressResponse.success) {
    // Save verification and progress data, navigate to current step
    await saveStep(stepId, {
      otpVerified: true,
      otpVerifiedAt: verifyResponse.data.otp_verified_at,
      currentStep: progressResponse.data.current_step,
      status: progressResponse.data.status,
      guestPatientId: progressResponse.data.guest_patient_id,
      appointmentId: progressResponse.data.appointment_id,
    });
    
    const nextRoute = getRouteFromApiStep(progressResponse.data.current_step);
    router.push(nextRoute);
  } else {
    // Fallback to verification response data
    await saveStep(stepId, {
      otpVerified: true,
      otpVerifiedAt: verifyResponse.data.otp_verified_at,
      currentStep: verifyResponse.data.current_step,
      status: verifyResponse.data.status,
      guestPatientId: verifyResponse.data.guest_patient_id,
    });
    
    const nextRoute = getRouteFromApiStep(verifyResponse.data.current_step);
    router.push(nextRoute);
  }
} else {
  // Handle verification errors
  setError(verifyResponse.message || 'OTP verification failed');
}
```

### 3. Progress API Integration

#### Progress API Call Pattern
```typescript
// After successful OTP verification, call progress API
const progressResponse = await patientService.getOnboardingProgress(phone);

if (progressResponse.success) {
  // Use current_step from progress API for navigation
  const currentStep = progressResponse.data.current_step;
  const nextRoute = getRouteFromApiStep(currentStep);
  router.push(nextRoute);
} else {
  // Handle progress API errors with fallback
  console.error('Progress API failed:', progressResponse.message);
}
```

#### Progress API Request Structure
```typescript
GET /clinic/onboarding/progress?clinic_id=4&phone=+919924237880
```

#### Progress API Response Structure
```json
{
  "success": true,
  "message": "Onboarding progress retrieved successfully.",
  "data": {
    "clinic_id": 4,
    "phone": "+919924237880",
    "current_step": "health_card",
    "status": "in_progress",
    "otp_verified_at": "2025-09-18T03:23:35-07:00",
    "state": {
      "contact": {
        "phone": "+919924237880"
      },
      "otp_verified_at": "2025-09-18T03:23:35-07:00"
    },
    "guest_patient_id": null,
    "appointment_id": null
  }
}
```

### 4. Error Handling Patterns

#### Simple Error Handling
```typescript
// All errors are handled the same way - show message and allow retry
if (!response.success) {
  setError(response.message || 'Failed to save step');
}
```

#### Validation Error Handling
```typescript
// Form validation is handled by React Hook Form + Zod
// API validation errors are shown as simple messages
if (response.error?.type === 'validation') {
  setError(`Please check your input: ${response.error.message}`);
}
```

#### Network Error Handling
```typescript
// Network errors are handled by try-catch
catch (err) {
  setError('Network error. Please check your connection and try again.');
}
```

## Testing Guidelines

### 1. Unit Testing
```typescript
// Test API client error handling
describe('ApiClient', () => {
  it('should retry on network errors', async () => {
    // Mock network failure
    // Verify retry logic
  });
  
  it('should handle validation errors', async () => {
    // Mock validation error response
    // Verify error transformation
  });
});
```

### 2. Integration Testing
```typescript
// Test onboarding flow
describe('Patient Onboarding', () => {
  it('should complete full flow', async () => {
    // Test each step
    // Verify state persistence
    // Check error recovery
  });
});
```

### 3. Error Scenario Testing
```typescript
// Test error boundaries
describe('Error Boundaries', () => {
  it('should catch component errors', () => {
    // Trigger component error
    // Verify error boundary activation
  });
});
```

## Monitoring and Logging

### 1. Error Tracking
```typescript
// In production, integrate with error tracking service
if (process.env.NODE_ENV === "production") {
  // Sentry.captureException(error, {
  //   extra: errorInfo,
  //   tags: {
  //     component: 'OnboardingErrorBoundary',
  //     step: stepName
  //   }
  // });
}
```

### 2. Performance Monitoring
```typescript
// Track API response times
const startTime = Date.now();
const response = await apiClient.post(endpoint, data);
const duration = Date.now() - startTime;

// Log slow requests
if (duration > 5000) {
  console.warn(`Slow API request: ${endpoint} took ${duration}ms`);
}
```

## Security Considerations

### 1. Data Validation
- Always validate input on both client and server
- Sanitize user input before API calls
- Use TypeScript for type safety

### 2. Error Information
- Don't expose sensitive information in error messages
- Log detailed errors server-side only
- Show user-friendly messages to clients

### 3. Rate Limiting
- Implement client-side rate limiting for OTP requests
- Respect server-side rate limits
- Provide clear feedback to users

## Maintenance Guidelines

### 1. Regular Updates
- Update API endpoints when backend changes
- Review error handling patterns quarterly
- Update retry logic based on performance data

### 2. Code Review Checklist
- [ ] Proper error handling implemented
- [ ] Loading states managed correctly
- [ ] User feedback provided for all scenarios
- [ ] State persistence working
- [ ] Error boundaries in place
- [ ] TypeScript types defined
- [ ] Tests written for new functionality

### 3. Performance Optimization
- Monitor API response times
- Optimize retry logic based on error patterns
- Implement request caching where appropriate
- Use React.memo for expensive components

## Common Pitfalls to Avoid

1. **Not handling network errors gracefully**
2. **Exposing sensitive error information**
3. **Not implementing proper loading states**
4. **Forgetting to persist state on errors**
5. **Not testing error scenarios**
6. **Inconsistent error message formatting**
7. **Not implementing proper retry logic**
8. **Missing error boundaries**

## Conclusion

This implementation guide provides a comprehensive framework for building robust patient onboarding flows with proper API integration and error handling. Follow these patterns consistently across all components to ensure a reliable and user-friendly experience.

For questions or clarifications, refer to the existing codebase examples or consult the development team.
