"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientDateOfBirthStep } from "@/lib/features/patient-onboarding/presentation/components/PatientDateOfBirthStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";

function PatientDateOfBirthContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard
        requiredStep={PatientOnboardingStep.DateOfBirth}
      >
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <PatientDateOfBirthStep />
          </div>
        </div>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientDateOfBirthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientDateOfBirthContent />
    </Suspense>
  );
}
