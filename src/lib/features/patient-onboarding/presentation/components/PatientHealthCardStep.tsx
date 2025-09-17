"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormInput } from "@/components/ui/form-input";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

const healthCardSchema = z
  .object({
    hasHealthCard: z.string().min(1, "Please select an option"),
    healthCardNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Only validate healthCardNumber if hasHealthCard is "yes"
    if (data.hasHealthCard === "yes") {
      if (!data.healthCardNumber || data.healthCardNumber.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Health card number is required",
          path: ["healthCardNumber"],
        });
        return;
      }

      if (data.healthCardNumber.length !== 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Health card number must be exactly 10 digits",
          path: ["healthCardNumber"],
        });
        return;
      }

      if (!/^[0-9]+$/.test(data.healthCardNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Health card number must contain only digits",
          path: ["healthCardNumber"],
        });
        return;
      }

      // Check if all digits are the same (e.g., 0000000000, 1111111111)
      const firstDigit = data.healthCardNumber[0];
      const allSameDigits = data.healthCardNumber
        .split("")
        .every((digit) => digit === firstDigit);
      if (allSameDigits) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Please enter a valid health card number (cannot be all the same digits)",
          path: ["healthCardNumber"],
        });
        return;
      }
    }
  });

type FormValues = z.infer<typeof healthCardSchema>;

const healthCardOptions = [
  { value: "yes", label: "Yes, I have a health card" },
  { value: "no", label: "No, I don't have a health card" },
];

export function PatientHealthCardStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();
  
  // Get step configuration
  const stepData = getStepComponentData("healthCard");

  const form = useForm<FormValues>({
    resolver: zodResolver(healthCardSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { 
      hasHealthCard: (state?.draft?.hasHealthCard as string) || "", 
      healthCardNumber: (state?.draft?.healthCardNumber as string) || "" 
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log("Health card submitted:", values);
      
      // Save to centralized state
      const result = await saveStep(stepData.stepId, {
        hasHealthCard: values.hasHealthCard,
        healthCardNumber: values.healthCardNumber,
      });
      
      // Navigate to personal step
      router.push("/onboarding/patient/personal");
    } catch (error) {
      console.error("Error saving health card:", error);
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
    // Navigate back to OTP verification step
    router.push("/onboarding/patient/verify-otp");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });


  const hasHealthCard = form.watch("hasHealthCard");

  const createHealthCardKeyHandler = (e: React.KeyboardEvent) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowUp",
      "ArrowRight",
      "ArrowDown",
    ];

    if (
      allowedKeys.includes(e.key) ||
      (e.ctrlKey && ["a", "c", "v", "x"].includes(e.key))
    ) {
      if (e.key === "Enter") {
        e.preventDefault();
        form.handleSubmit(handleSubmit)();
      }
      return;
    }

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const createHealthCardInputHandler = (
    e: React.FormEvent<HTMLInputElement>,
  ) => {
    const target = e.target as HTMLInputElement;
    target.value = target.value.replace(/[^0-9]/g, "");
  };

  return (
    <PatientStepShell
      title="Do you have a health card?"
      description="This helps us process your appointments and insurance claims."
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((3 / 15) * 100)}
      currentStep={3}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="max-w-xl mx-auto space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {healthCardOptions.map((option) => (
                <label key={option.value} className="cursor-pointer">
                  <input
                    {...form.register("hasHealthCard", {
                      required: "Please select an option",
                    })}
                    type="radio"
                    value={option.value}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors">
                    <div className="w-4 h-4 border-2 border-border rounded-full flex items-center justify-center">
                      {hasHealthCard === option.value && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <span className="text-base font-medium">
                      {option.label}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {hasHealthCard === "yes" && (
              <div className="mt-6">
                <FormInput
                  name="healthCardNumber"
                  label="Health Card Number"
                  placeholder="Enter your 10-digit health card number"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  onKeyDown={createHealthCardKeyHandler}
                  onInput={createHealthCardInputHandler}
                />
              </div>
            )}
          </div>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
