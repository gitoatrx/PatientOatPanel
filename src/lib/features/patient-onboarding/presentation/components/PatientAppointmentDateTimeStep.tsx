"use client";

import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PatientStepShell } from "./PatientStepShell";
import { AppointmentDateTimeStep } from "@/components/onboarding/patient/steps/AppointmentDateTimeStep";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

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

  // Add null check for state
  if (!state) {
    return <div>Loading...</div>;
  }

  const form = useForm<AppointmentDateTimeFormData>({
    resolver: zodResolver(appointmentDateTimeSchema),
    defaultValues: {
      appointmentDate: state.draft?.appointmentDate || "",
      appointmentTime: state.draft?.appointmentTime || "",
    },
  });

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

  const getPersonalizedLabel = (field: string) => {
    const firstName = state.draft?.firstName || "there";
    return `${firstName}, ${field}`;
  };

  return (
    <PatientStepShell
      title="Choose Date & Time"
      description="Select your preferred appointment date and time"
      progressPercent={stepData.progressPercent}
      currentStep={stepData.currentStep}
      totalSteps={stepData.totalSteps}
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit as any)()}
      nextLabel="Continue"
      isNextDisabled={!form.watch("appointmentDate") || !form.watch("appointmentTime")}
      useCard={false}
    >
      <FormProvider {...form}>
        <div className="max-w-2xl mx-auto space-y-6">
          <AppointmentDateTimeStep
            onNext={() => form.handleSubmit(handleSubmit)()}
            getPersonalizedLabel={getPersonalizedLabel}
          />
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
