"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientGenderStep } from "@/lib/features/patient-onboarding/presentation/components/PatientGenderStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";

function PatientGenderContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard requiredStep={PatientOnboardingStep.Gender}>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <PatientGenderStep />
          </div>
        </div>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientGenderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientGenderContent />
    </Suspense>
  );
}
