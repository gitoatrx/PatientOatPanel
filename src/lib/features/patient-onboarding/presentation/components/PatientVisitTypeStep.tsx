"use client";

import React, { useState } from "react";
import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEnterKey } from "@/lib/hooks/useEnterKey";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";
import { getRouteFromApiStep } from "@/lib/config/api";

const visitTypeSchema = z.object({
  visitType: z.string().min(1, "Please select a visit type"),
});

type FormValues = z.infer<typeof visitTypeSchema>;

const visitTypeOptions = [
  {
    value: "InPerson",
    label: "In-person visit",
    description: "Visit our clinic in person",
    visit_type_id: 1, // Walking visit ID
  },
  {
    value: "Virtual",
    label: "Virtual/Telehealth visit",
    description: "Video consultation from home",
    visit_type_id: 2, // Virtual visit ID
  },
];

export function PatientVisitTypeStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // Get step configuration
  const stepData = getStepComponentData("visitType");

  // Get phone number from state
  React.useEffect(() => {
    if (state?.draft?.phone) {
      setPhoneNumber(state.draft.phone as string);
    }
  }, [state]);

  const form = useForm<FormValues>({
    resolver: zodResolver(visitTypeSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      visitType: (state?.draft?.visitType as string) || "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!phoneNumber) {
      console.error("No phone number found");
      return;
    }

    try {
      setError(null);
      console.log("Visit type submitted:", values);
      
      // Find the selected visit type option to get the ID
      const selectedOption = visitTypeOptions.find(option => option.value === values.visitType);
      if (!selectedOption) {
        console.error("Invalid visit type selected");
        return;
      }
      
      // Prepare visit type data for API
      const visitTypeData = {
        visit_type_id: selectedOption.visit_type_id,
      };
      
      let apiResponse;
      try {
        // Call visit type API
        apiResponse = await patientService.saveVisitType(phoneNumber, visitTypeData);
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
        console.log("Visit type saved successfully:", apiResponse);
        
        try {
          // Save to centralized state
          await saveStep(stepData.stepId, {
            visitType: values.visitType,
            visitTypeId: selectedOption.visit_type_id,
            currentStep: apiResponse.data.current_step,
            status: apiResponse.data.status,
            guestPatientId: apiResponse.data.guest_patient_id,
            appointmentId: apiResponse.data.appointment_id,
          });
          
          // Navigate to next step based on API response (no success toast)
          const nextStep = apiResponse.data.current_step;
          const nextRoute = getRouteFromApiStep(nextStep);
          console.log(`Visit type API response:`, apiResponse);
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
        const errorMessage = apiResponse.message || "Failed to save visit type information";
        
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
    // Navigate back to health concern step
    router.push("/onboarding/patient/health-concern");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  const selectedVisitType = form.watch("visitType");
  const fieldError = form.formState.errors.visitType?.message;
  
  // Ensure form is valid before enabling continue button
  const isFormValid = isValid && selectedVisitType && selectedVisitType.length > 0;

  const enterKeyHandler = useEnterKey(() => form.handleSubmit(handleSubmit)());

  return (
    <PatientStepShell
      title="What type of visit would you prefer?"
      description="Choose the type of appointment that works best for you."
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isFormValid}
      useCard={false}
      progressPercent={Math.round((10 / 15) * 100)}
      currentStep={10}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="space-y-3" onKeyDown={enterKeyHandler} tabIndex={0}>
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visitTypeOptions.map((option) => (
              <label key={option.value} className="block cursor-pointer">
                <input
                  {...form.register("visitType", {
                    required: "Please select a visit type",
                  })}
                  type="radio"
                  value={option.value}
                  className="sr-only"
                />
                <Card
                  className={cn(
                    "transition-all duration-200 border-2 py-6 h-full",
                    selectedVisitType === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:shadow-sm",
                  )}
                >
                  <CardContent className="flex flex-col justify-center h-full">
                    <div className="space-y-2 text-center">
                      <span className="text-lg font-medium text-foreground block">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-sm text-muted-foreground block">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </label>
            ))}
          </div>

          <AnimatePresence>
            {fieldError && (
              <motion.p
                className="text-destructive text-sm"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {fieldError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
