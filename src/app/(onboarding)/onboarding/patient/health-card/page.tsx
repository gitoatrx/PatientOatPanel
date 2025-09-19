"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientHealthCardStep } from "@/lib/features/patient-onboarding/presentation/components/PatientHealthCardStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";
import { OnboardingErrorBoundary } from "@/components/error-boundaries/OnboardingErrorBoundary";

function PatientHealthCardContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard
        requiredStep={PatientOnboardingStep.HealthCard}
      >
        <OnboardingErrorBoundary stepName="health-card">
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
              <PatientHealthCardStep />
            </div>
          </div>
        </OnboardingErrorBoundary>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientHealthCardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientHealthCardContent />
    </Suspense>
  );
}
