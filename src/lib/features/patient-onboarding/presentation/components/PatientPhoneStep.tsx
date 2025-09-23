"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormPhoneInput } from "@/components/ui";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";
import { useState } from "react";
import { formatPhoneWithCountryCode } from "@/lib/constants/country-codes";

const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .min(10, "Please enter a valid phone number (at least 10 digits)")
    .refine(
      (val) => {
        // Remove all non-digit characters
        const digits = val.replace(/\D/g, "");

        // Check if phone number starts with 0
        if (digits.length > 0 && digits[0] === "0") {
          return false;
        }

        return true;
      },
      {
        message: "Phone number cannot start with 0",
      },
    )
    .refine(
      (val) => {
        // Remove all non-digit characters
        const digits = val.replace(/\D/g, "");

        // Check if all digits are the same (e.g., 0000000000, 1111111111)
        if (digits.length > 0) {
          const firstDigit = digits[0];
          const allSameDigits = digits
            .split("")
            .every((digit) => digit === firstDigit);
          if (allSameDigits) {
            return false;
          }
        }

        // Check for common invalid patterns
        const invalidPatterns = [
          /^0+$/, // All zeros
          /^1+$/, // All ones
          /^2+$/, // All twos
          /^3+$/, // All threes
          /^4+$/, // All fours
          /^5+$/, // All fives
          /^6+$/, // All sixes
          /^7+$/, // All sevens
          /^8+$/, // All eights
          /^9+$/, // All nines
        ];

        return !invalidPatterns.some((pattern) => pattern.test(digits));
      },
      {
        message:
          "Please enter a valid phone number (cannot be all the same digits)",
      },
    )
    .refine(
      (val) => {
        // Additional validation for common invalid sequences
        const digits = val.replace(/\D/g, "");

        // Check for sequential patterns (e.g., 1234567890, 9876543210)
        if (digits.length >= 10) {
          const isSequential =
            digits === "1234567890" || digits === "0987654321";
          if (isSequential) {
            return false;
          }
        }

        return true;
      },
      {
        message:
          "Please enter a valid phone number (cannot be sequential numbers)",
      },
    ),
});

type FormValues = z.infer<typeof phoneSchema>;

export function PatientPhoneStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();
  const [error, setError] = useState<string | null>(null);

  // Get step configuration
  const stepData = getStepComponentData("phone");

  const form = useForm<FormValues>({
    resolver: zodResolver(phoneSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      phone: (state?.draft?.phone as string) || ""
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setError(null);

      // Format phone number for API with environment-based country code
      const formattedPhone = formatPhoneWithCountryCode(values.phone);


      // Call OTP API with additional error handling
      let otpResponse;
      try {
        otpResponse = await patientService.sendOtp(formattedPhone);
      } catch (apiError) {
        console.error('API call failed:', apiError);
        setError('Network error. Please check your connection and try again.');
        throw new Error('Network error. Please check your connection and try again.');
      }

      // Always save phone number locally, regardless of OTP API response
      try {

        // Save phone number directly to localStorage for immediate access
        localStorage.setItem('patient-phone-number', formattedPhone);

        // Also save to state through saveStep
        const saveResult = await saveStep(stepData.stepId, {
          phone: formattedPhone,
        });

        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (saveError) {
        console.error('Error saving phone number:', saveError);
        // Continue anyway - we still want to navigate to OTP step
      }

      // Always navigate to OTP verification step, regardless of API response

      if (otpResponse && otpResponse.success) {
        router.push("/onboarding/patient/verify-otp");
      } else {
        // OTP API failed, but we still navigate to OTP step so user can try again
        if (otpResponse) {
          // Log error for debugging but continue navigation
        }
        router.push("/onboarding/patient/verify-otp");
      }
    } catch (err) {
      console.error('Unexpected error in handleSubmit:', err);

      // Handle different error types
      if (err instanceof Error) {
        if (err.message.includes('Network error')) {
          setError('Network error. Please check your connection and try again.');
        } else if (err.message.includes('timeout')) {
          setError('Request timed out. Please try again.');
        } else {
          setError(`Error: ${err.message}`);
        }
        // Re-throw the error so PatientStepShell can catch it and handle animation
        throw err;
      } else {
        const errorMsg = 'An unexpected error occurred. Please try again.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    }
  };

  const handleBack = () => {
    // Navigate back to homepage
    router.push("/");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  return (
    <PatientStepShell
      title="What's your phone number?"
      onBack={handleBack}
      onNext={async () => {
        try {
          await form.handleSubmit(handleSubmit)();
        } catch (error) {
          // Error is already handled in handleSubmit, just re-throw for PatientStepShell
          throw error;
        }
      }}
      nextLabel="Send Verification Code"
      isSubmitting={isLoading}
      isNextDisabled={!isValid || isLoading}
      useCard={false}
      progressPercent={Math.round((1 / 15) * 100)}
      currentStep={1}
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

          <FormPhoneInput
            name="phone"
            type="tel"
            label="Phone Number"
            placeholder="Enter your phone number"
          />
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
