"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientHealthConcernStep } from "@/lib/features/patient-onboarding/presentation/components/PatientHealthConcernStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";

function PatientHealthConcernContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard
        requiredStep={PatientOnboardingStep.HealthConcern}
      >
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <PatientHealthConcernStep />
          </div>
        </div>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientHealthConcernPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientHealthConcernContent />
    </Suspense>
  );
}
