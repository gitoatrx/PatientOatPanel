"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientPersonalStep } from "@/lib/features/patient-onboarding/presentation/components/PatientPersonalStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";
import { OnboardingErrorBoundary } from "@/components/error-boundaries/OnboardingErrorBoundary";

function PatientPersonalContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard
        requiredStep={PatientOnboardingStep.PersonalInfo}
      >
        <OnboardingErrorBoundary stepName="personal">
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
              <PatientPersonalStep />
            </div>
          </div>
        </OnboardingErrorBoundary>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientPersonalPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientPersonalContent />
    </Suspense>
  );
}
