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
  
  // Get step configuration
  const stepData = getStepComponentData("verifyOtp");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(otpSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    // Get phone number from context state
    if (state?.draft?.phone) {
      setPhoneNumber(state.draft.phone as string);
    }
  }, [state]);

  const handleSubmit = async (values: FormValues) => {
    if (!phoneNumber) {
      console.error("No phone number found");
      return;
    }

    try {
      setError(null);
      console.log("Verifying OTP:", values.otp);
      
      // Show immediate feedback that verification is in progress
      console.log("Starting OTP verification...");
      
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
        console.log("OTP verification successful:", verifyResponse);
        
        try {
          // Call progress API to get current step after successful OTP verification
          console.log("Getting onboarding progress after OTP verification...");
          
          let progressResponse;
          try {
            progressResponse = await patientService.getOnboardingProgress(phoneNumber);
          } catch (progressApiError) {
            console.error('Progress API call failed:', progressApiError);
            // Fallback to verification response data if progress API fails
            progressResponse = null;
          }
          
          if (progressResponse && progressResponse.success) {
            console.log("Progress API response:", progressResponse);
            
            // Show success toast
            toast({
              variant: "success",
              title: "Phone Verified Successfully!",
              description: "Your phone number has been verified. Redirecting to next step...",
            });
            
            // Save OTP verification and progress data to centralized state
            await saveStep(stepData.stepId, {
              otpVerified: true,
              otp: values.otp,
              otpVerifiedAt: verifyResponse.data.otp_verified_at,
              currentStep: progressResponse.data.current_step,
              status: progressResponse.data.status,
              guestPatientId: progressResponse.data.guest_patient_id,
              appointmentId: progressResponse.data.appointment_id,
            });
            
            // Navigate to next step based on progress API response
            const nextStep = progressResponse.data.current_step;
            const nextRoute = getRouteFromApiStep(nextStep);
            console.log(`Navigating to step: ${nextStep} -> ${nextRoute}`);
            router.push(nextRoute);
          } else {
            console.error('Progress API failed or unavailable, using verification response:', progressResponse?.message);
            
            // Show success toast for fallback case
            toast({
              variant: "success",
              title: "Phone Verified Successfully!",
              description: "Your phone number has been verified. Continuing to next step...",
            });
            
            // Fallback to verification response data
            await saveStep(stepData.stepId, {
              otpVerified: true,
              otp: values.otp,
              otpVerifiedAt: verifyResponse.data.otp_verified_at,
              currentStep: verifyResponse.data.current_step,
              status: verifyResponse.data.status,
              guestPatientId: verifyResponse.data.guest_patient_id,
            });
            
            const nextStep = verifyResponse.data.current_step;
            const nextRoute = getRouteFromApiStep(nextStep);
            console.log(`Fallback navigation to step: ${nextStep} -> ${nextRoute}`);
            router.push(nextRoute);
          }
        } catch (saveError) {
          console.error('Error saving step:', saveError);
          const errorMessage = 'Failed to save your information. Please try again.';
          
          // Show error toast IMMEDIATELY
          toast({
            variant: "error",
            title: "Save Error",
            description: errorMessage,
          });
          
          // Set error state after toast
          setError(errorMessage);
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
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
    // Navigate back to phone step
    router.push("/onboarding/patient/phone");
  };

  const handleResendOtp = async () => {
    if (!phoneNumber) {
      console.error("No phone number found for resending OTP");
      return;
    }

    try {
      setError(null);
      console.log("Resending OTP to:", phoneNumber);
      
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
    }
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  return (
    <PatientStepShell
      title="Verify your phone number"
      description={`We sent a 6-digit code to ${phoneNumber}. Please enter it below.`}
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Verify & Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isValid || isLoading}
      useCard={false}
      progressPercent={Math.round((2 / 15) * 100)}
      currentStep={2}
      totalSteps={15}
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
                disabled={countdown > 0 || isLoading}
                className="text-sm text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
              </button>
            </div>
          </div>

          {/* Info message */}
          <div className="text-sm text-muted-foreground text-center">
            Didn't receive the code? Check your SMS messages or try resending.
          </div>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
