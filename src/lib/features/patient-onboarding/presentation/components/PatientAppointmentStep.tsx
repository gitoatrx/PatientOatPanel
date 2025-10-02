"use client";

import React from "react";
import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { AppointmentDateTimeStep } from "@/components/onboarding/patient/steps/AppointmentDateTimeStep";
import { DoctorList } from "@/components/onboarding/patient/doctor/DoctorList";
import type { Doctor } from "@/components/onboarding/patient/doctor/DoctorCard";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

const appointmentSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
  appointmentDate: z.string().min(1, "Please select an appointment date"),
  appointmentTime: z.string().min(1, "Please select an appointment time"),
});

type FormValues = z.infer<typeof appointmentSchema>;

export function PatientAppointmentStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();
  
  // Get step configuration
  const stepData = getStepComponentData("appointmentDateTime");

  const form = useForm<FormValues>({
    resolver: zodResolver(appointmentSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      doctorId: (state?.draft?.doctorId as string) || "",
      appointmentDate: (state?.draft?.appointmentDate as string) || "",
      appointmentTime: (state?.draft?.appointmentTime as string) || "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {

      // Save to centralized state
      const result = await saveStep(stepData.stepId, {
        doctorId: values.doctorId,
        appointmentDate: values.appointmentDate,
        appointmentTime: values.appointmentTime,
      });
      
      // Navigate to review step
      router.push("/onboarding/patient/review");
    } catch (error) {

    }
  };

  const handleBack = () => {

    // Navigate back to doctor selection step
    router.push("/onboarding/patient/doctor-selection");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  // Get personalized label function for the existing component
  const getPersonalizedLabel = () => {
    return "When would you like to schedule your appointment?";
  };

  // Example doctors for UI; replace with API data when available
  const doctors: Doctor[] = [
    {
      id: "d-lee",
      name: "Dr. Aisha Lee",
      specialty: "Family Medicine",
      rating: 4.9,
      nextAvailable: "Today, 2:30 PM",
      yearsOfExperience: 12,
      clinic: "Broadway Medical Centre",
    },
    {
      id: "m-chen",
      name: "Dr. Marcus Chen",
      specialty: "Internal Medicine",
      rating: 4.8,
      nextAvailable: "Today, 4:10 PM",
      yearsOfExperience: 10,
      clinic: "Downtown Health Clinic",
    },
    {
      id: "s-patel",
      name: "Dr. Sara Patel",
      specialty: "Pediatrics",
      rating: 4.7,
      nextAvailable: "Tomorrow, 9:20 AM",
      yearsOfExperience: 9,
      clinic: "Bayview Pediatrics",
    },
    {
      id: "j-roberts",
      name: "Dr. James Roberts",
      specialty: "Dermatology",
      rating: 4.6,
      nextAvailable: "Tomorrow, 11:45 AM",
      yearsOfExperience: 14,
      clinic: "Coastal Skin Clinic",
    },
    {
      id: "n-singh",
      name: "Dr. Neha Singh",
      specialty: "Mental Health",
      rating: 4.9,
      nextAvailable: "Fri, 3:00 PM",
      yearsOfExperience: 8,
      clinic: "Harbour Wellness Centre",
    },
    {
      id: "r-wilson",
      name: "Dr. Robert Wilson",
      specialty: "Orthopedics",
      rating: 4.8,
      nextAvailable: "Today, 5:15 PM",
      yearsOfExperience: 15,
      clinic: "Sports Medicine Clinic",
    },
    {
      id: "m-garcia",
      name: "Dr. Maria Garcia",
      specialty: "Gynecology",
      rating: 4.7,
      nextAvailable: "Tomorrow, 10:30 AM",
      yearsOfExperience: 11,
      clinic: "Women's Health Center",
    },
    {
      id: "d-kim",
      name: "Dr. David Kim",
      specialty: "Neurology",
      rating: 4.9,
      nextAvailable: "Wed, 1:45 PM",
      yearsOfExperience: 18,
      clinic: "Neurological Institute",
    },
  ];

  return (
    <PatientStepShell
      title={getPersonalizedLabel()}
      description="Select your preferred date and time for the appointment."
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((12 / 15) * 100)}
      currentStep={12}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Doctor Selection Section */}
          <section aria-labelledby="select-doctor-heading" className="space-y-6">
            <div className="text-center">
              <h3 id="select-doctor-heading" className="text-2xl font-bold text-foreground mb-2">
                Choose Your Doctor
              </h3>
              <p className="text-muted-foreground">
                Select a healthcare provider that best fits your needs
              </p>
            </div>
            <DoctorList doctors={doctors} showSearch={false} />
          </section>

          {/* Appointment Date & Time Section */}
          <div className="border-t border-border/30 pt-8">
            <AppointmentDateTimeStep
              onNext={() => form.handleSubmit(handleSubmit)()}
              getPersonalizedLabel={getPersonalizedLabel}
            />
          </div>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
