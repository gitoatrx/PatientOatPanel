"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormInput } from "@/components/ui/form-input";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
// import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";
import { getRouteFromApiStep } from "@/lib/config/api";
import { RadioOptionSkeleton } from "@/components/ui/skeleton-loaders";

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
  const { isLoading, state } = usePatientOnboarding();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState<boolean>(true);
  
  // Get step configuration (unused but kept for consistency)
  // const stepData = getStepComponentData("healthCard");

  const form = useForm<FormValues>({
    resolver: zodResolver(healthCardSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { 
      hasHealthCard: "", 
      healthCardNumber: "" 
    },
  });

  const fetchProgressAndPrefillForm = useCallback(async (phone: string) => {
    try {
      setIsLoadingProgress(true);
      const progressResponse = await patientService.getOnboardingProgress(phone);
      
      if (progressResponse.success && progressResponse.data?.state?.health_card) {
        const healthCardData = progressResponse.data.state.health_card;
        console.log('Prefilling health card form with:', healthCardData);
        
        // Prefill form with existing data
        if (healthCardData.health_card_number) {
          form.setValue('hasHealthCard', 'yes');
          form.setValue('healthCardNumber', healthCardData.health_card_number);
        } else {
          form.setValue('hasHealthCard', 'no');
        }
      } else {
        console.log('No existing health card data found, using default values');
        // Set default values if no existing data
        form.setValue('hasHealthCard', '');
        form.setValue('healthCardNumber', '');
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
      // Set default values on error
      form.setValue('hasHealthCard', '');
      form.setValue('healthCardNumber', '');
    } finally {
      setIsLoadingProgress(false);
    }
  }, [form]);

  // Get phone number from localStorage and fetch progress data
  React.useEffect(() => {
    const savedPhone = localStorage.getItem('patient-phone-number');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      fetchProgressAndPrefillForm(savedPhone);
    } else {
      setIsLoadingProgress(false);
    }
  }, [fetchProgressAndPrefillForm]);

  // Reset form values when state updates (after API call)
  useEffect(() => {
    if (state?.draft) {
      form.reset({
        hasHealthCard: (state.draft.hasHealthCard as string) || "",
        healthCardNumber: (state.draft.healthCardNumber as string) || "",
      });
      console.log("PatientHealthCardStep: Form reset with state data:", {
        hasHealthCard: state.draft.hasHealthCard,
        healthCardNumber: state.draft.healthCardNumber,
      });
    }
  }, [state?.draft, form]);

  const handleSubmit = async (values: FormValues) => {
    if (!phoneNumber) {
      console.error("No phone number found");
      return;
    }

    try {
      setError(null);
      console.log("Health card submitted:", values);
      
      // Determine health card number - send empty string if no health card, otherwise send the number
      const healthCardNumber = values.hasHealthCard === "yes" ? values.healthCardNumber : "";
      
      console.log("Health card values:", values);
      console.log("hasHealthCard:", values.hasHealthCard);
      console.log("healthCardNumber from form:", values.healthCardNumber);
      console.log("Final healthCardNumber to send:", healthCardNumber);
      console.log("healthCardNumber type:", typeof healthCardNumber);
      
      let apiResponse;
      try {
        // Call health card API
        apiResponse = await patientService.saveHealthCard(phoneNumber, healthCardNumber);
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
      
      if (apiResponse.success) {
        console.log("Health card saved successfully:", apiResponse);
        
        try {
          // Navigate to next step based on API response (no success toast)
          const nextStep = apiResponse.data.current_step;
          const nextRoute = getRouteFromApiStep(nextStep);
          console.log(`Health card API response:`, apiResponse);
          console.log(`Next step from API: ${nextStep}`);
          console.log(`Mapped route: ${nextRoute}`);
          console.log(`Navigating to: ${nextRoute}`);
          router.push(nextRoute);
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
        // Handle API error response
        const errorMessage = apiResponse.message || "Failed to save health card";
        
        // Show error toast IMMEDIATELY
        toast({
          variant: "error",
          title: "Save Failed",
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

  // Show loading state while fetching progress data
  if (isLoadingProgress) {
    return (
      <PatientStepShell
        title="Do you have a health card?"
        description="This helps us process your appointments and insurance claims."
        onBack={handleBack}
        onNext={async () => {}}
        nextLabel="Continue"
        isSubmitting={true}
        isNextDisabled={true}
        useCard={false}
        progressPercent={Math.round((3 / 15) * 100)}
      >
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-6">Loading your information...</p>
          </div>
          
          {/* Health Card Options Skeleton */}
          <div className="space-y-3">
            <RadioOptionSkeleton />
            <RadioOptionSkeleton />
          </div>
        </div>
      </PatientStepShell>
    );
  }

  return (
    <PatientStepShell
      title="Do you have a health card?"
      description="This helps us process your appointments and insurance claims."
      onBack={handleBack}
      onNext={async () => {
        try {
          await form.handleSubmit(handleSubmit)();
        } catch (error) {
          // Error is already handled in handleSubmit, just re-throw for PatientStepShell
          throw error;
        }
      }}
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
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}
          
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
