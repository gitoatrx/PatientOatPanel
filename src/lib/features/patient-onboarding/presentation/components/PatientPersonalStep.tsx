"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormInput } from "@/components/ui/form-input";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";
import { getRouteFromApiStep } from "@/lib/config/api";

const alphaOnly = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
const schema = z.object({
  firstName: z
    .string()
    .min(2, "First name is required")
    .regex(alphaOnly, "Only letters, spaces, hyphens, and apostrophes"),
  lastName: z
    .string()
    .min(2, "Last name is required")
    .regex(alphaOnly, "Only letters, spaces, hyphens, and apostrophes"),
});

type FormValues = z.infer<typeof schema>;

export function PatientPersonalStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // Get step configuration
  const stepData = getStepComponentData("personal");

  // Get phone number from state
  React.useEffect(() => {
    if (state?.draft?.phone) {
      setPhoneNumber(state.draft.phone as string);
    }
  }, [state]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { 
      firstName: (state?.draft?.firstName as string) || "", 
      lastName: (state?.draft?.lastName as string) || "" 
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!phoneNumber) {
      console.error("No phone number found");
      return;
    }

    try {
      setError(null);
      console.log("Personal info submitted:", values);
      
      // Prepare personal data for API
      const personalData = {
        first_name: values.firstName,
        last_name: values.lastName,
      };
      
      let apiResponse;
      try {
        // Call personal info step 1 API
        apiResponse = await patientService.savePersonalInfoStep1(phoneNumber, personalData);
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
        console.log("Personal info saved successfully:", apiResponse);
        
        try {
          // Save to centralized state
          await saveStep(stepData.stepId, {
            firstName: values.firstName,
            lastName: values.lastName,
            currentStep: apiResponse.data.current_step,
            status: apiResponse.data.status,
            guestPatientId: apiResponse.data.guest_patient_id,
            appointmentId: apiResponse.data.appointment_id,
          });
          
          // Navigate to next step based on API response (no success toast)
          const nextStep = apiResponse.data.current_step;
          const nextRoute = getRouteFromApiStep(nextStep);
          console.log(`Personal info API response:`, apiResponse);
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
        const errorMessage = apiResponse.message || "Failed to save personal information";
        
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
    // Navigate back to health card step
    router.push("/onboarding/patient/health-card");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  return (
    <PatientStepShell
      title="Personal Information"
      description="Tell us about yourself"
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((4 / 15) * 100)}
      currentStep={4}
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
            <FormInput
              name="firstName"
              label="First Name"
              placeholder="Enter your first name"
              autoComplete="given-name"
            />

            <FormInput
              name="lastName"
              label="Last Name"
              placeholder="Enter your last name"
              autoComplete="family-name"
            />
          </div>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
