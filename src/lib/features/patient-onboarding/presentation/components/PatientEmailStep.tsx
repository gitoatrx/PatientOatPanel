"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormInput } from "@/components/ui/form-input";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";
import { getRouteFromApiStep } from "@/lib/config/api";
import { useEnterKey } from "@/lib/hooks/useEnterKey";
import Image from "next/image";

const emailSchema = z.object({
  email: z
    .string()
    .optional()
    .refine((val) => {
      // If email is provided, it must be valid
      if (val && val.trim().length > 0) {
        return z.string().email().safeParse(val).success;
      }
      // Empty email is allowed (optional)
      return true;
    }, "Please enter a valid email address"),
});

type FormValues = z.infer<typeof emailSchema>;

export function PatientEmailStep() {
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [hasExistingEmail, setHasExistingEmail] = useState(false);
  
  // Get step configuration
  const stepData = getStepComponentData("email");

  // Get phone number from localStorage and fetch progress data
  React.useEffect(() => {
    const savedPhone = localStorage.getItem('patient-phone-number');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      fetchProgressAndPrefillForm(savedPhone);
    } else {
      setIsLoadingProgress(false);
    }
  }, []);

  const fetchProgressAndPrefillForm = async (phone: string) => {
    try {
      setIsLoadingProgress(true);
      const progressResponse = await patientService.getOnboardingProgress(phone);

      if (progressResponse.success) {
        const state = progressResponse.data?.state;
        // Prefer explicit personal_info.email, then contact.email, then health_card.email_address
        const email = state?.personal_info?.email
          || state?.contact?.email
          || state?.health_card?.email_address
          || "";

        if (email && email.trim().length > 0) {
          setHasExistingEmail(true);
          form.setValue('email', email);
        } else {
          setHasExistingEmail(false);
        }
      } else {
        setHasExistingEmail(false);
      }
    } catch (error) {
      console.error('Error fetching progress for prefill:', error);
      setHasExistingEmail(false);
    } finally {
      setIsLoadingProgress(false);
    }
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(emailSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { 
      email: "" 
    },
  });

  // Form prefilling is now handled by fetchProgressAndPrefillForm

  const handleSubmit = async (values: FormValues) => {
    if (!phoneNumber) {
      console.error("No phone number found");
      return;
    }

    try {
      setError(null);
      
      // Prepare email data for API - handle empty/optional email
      const emailData = {
        email: values.email?.trim() || "", // Convert empty/null to empty string for API
      };
      
      let apiResponse;
      try {
        // Call personal info step 4 API
        apiResponse = await patientService.savePersonalInfoStep4(phoneNumber, emailData);
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
        
        // Navigate to next step based on API response (no success toast)
        const nextStep = apiResponse.data.current_step;
        const nextRoute = getRouteFromApiStep(nextStep);
        router.push(nextRoute);
      } else {
        // Handle API error response
        const errorMessage = apiResponse.message || "Failed to save email information";
        
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
    // Navigate back to date of birth step
    router.push("/onboarding/patient/date-of-birth");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  // Show loading state while fetching progress data
  if (isLoadingProgress) {
    return (
      <PatientStepShell
        title="Loading..."
        description="Loading your information..."
        progressPercent={Math.round((7 / 15) * 100)}
        currentStep={7}
        totalSteps={15}
        useCard={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Image
              src="/loading.svg"
              alt="Loading"
              width={48}
              height={48}
              className="mx-auto mb-2"
            />
            <p className="text-sm text-muted-foreground">Loading your information...</p>
          </div>
        </div>
      </PatientStepShell>
    );
  }

  return (
    <PatientStepShell
      title={hasExistingEmail ? "Confirm your email address" : "What is your email address?"}
      description={hasExistingEmail ? "We have this on file. Update it if it has changed." : "We'll use this to send appointment confirmations and important updates. (Optional)"}
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
      isSubmitting={form.formState.isSubmitting}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((7 / 15) * 100)}
      currentStep={7}
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
          
          <FormInput
            name="email"
            type="email"
            label="Email Address (Optional)"
            placeholder="your.email@example.com"
            autoComplete="email"
          />
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
