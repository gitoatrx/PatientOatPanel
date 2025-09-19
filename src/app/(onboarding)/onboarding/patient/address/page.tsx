"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientAddressStep } from "@/lib/features/patient-onboarding/presentation/components/PatientAddressStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";

function PatientAddressContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard requiredStep={PatientOnboardingStep.Address}>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <PatientAddressStep />
          </div>
        </div>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientAddressPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientAddressContent />
    </Suspense>
  );
}
