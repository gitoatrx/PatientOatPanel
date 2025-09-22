"use client";

import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { ReviewStep } from "@/components/onboarding/patient/steps/ReviewStep";
import type { WizardForm } from "@/types/wizard";
import { useRouter } from "next/navigation";
import { patientService } from "@/lib/services/patientService";
import { useToast } from "@/components/ui/use-toast";

const reviewSchema = z.record(z.string(), z.unknown());

type FormValues = Record<string, unknown>;

export function PatientReviewStep() {
  const router = useRouter();
  const { toast } = useToast();
  const [reviewData, setReviewData] = useState<WizardForm | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(reviewSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {},
  });

  // Get phone number from localStorage and fetch progress data
  React.useEffect(() => {
    const savedPhone = localStorage.getItem('patient-phone-number');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      fetchProgressAndPrefillForm(savedPhone);
    } else {
      setIsLoadingProgress(false);
      setError("Phone number not found. Please start over.");
    }
  }, []);

  const fetchProgressAndPrefillForm = async (phone: string) => {
    try {
      setIsLoadingProgress(true);
      setError(null);
      const progressResponse = await patientService.getOnboardingProgress(phone);
      
      if (progressResponse.success && progressResponse.data?.state) {
        const state = progressResponse.data.state;
        console.log('Prefilling review form with progress data:', state);
        
        // Map API response data to review form structure
        const combinedData: WizardForm = {
          firstName: state.personal_info?.first_name || "",
          lastName: state.personal_info?.last_name || "",
          email: state.personal_info?.email || "",
          phone: state.contact?.phone || "",
          birthDay: state.personal_info?.date_of_birth ? new Date(state.personal_info.date_of_birth).getDate().toString() : "",
          birthMonth: state.personal_info?.date_of_birth ? (new Date(state.personal_info.date_of_birth).getMonth() + 1).toString() : "",
          birthYear: state.personal_info?.date_of_birth ? new Date(state.personal_info.date_of_birth).getFullYear().toString() : "",
          gender: state.personal_info?.gender || "",
          streetAddress: state.address?.address_line1 || "",
          city: state.address?.city || "",
          province: state.address?.state_province || "",
          postalCode: state.address?.postal_code || "",
          hasHealthCard: state.health_card?.health_card_number ? "yes" : "no",
          healthCardNumber: state.health_card?.health_card_number || "",
          selectedReason: state.health_concerns?.selected_labels?.[0] || "",
          symptoms: state.health_concerns?.free_text?.join('\n') || "",
          emergencyContactRelationship: state.emergency_contact?.relationship || "",
          emergencyContactName: state.emergency_contact?.name || "",
          emergencyContactPhone: state.emergency_contact?.phone || "",
          visitType: state.visit_type?.name || "",
          doctorId: state.provider ? `${state.provider.first_name} ${state.provider.last_name}` : "",
          appointmentDate: state.appointment?.date || "",
          appointmentTime: state.appointment?.time || "",
        };

        setReviewData(combinedData);
        console.log("PatientReviewStep: Loaded data from progress API:", combinedData);
      } else {
        console.log('Review step - no progress data available yet');
        setError("No progress data found. Please complete the onboarding process first.");
      }
    } catch (error) {
      console.error('Error fetching progress for review:', error);
      setError("Failed to load your information. Please try again.");
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const handleSubmit = async () => {
    if (!phoneNumber) {
      console.error("No phone number found");
      setError("Phone number not found. Please start over.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      console.log("Review submitted, confirming appointment...");
      
      // Call confirm appointment API to complete the onboarding process
      const apiResponse = await patientService.confirmAppointment(phoneNumber);
      
      if (apiResponse.success) {
        console.log("Appointment confirmed successfully:", apiResponse);
        
        // Store confirmation details in localStorage for the confirmation page
        if (apiResponse.data) {
          localStorage.setItem('appointment-confirmation', JSON.stringify({
            appointment_id: apiResponse.data.appointment_id,
            confirmation_number: apiResponse.data.confirmation_number,
            phone: phoneNumber
          }));
        }
        
        // Navigate to confirmation page
        router.push("/onboarding/patient/confirmation");
      } else {
        // Handle API error response
        const errorMessage = apiResponse.message || "Failed to confirm appointment";
        
        // Show error toast IMMEDIATELY
        toast({
          variant: "error",
          title: "Confirmation Failed",
          description: errorMessage,
        });
        
        // Set error state after toast
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Unexpected error in handleSubmit:', err);
      
      // Handle different error types
      let errorMessage = '';
      let errorTitle = 'Unexpected Error';
      
      if (err instanceof Error) {
        if (err.message.includes('Network error')) {
          errorMessage = 'Network error. Please check your connection and try again.';
          errorTitle = 'Network Error';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
          errorTitle = 'Request Timeout';
        } else {
          errorMessage = `Error: ${err.message}`;
          errorTitle = 'Error';
        }
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
        errorTitle = 'Unexpected Error';
      }
      
      // Show error toast IMMEDIATELY
      toast({
        variant: "error",
        title: errorTitle,
        description: errorMessage,
      });
      
      // Set error state after toast
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
    // Navigate back to appointment date/time step
    router.push("/onboarding/patient/appointment-datetime");
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
  const isDataLoading = isLoadingProgress;

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
      isSubmitting={isSubmitting}
      isNextDisabled={isSubmitting} // Disable button while submitting
      useCard={false}
      progressPercent={Math.round((14 / 15) * 100)}
      currentStep={14}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="max-w-4xl mx-auto">

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                {error}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Reload Page
              </button>
            </div>
          )}

          {/* Loading State */}
          {isDataLoading && !error ? (
            <SkeletonLoader />
          ) : hasData && !error ? (
            <ReviewStep
              getPersonalizedLabel={getPersonalizedLabel}
              formValues={reviewFormValues as WizardForm}
            />
          ) : !error ? (
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
          ) : null}
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
