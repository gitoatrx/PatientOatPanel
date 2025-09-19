"use client";

import { Suspense } from "react";
import { PatientOnboardingProvider } from "@/lib/features/patient-onboarding/presentation/context/PatientOnboardingContext";
import { PatientOnboardingRouteGuard } from "@/lib/features/patient-onboarding/presentation/components/PatientOnboardingRouteGuard";
import { PatientOtpVerificationStep } from "@/lib/features/patient-onboarding/presentation/components/PatientOtpVerificationStep";
import { PatientOnboardingStep } from "@/lib/features/patient-onboarding/domain/patient-onboarding-types";
import { OnboardingErrorBoundary } from "@/components/error-boundaries/OnboardingErrorBoundary";

function PatientOtpVerificationContent() {
  return (
    <PatientOnboardingProvider>
      <PatientOnboardingRouteGuard requiredStep={PatientOnboardingStep.Phone}>
        <OnboardingErrorBoundary stepName="verify-otp">
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
              <PatientOtpVerificationStep />
            </div>
          </div>
        </OnboardingErrorBoundary>
      </PatientOnboardingRouteGuard>
    </PatientOnboardingProvider>
  );
}

export default function PatientOtpVerificationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientOtpVerificationContent />
    </Suspense>
  );
}

