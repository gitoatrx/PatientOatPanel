"use client";

"use client";

import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PatientStepShell } from "./PatientStepShell";
import { DoctorList } from "@/components/onboarding/patient/doctor/DoctorList";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

// Doctor data interface
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  nextAvailable: string;
  rating: number;
  yearsOfExperience?: number;
  clinic?: string;
}

// Form schema for doctor selection
const doctorSelectionSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
});

type DoctorSelectionFormData = z.infer<typeof doctorSelectionSchema>;

export function PatientDoctorSelectionStep() {
  const router = useRouter();
  const { saveStep, state } = usePatientOnboarding();
  const stepData = getStepComponentData("doctorSelection");

  // Sample doctor data (safe to define before early returns)
  const doctors: Doctor[] = [
    {
      id: "1",
      name: "Dr. Amina Yusuf",
      specialty: "Cardiologist",
      nextAvailable: "Available Today",
      rating: 4.8,
      yearsOfExperience: 8,
      clinic: "Heart Care Center",
    },
    {
      id: "2",
      name: "Dr. John Ekene",
      specialty: "Cardiologist",
      nextAvailable: "Available Tomorrow",
      rating: 4.7,
      yearsOfExperience: 12,
      clinic: "Cardio Health Clinic",
    },
    {
      id: "3",
      name: "Dr. Sarah Johnson",
      specialty: "Family Medicine",
      nextAvailable: "Available Today",
      rating: 4.9,
      yearsOfExperience: 6,
      clinic: "Family Health Center",
    },
    {
      id: "4",
      name: "Dr. Michael Chen",
      specialty: "Internal Medicine",
      nextAvailable: "Available Tomorrow",
      rating: 4.6,
      yearsOfExperience: 10,
      clinic: "Internal Medicine Associates",
    },
    {
      id: "5",
      name: "Dr. Emily Rodriguez",
      specialty: "Pediatrics",
      nextAvailable: "Available Today",
      rating: 4.8,
      yearsOfExperience: 7,
      clinic: "Children's Health Center",
    },
    {
      id: "6",
      name: "Dr. David Thompson",
      specialty: "Dermatology",
      nextAvailable: "Available Tomorrow",
      rating: 4.7,
      yearsOfExperience: 9,
      clinic: "Skin Care Specialists",
    },
  ];

  // Initialize form hook unconditionally to preserve hooks order
  const form = useForm<DoctorSelectionFormData>({
    resolver: zodResolver(doctorSelectionSchema),
    defaultValues: {
      doctorId: (state?.draft?.doctorId as string) || "",
    },
  });

  // Add null check for state
  if (!state) {
    return <div>Loading...</div>;
  }

  const handleSubmit = async (data: DoctorSelectionFormData) => {
    try {
      await saveStep(stepData.stepId, data);
      router.push("/onboarding/patient/appointment-datetime");
    } catch (error) {
      console.error("Error saving doctor selection:", error);
    }
  };

  const handleBack = () => {
    router.push("/onboarding/patient/emergency-contact");
  };

  return (
    <PatientStepShell
      title="Choose Your Doctor"
      description="Select a healthcare provider that best fits your needs"
      progressPercent={stepData.progressPercent}
      currentStep={stepData.currentStep}
      totalSteps={stepData.totalSteps}
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit as any)()}
      nextLabel="Continue"
      isNextDisabled={!form.watch("doctorId")}
      useCard={false}
    >
      <FormProvider {...form}>
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Available Specialists Section */}
          <section aria-labelledby="available-specialists-heading" className="space-y-3">
       
            
            <DoctorList doctors={doctors} showSearch={false} />
          </section>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
