"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientPhoneStep } from "@/lib/features/patient-onboarding/presentation/components/PatientPhoneStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";
import { OnboardingErrorBoundary } from "@/components/error-boundaries/OnboardingErrorBoundary";

function PatientPhoneContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard requiredStep={PatientOnboardingStep.Phone}>
        <OnboardingErrorBoundary stepName="phone">
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
              <PatientPhoneStep />
            </div>
          </div>
        </OnboardingErrorBoundary>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientPhonePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientPhoneContent />
    </Suspense>
  );
}
