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
import React, { useState, useEffect } from "react";
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
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  
  // Get step configuration
  const stepData = getStepComponentData("gender");

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
      
      if (progressResponse.success && progressResponse.data?.state?.personal_info?.gender) {
        const gender = progressResponse.data.state.personal_info.gender;
        console.log('Prefilling gender form with:', gender);
        
        // Prefill form with existing data
        form.setValue('gender', gender);
      }
    } catch (error) {
      console.error('Error fetching progress for prefill:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(genderSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { 
      gender: "" 
    },
  });

  // Form prefilling will be handled by progress API integration

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
        
        // Navigate to next step based on API response (no success toast)
        const nextStep = apiResponse.data.current_step;
        const nextRoute = getRouteFromApiStep(nextStep);
        console.log(`Gender API response:`, apiResponse);
        console.log(`Next step from API: ${nextStep}`);
        console.log(`Mapped route: ${nextRoute}`);
        console.log(`Navigating to: ${nextRoute}`);
        router.push(nextRoute);
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

  // Show loading state while fetching progress data
  if (isLoadingProgress) {
    return (
      <PatientStepShell
        title="Loading..."
        description="Loading your information..."
        progressPercent={Math.round((5 / 15) * 100)}
        currentStep={5}
        totalSteps={15}
        useCard={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading your information...</p>
          </div>
        </div>
      </PatientStepShell>
    );
  }

  return (
    <PatientStepShell
      title="What's your gender?"
      description="This information helps us provide personalized care."
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
