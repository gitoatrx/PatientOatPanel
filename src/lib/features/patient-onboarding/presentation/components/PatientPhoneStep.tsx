"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormPhoneInput } from "@/components/ui";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .min(10, "Please enter a valid phone number (at least 10 digits)")
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
      console.log("Phone submitted:", values);
      
      // Save to centralized state
      const result = await saveStep(stepData.stepId, {
        phone: values.phone,
      });
      
      // Navigate to OTP verification step
      router.push("/onboarding/patient/verify-otp");
    } catch (error) {
      console.error("Error saving phone:", error);
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
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
      description="We'll use this to contact you about your appointments."
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((1 / 15) * 100)}
      currentStep={1}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="max-w-xl mx-auto space-y-6">
          <FormPhoneInput
            name="phone"
            type="tel"
            label="Phone Number"
          />
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
