"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { AppointmentConfirmationContent } from "@/components/onboarding/patient/confirmation/AppointmentConfirmationContent";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";

function PatientConfirmationContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard
        requiredStep={PatientOnboardingStep.Confirmation}
      >
        <div className="min-h-screen bg-background">
          <AppointmentConfirmationContent />
        </div>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientConfirmationContent />
    </Suspense>
  );
}
