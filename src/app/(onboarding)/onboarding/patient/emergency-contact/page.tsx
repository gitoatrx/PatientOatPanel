"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientEmergencyContactStep } from "@/lib/features/patient-onboarding/presentation/components/PatientEmergencyContactStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";

function PatientEmergencyContactContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard
        requiredStep={PatientOnboardingStep.EmergencyContact}
      >
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <PatientEmergencyContactStep />
          </div>
        </div>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientEmergencyContactPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientEmergencyContactContent />
    </Suspense>
  );
}
