"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { PatientStepShell } from "./PatientStepShell";
import { AppointmentDateTimeStep } from "@/components/onboarding/patient/steps/AppointmentDateTimeStep";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";

// Form schema for appointment date/time
const appointmentDateTimeSchema = z.object({
  appointmentDate: z.string().min(1, "Please select an appointment date"),
  appointmentTime: z.string().min(1, "Please select an appointment time"),
});

type AppointmentDateTimeFormData = z.infer<typeof appointmentDateTimeSchema>;

export function PatientAppointmentDateTimeStep() {
  const router = useRouter();
  const { saveStep, state } = usePatientOnboarding();
  const stepData = getStepComponentData("appointmentDateTime");
  const [providerId, setProviderId] = useState<number | undefined>(undefined);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);

  const form = useForm<AppointmentDateTimeFormData>({
    resolver: zodResolver(appointmentDateTimeSchema),
    defaultValues: {
      appointmentDate: (state?.draft?.appointmentDate as string) || "",
      appointmentTime: (state?.draft?.appointmentTime as string) || "",
    },
  });

  // Call progress API to get provider ID
  useEffect(() => {
    const fetchProgressAndProviderId = async () => {
      try {
        setIsLoadingProgress(true);
        setProgressError(null);

        // Get phone number from state or localStorage
        const phoneNumber = state?.draft?.phone as string || localStorage.getItem('patient-phone-number');
        
        if (!phoneNumber) {
          setProgressError('Phone number not found. Please start the onboarding process again.');
          setIsLoadingProgress(false);
          return;
        }

        console.log('Fetching progress to get provider ID for phone:', phoneNumber);
        const progressResponse = await patientService.getOnboardingProgress(phoneNumber);
        
        if (progressResponse.success && progressResponse.data) {
          const apiData = progressResponse.data;
          console.log('Progress API response:', apiData);
          
          // Extract provider ID from the API response
          if (apiData.state?.provider?.id) {
            const extractedProviderId = apiData.state.provider.id;
            console.log('Extracted provider ID from progress API:', extractedProviderId);
            setProviderId(extractedProviderId);
          } else {
            console.log('No provider ID found in progress API response');
            setProgressError('No provider selected. Please go back and select a provider first.');
          }
        } else {
          console.error('Progress API failed:', progressResponse.message);
          setProgressError(progressResponse.message || 'Failed to fetch progress information');
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
        setProgressError('Failed to fetch progress information');
      } finally {
        setIsLoadingProgress(false);
      }
    };

    fetchProgressAndProviderId();
  }, [state?.draft?.phone]);

  // Show loading state while fetching progress
  if (isLoadingProgress) {
    return (
      <PatientStepShell
        title="Loading..."
        description="Fetching your appointment information..."
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
        useCard={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PatientStepShell>
    );
  }

  // Show error state if progress fetch failed
  if (progressError) {
    return (
      <PatientStepShell
        title="Error"
        description="Failed to load appointment information"
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
        useCard={false}
      >
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive font-medium">{progressError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Refresh page
          </button>
        </div>
      </PatientStepShell>
    );
  }

  // Add null check for state
  if (!state) {
    return <div>Loading...</div>;
  }

  const handleSubmit = async (data: AppointmentDateTimeFormData) => {
    try {
      await saveStep(stepData.stepId, data);
      router.push("/onboarding/patient/review");
    } catch (error) {
      console.error("Error saving appointment date/time:", error);
    }
  };

  const handleBack = () => {
    router.push("/onboarding/patient/doctor-selection");
  };

  const getPersonalizedLabel = (step: number) => {
    const firstName = state.draft?.firstName || "there";
    return `${firstName}, step ${step}`;
  };

  return (
    <PatientStepShell
      title="Choose Date & Time"
      description="Select your preferred appointment date and time"
      progressPercent={stepData.progressPercent}
      currentStep={stepData.currentStep}
      totalSteps={stepData.totalSteps}
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isNextDisabled={!form.watch("appointmentDate") || !form.watch("appointmentTime")}
      useCard={false}
    >
      <FormProvider {...form}>
        <div className="max-w-2xl mx-auto space-y-6">
          <AppointmentDateTimeStep
            onNext={() => form.handleSubmit(handleSubmit)()}
            getPersonalizedLabel={getPersonalizedLabel}
            providerId={providerId}
          />
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
