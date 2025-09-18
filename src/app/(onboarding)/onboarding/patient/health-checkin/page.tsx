"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { PreVisitWizard } from "@/components/onboarding/patient/confirmation/PreVisitWizard";
import { mockAssessmentData } from "@/data/mockAssessmentData";

function HealthCheckInContent() {
  const router = useRouter();
  const appt = mockAssessmentData.appointmentData;

  const handleClose = () => {
    // Navigate back to confirmation page
    router.push('/onboarding/patient/confirmation');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <PreVisitWizard
          isOpen={true}
          onClose={handleClose}
          doctorName={appt.doctor.name}
        />
      </div>
    </div>
  );
}

export default function HealthCheckInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading health check-in...</p>
        </div>
      </div>
    }>
      <HealthCheckInContent />
    </Suspense>
  );
}
