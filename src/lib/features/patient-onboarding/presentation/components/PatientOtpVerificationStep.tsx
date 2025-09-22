"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormInput } from "@/components/ui";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";
import { getRouteFromApiStep } from "@/lib/config/api";
import { getFormattedPhoneFromStorage } from "@/lib/constants/country-codes";
// Removed unused imports for progress API

const otpSchema = z.object({
  otp: z
    .string()
    .min(1, "OTP is required")
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

type FormValues = z.infer<typeof otpSchema>;

export function PatientOtpVerificationStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Get step configuration with error handling
  let stepData;
  try {
    stepData = getStepComponentData("verifyOtp");
  } catch (error) {
    console.error("PatientOtpVerificationStep: Error loading step data:", error);
    stepData = {
      stepId: 2,
      stepName: "verifyOtp",
      stepTitle: "Verify OTP",
      stepRoute: "/onboarding/patient/verify-otp",
      apiStepName: "VERIFY_OTP",
      progressPercent: Math.round((2 / 15) * 100),
      currentStep: 2,
      totalSteps: 15,
      isAccessible: true,
    };
  }


  const form = useForm<FormValues>({
    resolver: zodResolver(otpSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    try {

      // Get phone number from context state first
      if (state?.draft?.phone) {
        setPhoneNumber(state.draft.phone as string);
      } else {

        // First try to get phone number from direct localStorage key with proper formatting
        try {
          const directPhoneNumber = getFormattedPhoneFromStorage();
          if (directPhoneNumber) {
            setPhoneNumber(directPhoneNumber);
            // No fallback to patient-onboarding-state - using direct localStorage only
          }
        } catch (error) {
          console.error("Error loading phone number from localStorage:", error);
        }
      }

      // Mark as initialized
      setIsInitialized(true);
    } catch (error) {
      console.error("PatientOtpVerificationStep: Error during initialization:", error);
      setError("Failed to initialize OTP verification. Please refresh the page.");
      setIsInitialized(true); // Still mark as initialized to show error
    }
  }, [state]);

  const handleSubmit = async (values: FormValues) => {
    if (!phoneNumber) {
      console.error("No phone number found");
      const errorMessage = "Phone number not found. Please go back and enter your phone number again.";
      setError(errorMessage);
      toast({
        variant: "error",
        title: "Phone Number Missing",
        description: errorMessage,
      });
      return;
    }

    // Prevent multiple API calls
    if (isVerifying) {
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      // Show immediate feedback that verification is in progress

      let verifyResponse;
      try {
        // Verify OTP with API
        verifyResponse = await patientService.verifyOtp(phoneNumber, values.otp);
      } catch (apiError) {
        console.error('API call failed:', apiError);
        const errorMessage = 'Network error. Please check your connection and try again.';

        // Show error toast IMMEDIATELY
        toast({
          variant: "error",
          title: "Network Error",
          description: errorMessage,
        });

        // Set error state after toast
        setError(errorMessage);
        return;
      }

      if (verifyResponse.success) {

        // Save OTP verification status to localStorage
        localStorage.setItem('patient-otp-verified', 'true');
        localStorage.setItem('patient-otp-verified-at', new Date().toISOString());

        // Show success toast
        toast({
          variant: "success",
          title: "Verification Complete!",
          description: "Your phone number has been verified",
        });

        // Call progress API to get the current step where user left off
        try {
          const progressResponse = await patientService.getOnboardingProgress(phoneNumber);

          if (progressResponse.success && progressResponse.data) {
            const currentStep = progressResponse.data.current_step;

            // Navigate to the step where user left off using centralized mapping
            if (currentStep && currentStep !== 'phone' && currentStep !== 'verify-otp') {
              const targetRoute = getRouteFromApiStep(currentStep);

              // Special handling for completed step
              if (currentStep === 'completed') {
                router.push("/onboarding/patient/confirmation");
              } else {
                router.push(targetRoute);
              }
            } else {
              // If no valid current step, go to health card as default
              router.push("/onboarding/patient/health-card");
            }
          } else {
            console.error("Progress API failed, defaulting to health card step");
            router.push("/onboarding/patient/health-card");
          }
        } catch (progressError) {
          console.error("Error fetching progress, defaulting to health card step:", progressError);
          router.push("/onboarding/patient/health-card");
        }
      } else {
        // Handle specific error types based on response message
        let errorMessage = '';
        let errorTitle = 'Verification Failed';

        if (verifyResponse.message?.includes('Invalid') || verifyResponse.message?.includes('incorrect')) {
          errorMessage = 'Invalid verification code. Please check and try again.';
          errorTitle = 'Invalid Code';
        } else if (verifyResponse.message?.includes('expired')) {
          errorMessage = 'Verification code has expired. Please request a new one.';
          errorTitle = 'Code Expired';
        } else if (verifyResponse.message?.includes('rate limit') || verifyResponse.message?.includes('too many')) {
          errorMessage = 'Too many attempts. Please wait a moment before trying again.';
          errorTitle = 'Too Many Attempts';
        } else {
          errorMessage = verifyResponse.message || "OTP verification failed";
          errorTitle = 'Verification Failed';
        }

        // Show error toast IMMEDIATELY
        toast({
          variant: "error",
          title: errorTitle,
          description: errorMessage,
        });

        // Set error state after toast
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Unexpected error in handleSubmit:', err);

      // Handle different error types
      let errorMessage = '';
      let errorTitle = 'Unexpected Error';

      if (err instanceof Error) {
        if (err.message.includes('Network error')) {
          errorMessage = 'Network error. Please check your connection and try again.';
          errorTitle = 'Network Error';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
          errorTitle = 'Request Timeout';
        } else {
          errorMessage = `Error: ${err.message}`;
          errorTitle = 'Error';
        }
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
        errorTitle = 'Unexpected Error';
      }

      // Show error toast IMMEDIATELY
      toast({
        variant: "error",
        title: errorTitle,
        description: errorMessage,
      });

      // Set error state after toast
      setError(errorMessage);
    } finally {
      // Always reset the verifying state
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    // Navigate back to phone step
    router.push("/onboarding/patient/phone");
  };

  const handleResendOtp = async () => {
    if (!phoneNumber) {
      console.error("No phone number found for resending OTP");
      const errorMessage = "Phone number not found. Please go back and enter your phone number again.";
      setError(errorMessage);
      toast({
        variant: "error",
        title: "Phone Number Missing",
        description: errorMessage,
      });
      return;
    }

    // Prevent multiple resend calls
    if (isVerifying) {
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      // Resend OTP
      const response = await patientService.sendOtp(phoneNumber);

      if (response.success) {
        // Show success toast
        toast({
          variant: "success",
          title: "Code Sent!",
          description: "A new verification code has been sent to your phone.",
        });

        // Start countdown timer
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        const errorMessage = response.message || 'Failed to resend code';

        // Show error toast IMMEDIATELY
        toast({
          variant: "error",
          title: "Resend Failed",
          description: errorMessage,
        });

        // Set error state after toast
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error resending OTP:', err);
      const errorMessage = 'Failed to resend code. Please try again.';

      // Show error toast IMMEDIATELY
      toast({
        variant: "error",
        title: "Resend Failed",
        description: errorMessage,
      });

      // Set error state after toast
      setError(errorMessage);
    } finally {
      // Always reset the verifying state
      setIsVerifying(false);
    }
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  // Early return for critical errors
  if (!stepData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Configuration Error</h1>
          <p className="text-muted-foreground mb-4">Failed to load step configuration</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <PatientStepShell
        title="Loading..."
        description="Initializing OTP verification..."
        useCard={false}
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PatientStepShell>
    );
  }

  // Show error state if initialization failed
  if (error && !phoneNumber) {
    return (
      <PatientStepShell
        title="Error"
        description="Failed to load OTP verification"
        useCard={false}
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
      >
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Refresh page
          </button>
        </div>
      </PatientStepShell>
    );
  }

  return (
    <PatientStepShell
      title="Verify your phone number"
      description={`We sent a 6-digit code to ${phoneNumber || 'your phone'}. Please enter it below.`}
      onBack={handleBack}
      onNext={async () => {
        try {
          await form.handleSubmit(handleSubmit)();
        } catch (error) {
          // Error is already handled in handleSubmit, just re-throw for PatientStepShell
          throw error;
        }
      }}
      nextLabel="Verify & Continue"
      isSubmitting={isVerifying}
      isNextDisabled={!isValid || isVerifying}
      useCard={false}
      progressPercent={stepData.progressPercent}
      currentStep={stepData.currentStep}
      totalSteps={stepData.totalSteps}
    >
      <FormProvider {...form}>
        <div className="max-w-xl mx-auto space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <FormInput
              name="otp"
              type="text"
              label="Enter 6-digit code"
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isVerifying}
                className="text-sm text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
              </button>
            </div>
          </div>

          {/* Info message */}
          <div className="text-sm text-muted-foreground text-center">
            Didn&apos;t receive the code? Check your SMS messages or try resending.
          </div>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
