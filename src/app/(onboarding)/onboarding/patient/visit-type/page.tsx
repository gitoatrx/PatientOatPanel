"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientVisitTypeStep } from "@/lib/features/patient-onboarding/presentation/components/PatientVisitTypeStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";

function PatientVisitTypeContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard
        requiredStep={PatientOnboardingStep.VisitType}
      >
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <PatientVisitTypeStep />
          </div>
        </div>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientVisitTypePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientVisitTypeContent />
    </Suspense>
  );
}
