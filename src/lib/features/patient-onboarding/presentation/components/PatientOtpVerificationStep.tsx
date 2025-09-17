"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormInput } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

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
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  
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
    try {
      console.log("OTP submitted:", values);
      
      // Save OTP verification to centralized state
      const result = await saveStep(stepData.stepId, {
        otpVerified: true,
        otp: values.otp,
      });
      
      // Navigate to health card step
      router.push("/onboarding/patient/health-card");
    } catch (error) {
      console.error("Error verifying OTP:", error);
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
    // Navigate back to phone step
    router.push("/onboarding/patient/phone");
  };

  const handleResendOtp = () => {
    console.log("Resending OTP...");
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
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((2 / 15) * 100)}
      currentStep={2}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="max-w-xl mx-auto space-y-6">
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
                disabled={countdown > 0}
                className="text-sm text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
              </button>
            </div>
          </div>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
