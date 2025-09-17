"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientAppointmentDateTimeStep } from "@/lib/features/patient-onboarding/presentation/components/PatientAppointmentDateTimeStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";

function AppointmentDateTimeContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard
        requiredStep={PatientOnboardingStep.AppointmentDateTime}
      >
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <PatientAppointmentDateTimeStep />
          </div>
        </div>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function AppointmentDateTimePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppointmentDateTimeContent />
    </Suspense>
  );
}
