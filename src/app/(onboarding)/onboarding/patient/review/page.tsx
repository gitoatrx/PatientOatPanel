"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientReviewStep } from "@/lib/features/patient-onboarding/presentation/components/PatientReviewStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";

function PatientReviewContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard requiredStep={PatientOnboardingStep.Review}>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <PatientReviewStep />
          </div>
        </div>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientReviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientReviewContent />
    </Suspense>
  );
}
