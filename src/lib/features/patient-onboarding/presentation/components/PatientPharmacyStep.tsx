"use client";

import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { PharmacyStep } from "@/components/onboarding/patient/steps/PharmacyStep";
import type { WizardForm } from "@/types/wizard";
import { useRouter } from "next/navigation";
import { patientService } from "@/lib/services/patientService";
import { getRouteFromApiStep } from "@/lib/config/api";

const pharmacySchema = z.record(z.string(), z.unknown());

type FormValues = Record<string, unknown>;

export function PatientPharmacyStep() {
  const router = useRouter();
  const [pharmacyData, setPharmacyData] = useState<WizardForm | null>(null);
  const [pharmacySelection, setPharmacySelection] = useState<{pharmacyOption?: string, selectedPharmacy?: {id: number, name: string, address: string, city: string, province: string, phone: string}}>({});
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(pharmacySchema),
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

  // Listen for pharmacy selection changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      const pharmacyDataStr = localStorage.getItem('pharmacy-data');
      if (pharmacyDataStr) {
        const data = JSON.parse(pharmacyDataStr);
        setPharmacySelection(data);
      }
    };

    // Check initial state
    handleStorageChange();

    // Listen for changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for same-tab changes
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const fetchProgressAndPrefillForm = async (phone: string) => {
    try {
      setIsLoadingProgress(true);
      setError(null);
      const progressResponse = await patientService.getOnboardingProgress(phone);
      
      if (progressResponse.success && progressResponse.data?.state) {
        const state = progressResponse.data.state;

        // Map API response data to pharmacy form structure
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

        setPharmacyData(combinedData);
      } else {
        setError("No progress data found. Please complete the onboarding process first.");
      }
    } catch (error) {
      setError("Failed to load your information. Please try again.");
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const handleNext = async () => {
    if (!phoneNumber) {
      setError("Phone number not found. Please start over.");
      return;
    }

    // Validate that if pickup is selected, a pharmacy must be selected
    if (pharmacySelection.pharmacyOption === 'pickup' && !pharmacySelection.selectedPharmacy) {
      setError("Please select a pharmacy for pickup.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Prepare fulfillment data for API
      const fulfillmentData = {
        method: (pharmacySelection.pharmacyOption as 'pickup' | 'delivery') || 'delivery',
        ...(pharmacySelection.pharmacyOption === 'pickup' && pharmacySelection.selectedPharmacy && { 
          pharmacy_id: pharmacySelection.selectedPharmacy.id 
        })
      };
      
      // Call fulfillment API with decision action telemetry
      const apiResponse = await patientService.saveFulfillment(phoneNumber, fulfillmentData, "start_new");
      
      if (apiResponse.success) {
        // Navigate to next step based on API response
        const nextStep = apiResponse.data.current_step;
        const nextRoute = getRouteFromApiStep(nextStep);
        router.push(nextRoute);
      } else {
        // Handle API error response
        const errorMessage = apiResponse.message || "Failed to save fulfillment preference";
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Unexpected error in handleNext:', err);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    // Navigate back to appointment date/time step
    router.push("/onboarding/patient/appointment-datetime");
  };

  // Get personalized label function
  const getPersonalizedLabel = () => {
    return "Choose Your Pharmacy";
  };

  const getDescription = () => {
    return "Select how you'd like to receive your medication";
  };

  // Use pharmacyData from state
  const pharmacyFormValues = pharmacyData || {
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
  const hasData = pharmacyData && Object.keys(pharmacyData).length > 0;
  const isDataLoading = isLoadingProgress;

  // Skeleton loading component
  const SkeletonLoader = () => (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-96 mx-auto"></div>
      </div>

      {/* Options Skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <PatientStepShell
      title=""
      description=""
      onBack={handleBack}
      onNext={handleNext}
      nextLabel="Continue"
      isSubmitting={isSubmitting}
      isNextDisabled={isSubmitting || (pharmacySelection.pharmacyOption === 'pickup' && !pharmacySelection.selectedPharmacy)}
      useCard={false}
      progressPercent={Math.round((13 / 15) * 100)}
      currentStep={13}
      totalSteps={15}
    >
      <FormProvider {...form}>
        {/* Static Title and Description */}
        <div className="pt-8">
          <h1 className="text-2xl font-semibold text-left mb-2">
            Choose Your Pharmacy
          </h1>
          <p className="text-sm text-muted-foreground text-left mb-8">
            Select how you'd like to receive your medication
          </p>
        </div>
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
        ) : (
          <PharmacyStep
            formValues={pharmacyFormValues as WizardForm}
          />
        )}
      </FormProvider>
    </PatientStepShell>
  );
}
