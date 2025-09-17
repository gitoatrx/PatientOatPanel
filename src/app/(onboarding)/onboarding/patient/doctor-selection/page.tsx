"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientDoctorSelectionStep } from "@/lib/features/patient-onboarding/presentation/components/PatientDoctorSelectionStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";

function DoctorSelectionContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard
        requiredStep={PatientOnboardingStep.DoctorSelection}
      >
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <PatientDoctorSelectionStep />
          </div>
        </div>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function DoctorSelectionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DoctorSelectionContent />
    </Suspense>
  );
}
