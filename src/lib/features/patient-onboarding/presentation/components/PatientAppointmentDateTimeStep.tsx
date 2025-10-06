"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PatientStepShell } from "./PatientStepShell";
import { AppointmentDateTimeStep } from "../../../../../components/onboarding/patient/steps/AppointmentDateTimeStep";
// Removed usePatientOnboarding context - using progress API instead
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";
import { useToast } from "@/components/ui/use-toast";
import { getRouteFromApiStep } from "@/lib/config/api";
import { DoctorListSkeleton, DateGridSkeleton, SectionHeaderSkeleton } from "@/components/ui/skeleton-loaders";

// Form schema for appointment date/time
const appointmentDateTimeSchema = z.object({
  appointmentDate: z.string().min(1, "Please select a date to continue"),
  appointmentTime: z.string().min(1, "Please select a time to continue"),
});

type AppointmentDateTimeFormData = z.infer<typeof appointmentDateTimeSchema>;

export function PatientAppointmentDateTimeStep() {
  const router = useRouter();
  const { toast } = useToast();
  const stepData = getStepComponentData("appointmentDateTime");
  const [providerId, setProviderId] = useState<number | undefined>(undefined);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AppointmentDateTimeFormData>({
    resolver: zodResolver(appointmentDateTimeSchema),
    defaultValues: {
      appointmentDate: "",
      appointmentTime: "",
    },
  });

  // Call progress API to get provider ID
  useEffect(() => {
    const fetchProgressAndProviderId = async () => {
      try {
        setIsLoadingProgress(true);
        setProgressError(null);

        // Get phone number from localStorage
        const savedPhone = localStorage.getItem('patient-phone-number');

        if (!savedPhone) {
          setProgressError('Phone number not found. Please start the onboarding process again.');
          setIsLoadingProgress(false);
          return;
        }

        setPhoneNumber(savedPhone);

        const progressResponse = await patientService.getOnboardingProgress(savedPhone);

        if (progressResponse.success && progressResponse.data) {
          const apiData = progressResponse.data;

          // Extract provider ID from the API response
          if (apiData.state?.provider?.id) {
            const extractedProviderId = apiData.state.provider.id;

            setProviderId(extractedProviderId);
          } else {

            setProgressError('No provider selected. Please go back and select a provider first.');
          }

          // Prefill appointment data if available
          if (apiData.state?.appointment) {
            const appointment = apiData.state.appointment;

            // Use setTimeout to ensure form is ready
            setTimeout(() => {
              if (appointment.date) {
                form.setValue('appointmentDate', appointment.date, { shouldValidate: true });
              }
              if (appointment.time) {
                form.setValue('appointmentTime', appointment.time, { shouldValidate: true });
              }
            }, 100);
          }
        } else {

          setProgressError(progressResponse.message || 'Failed to fetch progress information');
        }
      } catch (error) {

        setProgressError('Failed to fetch progress information');
      } finally {
        setIsLoadingProgress(false);
      }
    };

    fetchProgressAndProviderId();
  }, [form]);

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
        <div className="space-y-6">
          {/* Doctor Selection Skeleton */}
          <div className="space-y-4">
            <SectionHeaderSkeleton />
            <DoctorListSkeleton count={3} />
          </div>

          {/* Date & Time Selection Skeleton */}
          <div className="border-t border-border/30 pt-6 space-y-4">
            <SectionHeaderSkeleton />
            <DateGridSkeleton count={10} />
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

  // Removed state null check - using progress API instead

  const handleSubmit = async (data: AppointmentDateTimeFormData) => {
    if (!phoneNumber) {

      setError("Phone number not found. Please start over.");
      return;
    }

    // Validate that both date and time are selected
    if (!data.appointmentDate || !data.appointmentTime) {
      const missingFields = [];
      if (!data.appointmentDate) missingFields.push("date");
      if (!data.appointmentTime) missingFields.push("time");

      setError(`Please select ${missingFields.join(" and ")} to continue.`);
      return;
    }

    try {
      setError(null);

      // Call appointment API to save the selected date and time
      const apiResponse = await patientService.saveAppointment(phoneNumber, {
        date: data.appointmentDate,
        time: data.appointmentTime,
      });

      if (apiResponse.success) {

        // Navigate to next step based on API response
        const nextStep = apiResponse.data?.current_step;
        const nextRoute = getRouteFromApiStep(nextStep || 'fulfillment');

        router.push(nextRoute);
      } else {
        // Handle API error response
        const errorMessage = apiResponse.message || "Failed to save appointment";

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
    router.push("/onboarding/patient/doctor-selection");
  };

  const getPersonalizedLabel = (step: number) => {
    // Use a generic label since we don't have access to firstName from state anymore
    return `Step ${step}`;
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
          {/* Error Display */}
          {error && (
            <motion.div
              className="p-4 bg-red-50 border border-red-200 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <div>
                  <p className="text-red-800 font-medium text-sm">
                    {error}
                  </p>
                  <p className="text-red-600 text-xs mt-1">
                    Please make your selection below to continue
                  </p>
                </div>
              </div>
            </motion.div>
          )}

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
