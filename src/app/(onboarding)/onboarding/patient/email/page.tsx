"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientEmailStep } from "@/lib/features/patient-onboarding/presentation/components/PatientEmailStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";

function PatientEmailContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard requiredStep={PatientOnboardingStep.Email}>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <PatientEmailStep />
          </div>
        </div>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientEmailContent />
    </Suspense>
  );
}
