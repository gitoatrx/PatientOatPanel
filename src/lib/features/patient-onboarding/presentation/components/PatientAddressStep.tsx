"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlacesAddressFields } from "@/components/onboarding/common/PlacesAddressFields";
import { PatientStepShell } from "./PatientStepShell";
import { addressSchema } from "@/lib/utils/patientOnboardingValidation";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";
import { getRouteFromApiStep } from "@/lib/config/api";
import Image from "next/image";

export function PatientAddressStep() {
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  
  // Get step configuration
  const stepData = getStepComponentData("address");

  // Get phone number from localStorage and fetch progress data
  React.useEffect(() => {
    const savedPhone = localStorage.getItem('patient-phone-number');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      fetchProgressAndPrefillForm(savedPhone);
    } else {
      setIsLoadingProgress(false);
    }
  }, []);

  const fetchProgressAndPrefillForm = async (phone: string) => {
    try {
      setIsLoadingProgress(true);
      const progressResponse = await patientService.getOnboardingProgress(phone);
      
      if (progressResponse.success && progressResponse.data?.state?.address) {
        const address = progressResponse.data.state.address;
        
        // Prefill form with existing data
        form.setValue('streetAddress', address.address_line1 || '');
        form.setValue('city', address.city || '');
        form.setValue('province', address.state_province || '');
        form.setValue('postalCode', address.postal_code || '');
      }
    } catch (error) {
      console.error('Error fetching progress for prefill:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };
  
  const form = useForm({
    resolver: zodResolver(addressSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      streetAddress: "",
      city: "",
      province: "",
      postalCode: "",
    },
  });

  // Form prefilling is now handled by fetchProgressAndPrefillForm

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!phoneNumber) {
      console.error("No phone number found");
      return;
    }

    try {
      setError(null);
      
      // Prepare address data for API
      const addressData = {
        address_line1: values.streetAddress as string,
        address_line2: "", // Optional field, can be empty
        city: values.city as string,
        state_province: values.province as string,
        postal_code: values.postalCode as string,
        country: "Canada", // Default to India as shown in the API example
      };
      
      let apiResponse;
      try {
        // Call address API
        apiResponse = await patientService.saveAddress(phoneNumber, addressData);
      } catch (apiError) {
        console.error('API call failed:', apiError);
        const errorMessage = 'Network error. Please check your connection and try again.';
        
        // Show error toast IMMEDIATELY
        toast({
          variant: "error",
          title: "Network Error",
          description: errorMessage,
        });
        
        // Set error state after toast
        setError(errorMessage);
        return;
      }
      
      if (apiResponse.success) {
        
        // Navigate to next step based on API response (no success toast)
        const nextStep = apiResponse.data.current_step;
        const nextRoute = getRouteFromApiStep(nextStep);
        router.push(nextRoute);
      } else {
        // Handle API error response
        const errorMessage = apiResponse.message || "Failed to save address";
        
        // Show error toast IMMEDIATELY
        toast({
          variant: "error",
          title: "Save Failed",
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
    }
  };

  const handleBack = () => {
    // Navigate back to email step
    router.push("/onboarding/patient/email");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  // Show loading state while fetching progress data
  if (isLoadingProgress) {
    return (
      <PatientStepShell
        title="Loading..."
        description="Loading your information..."
        progressPercent={Math.round((8 / 15) * 100)}
        currentStep={8}
        totalSteps={15}
        useCard={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Image
              src="/loading.svg"
              alt="Loading"
              width={48}
              height={48}
              className="mx-auto mb-2"
            />
            <p className="text-sm text-muted-foreground">Loading your information...</p>
          </div>
        </div>
      </PatientStepShell>
    );
  }

  return (
    <PatientStepShell
      title="What’s your address?"
      description= "We need this for your medical record and to connect you with nearby clinics."
      onBack={handleBack}
      onNext={async () => {
        try {
          await form.handleSubmit(handleSubmit)();
        } catch (error) {
          // Error is already handled in handleSubmit, just re-throw for PatientStepShell
          throw error;
        }
      }}
      nextLabel="Continue"
      isSubmitting={form.formState.isSubmitting}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((8 / 15) * 100)}
      currentStep={8}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="max-w-xl mx-auto space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}
          
          <PlacesAddressFields
            fieldNames={{
              street: "streetAddress",
              city: "city",
              province: "province",
              postalCode: "postalCode",
            }}
            onValidNext={() => form.handleSubmit(handleSubmit)()}
          />
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
