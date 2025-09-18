"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";
import { getRouteFromApiStep } from "@/lib/config/api";

const genderSchema = z.object({
  gender: z.string().min(1, "Please select your gender"),
});

type FormValues = z.infer<typeof genderSchema>;

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export function PatientGenderStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // Get step configuration
  const stepData = getStepComponentData("gender");

  // Get phone number from state
  React.useEffect(() => {
    if (state?.draft?.phone) {
      setPhoneNumber(state.draft.phone as string);
    }
  }, [state]);

  const form = useForm<FormValues>({
    resolver: zodResolver(genderSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { 
      gender: (state?.draft?.gender as string) || "" 
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!phoneNumber) {
      console.error("No phone number found");
      return;
    }

    try {
      setError(null);
      console.log("Gender submitted:", values);
      
      // Prepare gender data for API
      const genderData = {
        gender: values.gender,
      };
      
      let apiResponse;
      try {
        // Call personal info step 2 API
        apiResponse = await patientService.savePersonalInfoStep2(phoneNumber, genderData);
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
        console.log("Gender saved successfully:", apiResponse);
        
        try {
          // Save to centralized state
          await saveStep(stepData.stepId, {
            gender: values.gender,
            currentStep: apiResponse.data.current_step,
            status: apiResponse.data.status,
            guestPatientId: apiResponse.data.guest_patient_id,
            appointmentId: apiResponse.data.appointment_id,
          });
          
          // Navigate to next step based on API response (no success toast)
          const nextStep = apiResponse.data.current_step;
          const nextRoute = getRouteFromApiStep(nextStep);
          console.log(`Gender API response:`, apiResponse);
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
        const errorMessage = apiResponse.message || "Failed to save gender information";
        
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
    // Navigate back to personal step
    router.push("/onboarding/patient/personal");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  const selectedGender = form.watch("gender");
  const fieldError = form.formState.errors.gender?.message;

  return (
    <PatientStepShell
      title="What's your gender?"
      description="This information helps us provide personalized care."
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((5 / 15) * 100)}
      currentStep={5}
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
            <div className="grid grid-cols-2 gap-4">
              {genderOptions.map((option) => (
                <label key={option.value} className="cursor-pointer">
                  <input
                    {...form.register("gender", {
                      required: "Please select your gender",
                      validate: (value) => {
                        if (!value) return "Please select your gender";
                        return true;
                      },
                    })}
                    type="radio"
                    value={option.value}
                    className="sr-only"
                  />
                  <Card
                    className={cn(
                      "transition-all duration-200 border-1",
                      selectedGender === option.value
                        ? option.value.toLowerCase() === "female"
                          ? "border-pink-400 bg-pink-500/20 "
                          : "border-primary bg-primary/10 "
                        : "border-border ",
                    )}
                  >
                    <CardContent className=" text-center">
                      <div className="space-y-0.5">
                        <h3 className="text-md sm:text-lg font-medium text-foreground">
                          {option.label}
                        </h3>
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
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
