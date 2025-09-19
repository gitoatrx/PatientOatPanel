"use client";

import { Suspense } from "react";
import { AppointmentConfirmationContent } from "@/components/onboarding/patient/confirmation/AppointmentConfirmationContent";

function PatientConfirmationContent() {
  return (
    <div className="min-h-screen bg-background">
      <AppointmentConfirmationContent />
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
