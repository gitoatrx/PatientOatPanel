"use client";

import React, { useEffect, useState } from "react";
import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { Combobox } from "@/components/ui/combobox";
import { getHealthConditions } from "@/lib/constants/medical-specialties";
// Removed usePatientOnboarding context - using progress API instead
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { useSmartBackNavigation } from "../hooks/useSmartBackNavigation";
import { FormTextarea } from "@/components/ui";
import { patientService } from "@/lib/services/patientService";
import { HealthConcern } from "@/lib/types/api";
import { useToast } from "@/components/ui/use-toast";
import { getRouteFromApiStep } from "@/lib/config/api";

const healthConcernSchema = z.object({
  selectedReason: z.string().min(1, "Please select a health concern"),
  symptoms: z
    .string()
    .min(1, "Please describe your symptoms")
    .min(10, "Please provide more details about your symptoms"),
});

type FormValues = z.infer<typeof healthConcernSchema>;

export function PatientHealthConcernStep() {
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [healthConcerns, setHealthConcerns] = useState<HealthConcern[]>([]);
  const [isLoadingConcerns, setIsLoadingConcerns] = useState(true);
  const [concernsError, setConcernsError] = useState<string | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      if (progressResponse.success && progressResponse.data?.state?.health_concerns) {
        const healthConcernsData = progressResponse.data.state.health_concerns;
        
        // Prefill form with existing data
        if (healthConcernsData.selected_ids && healthConcernsData.selected_ids.length > 0) {
          // Use the selected_labels from the API response for the dropdown
          if (healthConcernsData.selected_labels && healthConcernsData.selected_labels.length > 0) {
            form.setValue('selectedReason', healthConcernsData.selected_labels[0]);
          } else {
            // Fallback: Find the concern name by ID for the dropdown
            const concernId = healthConcernsData.selected_ids[0];
            const concern = healthConcerns.find((c: HealthConcern) => c.id === concernId);
            if (concern) {
              form.setValue('selectedReason', concern.name);
            }
          }
        }
        if (healthConcernsData.free_text && healthConcernsData.free_text.length > 0) {
          form.setValue('symptoms', healthConcernsData.free_text.join('\n'));
        }
      } else {
      }
    } catch (error) {
      console.error('Error fetching progress for prefill:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const { handleSmartBack } = useSmartBackNavigation();

  // Get step configuration from centralized config
  const stepData = getStepComponentData("healthConcern");

  const form = useForm<FormValues>({
    resolver: zodResolver(healthConcernSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { selectedReason: "", symptoms: "" },
  });

  // Fetch health concerns from API
  useEffect(() => {
    const fetchHealthConcerns = async () => {
      try {
        setIsLoadingConcerns(true);
        setConcernsError(null);
        
        const response = await patientService.getHealthConcernsList();
        
        if (response.success) {
          setHealthConcerns(response.data);
        } else {
          console.error('Failed to load health concerns:', response.message);
          setConcernsError(response.message);
          // Fallback to static data
          setHealthConcerns(getHealthConditions().map(item => ({ id: 0, name: item.label })));
        }
      } catch (error) {
        console.error('Error fetching health concerns:', error);
        setConcernsError('Failed to load health concerns');
        // Fallback to static data
        setHealthConcerns(getHealthConditions().map(item => ({ id: 0, name: item.label })));
      } finally {
        setIsLoadingConcerns(false);
      }
    };

    fetchHealthConcerns();
  }, []);

  // Form prefilling is now handled by fetchProgressAndPrefillForm

  const handleSubmit = async (values: FormValues) => {
    if (!phoneNumber) {
      console.error("No phone number found");
      setError("Phone number not found. Please start over.");
      return;
    }

    try {
      setError(null);
      
      // Find the concern ID from the selected reason name
      const selectedConcern = healthConcerns.find(concern => concern.name === values.selectedReason);
      const selectedConcernId = selectedConcern ? selectedConcern.id : 0;
      
      // Transform form data to match API structure
      const selectedConcernIds = selectedConcernId > 0 ? [selectedConcernId] : [];
      const otherConcerns = values.symptoms ? [values.symptoms] : [];
      
      // Call health concern API with the correct structure
      const apiResponse = await patientService.saveHealthConcern(phoneNumber, {
        selected_concern_ids: selectedConcernIds,
        other_concerns: otherConcerns,
      });
      
      if (apiResponse.success) {
        
        // Navigate to next step based on API response (no success toast)
        const nextStep = apiResponse.data?.current_step;
        const nextRoute = getRouteFromApiStep(nextStep || 'visit_type');
        router.push(nextRoute);
      } else {
        // Handle API error response
        const errorMessage = apiResponse.message || "Failed to save health concern";
        
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
    // Navigate back to emergency contact step
    router.push("/onboarding/patient/emergency-contact");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  // Get personalized label
  const getPersonalizedLabel = () => {
    return "What brings you in today?";
  };

  const formValues = form.watch();

  // Show loading state while fetching progress data
  if (isLoadingProgress) {
    return (
      <PatientStepShell
        title="Loading..."
        description="Loading your information..."
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
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
      title={getPersonalizedLabel()}
      description="Please tell us about your health concern and any symptoms you're experiencing."
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={form.formState.isSubmitting}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={stepData.progressPercent}
      currentStep={stepData.currentStep}
      totalSteps={stepData.totalSteps}
    >
      <FormProvider {...form}>
        <div className="max-w-xl mx-auto space-y-6">
          {/* Error Display */}
          {concernsError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                {concernsError} - Using fallback data.
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              {isLoadingConcerns ? (
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">Loading health concerns...</p>
                </div>
              ) : (
                <Combobox
                  options={healthConcerns.map(concern => ({
                    value: concern.id.toString(),
                    label: concern.name,
                  }))}
                  value={formValues.selectedReason}
                  onValueChange={(value) => {
                    const selectedConcern = healthConcerns.find(concern => concern.id.toString() === value);
                    form.setValue("selectedReason", selectedConcern ? selectedConcern.name : "", {
                      shouldValidate: true,
                    });
                  }}
                  placeholder="Select your health concern..."
                  emptyMessage="No health conditions found."
                  displayValue={(value) => {
                    const option = healthConcerns.find(
                      (concern) => concern.name === value,
                    );
                    return option ? option.name : value;
                  }}
                />
              )}
              {form.formState.errors.selectedReason && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.selectedReason?.message as string}
                </p>
              )}
            </div>
            <FormTextarea
              name="symptoms"
              label="Please describe your symptoms in detail"
              placeholder="Please describe your symptoms, how long you've had them, and any other relevant details..."
              rows={6}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  form.handleSubmit(handleSubmit)();
                }
              }}
            />
          </div>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
