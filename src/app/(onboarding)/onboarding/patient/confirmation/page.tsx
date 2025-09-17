"use client";

import { Suspense } from "react";
import { AppointmentConfirmationContent } from "@/components/onboarding/patient/confirmation/AppointmentConfirmationContent";

function PatientConfirmationContent() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <AppointmentConfirmationContent />
      </div>
    </div>
  );
}

export default function PatientConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientConfirmationContent />
    </Suspense>
  );
}
