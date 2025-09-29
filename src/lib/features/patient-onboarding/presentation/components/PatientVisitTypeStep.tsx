"use client";

import React, { useState, useEffect } from "react";
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
import { VisitType } from "@/lib/types/api";

const visitTypeSchema = z.object({
  visitType: z.string().min(1, "Please select a visit type"),
});

type FormValues = z.infer<typeof visitTypeSchema>;

// Visit types will be loaded dynamically from API

export function PatientVisitTypeStep() {
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [visitTypes, setVisitTypes] = useState<VisitType[]>([]);
  const [isLoadingVisitTypes, setIsLoadingVisitTypes] = useState<boolean>(true);
  const [visitTypesError, setVisitTypesError] = useState<string | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  
  // Get step configuration
  const stepData = getStepComponentData("visitType");

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
      
      if (progressResponse.success && progressResponse.data?.state?.visit_type) {
        const visitType = progressResponse.data.state.visit_type;
        
        // Prefill form with existing data
        if (visitType.id) {
          form.setValue('visitType', visitType.id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching progress for prefill:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  // Load visit types from API
  React.useEffect(() => {
    const loadVisitTypes = async () => {
      try {
        setIsLoadingVisitTypes(true);
        setVisitTypesError(null);
        
        const response = await patientService.getVisitTypesList();
        
        if (response.success && response.data) {
          setVisitTypes(response.data);
        } else {
          setVisitTypesError(response.message || "Failed to load visit types");
          console.error("Failed to load visit types:", response.message);
        }
      } catch (error) {
        console.error("Error loading visit types:", error);
        setVisitTypesError("Failed to load visit types. Please try again.");
      } finally {
        setIsLoadingVisitTypes(false);
      }
    };

    loadVisitTypes();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(visitTypeSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      visitType: "",
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
      
      // Find the selected visit type to get the ID
      const selectedVisitType = visitTypes.find(vt => vt.id.toString() === values.visitType);
      if (!selectedVisitType) {
        console.error("Invalid visit type selected");
        return;
      }
      
      // Prepare visit type data for API
      const visitTypeData = {
        visit_type_id: selectedVisitType.id,
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
        throw new Error(errorMessage);
      }
      
      if (apiResponse.success) {
        
        // Navigate to next step based on API response (no success toast)
        const nextStep = apiResponse.data.current_step;
        const nextRoute = getRouteFromApiStep(nextStep);
        router.push(nextRoute);
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
        throw new Error(errorMessage);
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
      throw new Error(errorMessage);
    }
  };

  const handleBack = () => {
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

  // Show loading state while fetching progress data
  if (isLoadingProgress) {
    return (
      <PatientStepShell
        title="Loading..."
        description="Loading your information..."
        progressPercent={Math.round((11 / 15) * 100)}
        currentStep={11}
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
      title="What type of visit would you prefer?"
      description="Choose the type of appointment that works best for you."
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
      isNextDisabled={!isFormValid}
      useCard={false}
      progressPercent={Math.round((11 / 15) * 100)}
      currentStep={11}
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
          
          {/* Loading State */}
          {isLoadingVisitTypes && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading visit types...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {visitTypesError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">{visitTypesError}</p>
            </div>
          )}

          {/* Visit Types Grid */}
          {!isLoadingVisitTypes && !visitTypesError && visitTypes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visitTypes.map((visitType) => (
                <label key={visitType.id} className="block cursor-pointer">
                  <input
                    {...form.register("visitType", {
                      required: "Please select a visit type",
                    })}
                    type="radio"
                    value={visitType.id.toString()}
                    className="sr-only"
                  />
                  <Card
                    className={cn(
                      "transition-all duration-200 border-2 py-6 h-full",
                      selectedVisitType === visitType.id.toString()
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:shadow-sm",
                    )}
                  >
                    <CardContent className="flex flex-col justify-center h-full">
                      <div className="space-y-2 text-center">
                        <span className="text-lg font-medium text-foreground block capitalize">
                          {visitType.name}
                        </span>
                        {/* <span className="text-sm text-muted-foreground block">
                          Duration: {visitType.duration} minutes
                        </span> */}
                      </div>
                    </CardContent>
                  </Card>
                </label>
              ))}
            </div>
          )}

          {/* No Visit Types Available */}
          {!isLoadingVisitTypes && !visitTypesError && visitTypes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No visit types available at the moment.</p>
            </div>
          )}

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
