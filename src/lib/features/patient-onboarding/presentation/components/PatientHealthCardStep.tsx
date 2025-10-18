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
import { PhoneUpdateModal } from "@/components/ui/phone-update-modal";
import { ReturningPatientDecisionModal } from "@/components/ui/returning-patient-decision-modal";
import { OnboardingReturningPatientDecision, OnboardingHealthCardPhoneConflict } from "@/lib/types/api";

const healthCardSchema = z
  .object({
    hasHealthCard: z.string().min(1, "Please select an option"),
    healthCardNumber: z.string().optional(),
    emailAddress: z.string().optional(),
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

    // Only validate emailAddress if hasHealthCard is "no" - email is required
    if (data.hasHealthCard === "no") {
      if (!data.emailAddress || data.emailAddress.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email address is required when you don't have a health card",
          path: ["emailAddress"],
        });
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.emailAddress)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid email address",
          path: ["emailAddress"],
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
  const [showPhoneUpdateModal, setShowPhoneUpdateModal] = useState<boolean>(false);
  const [showReturningPatientModal, setShowReturningPatientModal] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ nextStep: string; nextRoute: string } | null>(null);
  const [phoneUpdateContext, setPhoneUpdateContext] = useState<{ existing_phone: string; submitted_phone: string } | null>(null);
  const [phoneConflict, setPhoneConflict] = useState<OnboardingHealthCardPhoneConflict | null>(null);
  const [returningPatientDecision, setReturningPatientDecision] = useState<OnboardingReturningPatientDecision | null>(null);
  
  // Get step configuration (unused but kept for consistency)
  // const stepData = getStepComponentData("healthCard");

  const form = useForm<FormValues>({
    resolver: zodResolver(healthCardSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { 
      hasHealthCard: "", 
      healthCardNumber: "",
      emailAddress: ""
    },
  });

  const fetchProgressAndPrefillForm = useCallback(async (phone: string) => {
    try {
      setIsLoadingProgress(true);
      const progressResponse = await patientService.getOnboardingProgress(phone);
      
      if (progressResponse.success && progressResponse.data?.state) {
        const state = progressResponse.data.state;
        const healthCardData = state.health_card;
        
        // Prefill form with existing data
        if (healthCardData?.health_card_number) {
          // User has a health card
          form.setValue('hasHealthCard', 'yes');
          form.setValue('healthCardNumber', healthCardData.health_card_number);
          form.setValue('emailAddress', '');
        } else if (healthCardData?.no_health_card === true || !healthCardData?.health_card_number) {
          // User doesn't have a health card
          form.setValue('hasHealthCard', 'no');
          form.setValue('healthCardNumber', '');
          // Prefill email from personal_info.email if available
          if (state.personal_info?.email) {
            form.setValue('emailAddress', state.personal_info.email);
          }
        } else {
          // Set default values if no existing data
          form.setValue('hasHealthCard', '');
          form.setValue('healthCardNumber', '');
          form.setValue('emailAddress', '');
        }
      } else {
        // Set default values if no existing data
        form.setValue('hasHealthCard', '');
        form.setValue('healthCardNumber', '');
        form.setValue('emailAddress', '');
      }

      // Check for returning patient decision in the progress response
      // COMMENTED OUT FOR NOW - returning patient popup
      // if (progressResponse.data.returning_patient_decision) {
      //   setReturningPatientDecision(progressResponse.data.returning_patient_decision);
      //   setShowReturningPatientModal(true);
      // }
    } catch (error) {
      console.error('Error fetching progress data:', error);
      // Set default values on error
      form.setValue('hasHealthCard', '');
      form.setValue('healthCardNumber', '');
      form.setValue('emailAddress', '');
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
        emailAddress: (state.draft.emailAddress as string) || "",
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
      
      // Determine health card number - send empty string if no health card, otherwise send the number
      const healthCardNumber = values.hasHealthCard === "yes" ? values.healthCardNumber : "";
      
      // Determine email address - send empty string if user has health card, otherwise send the email
      const emailAddress = values.hasHealthCard === "no" ? values.emailAddress : "";
      
      let apiResponse;
      try {
        // Call health card API
        apiResponse = await patientService.saveHealthCard(phoneNumber, healthCardNumber, undefined, emailAddress);
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
        // Handle returning patient decision first
        // COMMENTED OUT FOR NOW - returning patient popup
        // if (apiResponse.data.returning_patient_decision) {
        //   setReturningPatientDecision(apiResponse.data.returning_patient_decision);
        //   setShowReturningPatientModal(true);
        //   return;
        // }

        // Check for phone conflict (new structure)
        const phoneConflictData = apiResponse.data.state?.health_card?.phone_conflict;
        if (phoneConflictData && phoneConflictData.requires_confirmation) {
          setPhoneConflict(phoneConflictData);
          
          // Store the navigation info
          const nextStep = apiResponse.data.current_step;
          const nextRoute = getRouteFromApiStep(nextStep);
          setPendingNavigation({ nextStep, nextRoute });
          
          // Set phone update context from phone conflict data
          setPhoneUpdateContext({
            existing_phone: phoneConflictData.clinic_patient_phone || '',
            submitted_phone: phoneConflictData.otp_phone || '',
          });
          
          setShowPhoneUpdateModal(true);
          return;
        }

        // Legacy phone update handling (backward compatibility)
        if (apiResponse.data.phone_update_required) {
          // Store the navigation info and phone update context, then show modal
          const nextStep = apiResponse.data.current_step;
          const nextRoute = getRouteFromApiStep(nextStep);
          setPendingNavigation({ nextStep, nextRoute });
          
          // Set phone update context if available
          if (apiResponse.data.phone_update_context) {
            setPhoneUpdateContext(apiResponse.data.phone_update_context);
          }
          
          setShowPhoneUpdateModal(true);
          return;
        }

        // Navigate to next step normally
        try {
          const nextStep = apiResponse.data.current_step;
          const nextRoute = getRouteFromApiStep(nextStep);
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
    // Navigate back to OTP verification step
    router.push("/onboarding/patient/verify-otp");
  };

  const handlePhoneUpdated = async (selectedPhone: string) => {
    // Determine if user wants to update primary phone (use new number) or keep existing
    const updatePrimaryPhone = selectedPhone === (phoneUpdateContext?.submitted_phone || phoneNumber);
    
    try {
      setError(null);
      
      // Get the current form values
      const formValues = form.getValues();
      const healthCardNumber = formValues.hasHealthCard === "yes" ? formValues.healthCardNumber : "";
      const emailAddress = formValues.hasHealthCard === "no" ? formValues.emailAddress : "";
      
      // Resend health card API with update_primary_phone flag
      const apiResponse = await patientService.saveHealthCard(phoneNumber, healthCardNumber, updatePrimaryPhone, emailAddress);
      
      if (apiResponse.success) {
        // Close phone update modal
        setShowPhoneUpdateModal(false);
        setPhoneUpdateContext(null);
        setPhoneConflict(null);
        
        // Check for returning patient decision after phone update
        // COMMENTED OUT FOR NOW - returning patient popup
        // if (apiResponse.data.returning_patient_decision) {
        //   setReturningPatientDecision(apiResponse.data.returning_patient_decision);
        //   setShowReturningPatientModal(true);
        //   return;
        // }
        
        // Navigate to next step
        const nextStep = apiResponse.data.current_step;
        const nextRoute = getRouteFromApiStep(nextStep);
        router.push(nextRoute);
      } else {
        setError(apiResponse.message || "Failed to update phone number");
      }
    } catch (error) {
      console.error('Error updating phone:', error);
      setError("Network error. Please check your connection and try again.");
    }
  };

  const handleSkipPhoneUpdate = async () => {
    // User chose to keep existing phone (update_primary_phone: false)
    await handlePhoneUpdated(phoneUpdateContext?.existing_phone || phoneNumber);
  };

  const handleClosePhoneUpdateModal = () => {
    setShowPhoneUpdateModal(false);
    setPendingNavigation(null);
    setPhoneUpdateContext(null);
  };

  const handleReturningPatientAction = async (action: 'start_new' | 'reschedule' | 'manage') => {
    try {
      setError(null);
      
      // Get the current form values
      const formValues = form.getValues();
      const healthCardNumber = formValues.hasHealthCard === "yes" ? formValues.healthCardNumber : "";
      const emailAddress = formValues.hasHealthCard === "no" ? formValues.emailAddress : "";
      
      // Resend health card API - the backend should handle the returning patient decision
      const apiResponse = await patientService.saveHealthCard(phoneNumber, healthCardNumber, undefined, emailAddress);
      
      if (apiResponse.success) {
        // Close the modal and clear state
        setShowReturningPatientModal(false);
        setReturningPatientDecision(null);
        
        // Check if there are still phone conflicts or other issues
        const phoneConflictData = apiResponse.data.state?.health_card?.phone_conflict;
        if (phoneConflictData && phoneConflictData.requires_confirmation) {
          setPhoneConflict(phoneConflictData);
          setPhoneUpdateContext({
            existing_phone: phoneConflictData.clinic_patient_phone || '',
            submitted_phone: phoneConflictData.otp_phone || '',
          });
          setShowPhoneUpdateModal(true);
          return;
        }
        
        // Navigate to next step
        const nextStep = apiResponse.data.current_step;
        const nextRoute = getRouteFromApiStep(nextStep);
        router.push(nextRoute);
      } else {
        setError(apiResponse.message || "Failed to process returning patient decision");
      }
    } catch (error) {
      console.error('Error handling returning patient action:', error);
      setError("Network error. Please check your connection and try again.");
    }
  };

  const handleCloseReturningPatientModal = () => {
    setShowReturningPatientModal(false);
    setReturningPatientDecision(null);
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

            {hasHealthCard === "no" && (
              <div className="mt-6">
                <FormInput
                  name="emailAddress"
                  label="What is your email address?"
                  placeholder="Enter your email address"
                  type="email"
                  inputMode="email"
                />
              </div>
            )}
          </div>
        </div>
      </FormProvider>

      {/* Phone Update Modal */}
      <PhoneUpdateModal
        isOpen={showPhoneUpdateModal}
        onClose={handleClosePhoneUpdateModal}
        onPhoneUpdated={handlePhoneUpdated}
        onSkip={handleSkipPhoneUpdate}
        currentPhone={phoneNumber}
        phoneUpdateContext={phoneUpdateContext || undefined}
      />

      {/* Returning Patient Decision Modal */}
      {/* COMMENTED OUT FOR NOW - returning patient popup */}
      {/* {returningPatientDecision && (
        <ReturningPatientDecisionModal
          isOpen={showReturningPatientModal}
          onClose={handleCloseReturningPatientModal}
          onAction={handleReturningPatientAction}
          decision={returningPatientDecision}
        />
      )} */}
    </PatientStepShell>
  );
}
