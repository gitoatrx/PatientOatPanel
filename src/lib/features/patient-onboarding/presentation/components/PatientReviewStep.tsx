"use client";

import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { ReviewStep } from "@/components/onboarding/patient/steps/ReviewStep";
import type { WizardForm } from "@/types/wizard";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";

const reviewSchema = z.record(z.string(), z.unknown());

type FormValues = Record<string, unknown>;

export function PatientReviewStep() {
  const router = useRouter();
  const { state, completeOnboarding } = usePatientOnboarding();
  const [reviewData, setReviewData] = useState<WizardForm | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(reviewSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {},
  });

  // Get data from context state
  useEffect(() => {
    if (state?.draft) {
      // Use data from centralized state instead of localStorage
      const combinedData: WizardForm = {
        firstName: (state.draft.firstName as string) || "",
        lastName: (state.draft.lastName as string) || "",
        email: (state.draft.email as string) || "",
        phone: (state.draft.phone as string) || "",
        birthDay: (state.draft.birthDay as string) || "",
        birthMonth: (state.draft.birthMonth as string) || "",
        birthYear: (state.draft.birthYear as string) || "",
        gender: (state.draft.gender as string) || "",
        streetAddress: (state.draft.streetAddress as string) || "",
        city: (state.draft.city as string) || "",
        province: (state.draft.province as string) || "",
        postalCode: (state.draft.postalCode as string) || "",
        hasHealthCard: (state.draft.hasHealthCard as "yes" | "no") || "no",
        healthCardNumber: (state.draft.healthCardNumber as string) || "",
        selectedReason: (state.draft.selectedReason as string) || "",
        symptoms: (state.draft.symptoms as string) || "",
        emergencyContactRelationship: (state.draft.emergencyContactRelationship as string) || "",
        emergencyContactName: (state.draft.emergencyContactName as string) || "",
        emergencyContactPhone: (state.draft.emergencyContactPhone as string) || "",
        visitType: (state.draft.visitType as string) || "",
        doctorId: (state.draft.doctorId as string) || "",
        appointmentDate: (state.draft.appointmentDate as string) || "",
        appointmentTime: (state.draft.appointmentTime as string) || "",
      };

      setReviewData(combinedData);
      console.log("PatientReviewStep: Loaded data from context state:", combinedData);
    }
  }, [state]);

  const handleSubmit = async () => {
    try {
      console.log("Review submitted, booking appointment...");
      
      // Complete the onboarding process
      await completeOnboarding();
      
      // Navigate to confirmation page
      router.push("/onboarding/patient/confirmation");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
    // Navigate back to appointment step
    router.push("/onboarding/patient/doctor-selection");
  };

  // Get real-time form state updates
  // const { isValid } = useFormState({
  //   control: form.control,
  // });

  // Get personalized label function
  const getPersonalizedLabel = () => {
    return "Please review your information";
  };

  // Use reviewData from state
  const reviewFormValues = reviewData || {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    gender: "",
    streetAddress: "",
    city: "",
    province: "",
    postalCode: "",
    hasHealthCard: "",
    healthCardNumber: "",
    selectedReason: "",
    symptoms: "",
    emergencyContactRelationship: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    visitType: "",
    doctorId: "",
    appointmentDate: "",
    appointmentTime: "",
  };

  // Check if we have data to display
  const hasData = reviewData && Object.keys(reviewData).length > 0;
  const isDataLoading = !reviewData;

  // Skeleton loading component
  const SkeletonLoader = () => (
    <div className="space-y-6">
      {/* Appointment Summary Skeleton */}
      <div className="w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <div className="w-5 h-5 bg-primary/30 rounded animate-pulse"></div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-32"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-20"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
          </div>
        </div>
      </div>

      {/* Information Sections Skeleton */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-40"></div>
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <PatientStepShell
      title={getPersonalizedLabel()}
      description="Please review your information before booking your appointment"
      onBack={handleBack}
      onNext={handleSubmit}
      nextLabel="Book Appointment"
      isSubmitting={false}
      isNextDisabled={false} // Review step is always valid
      useCard={false}
      progressPercent={Math.round((14 / 15) * 100)}
      currentStep={14}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="max-w-4xl mx-auto">

          {/* Loading State */}
          {isDataLoading ? (
            <SkeletonLoader />
          ) : hasData ? (
            <ReviewStep
              getPersonalizedLabel={getPersonalizedLabel}
              formValues={reviewFormValues as WizardForm} // Use the direct draft data
            />
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                No data available to review
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Reload Page
              </button>
            </div>
          )}
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
