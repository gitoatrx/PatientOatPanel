"use client";

"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { PatientStepShell } from "./PatientStepShell";
import { DoctorList } from "@/components/onboarding/patient/doctor/DoctorList";
// Removed usePatientOnboarding context - using progress API instead
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";
import { Provider } from "@/lib/types/api";
import { useToast } from "@/components/ui/use-toast";
import { getRouteFromApiStep } from "@/lib/config/api";

// Doctor data interface
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  nextAvailable: string;
  rating: number;
  yearsOfExperience?: number;
  clinic?: string;
}

// Form schema for doctor selection
const doctorSelectionSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
});

type DoctorSelectionFormData = z.infer<typeof doctorSelectionSchema>;

export function PatientDoctorSelectionStep() {
  const router = useRouter();
  const { toast } = useToast();
  const stepData = getStepComponentData("doctorSelection");
  
  // Dynamic state for providers
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState<boolean>(true);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [visitName, setVisitName] = useState<string>("");

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
      
      if (progressResponse.success && progressResponse.data?.state) {
        const state = progressResponse.data.state;
        
        // Extract visit_name for providers API
        if (state.visit_type?.name) {
          setVisitName(state.visit_type.name);
          console.log('Visit name extracted:', state.visit_type.name);
        }
        
        // Prefill form with existing provider data
        if (state.provider?.id) {
          const provider = state.provider;
          console.log('Prefilling provider selection form with:', provider);
          form.setValue('doctorId', provider.id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching progress for prefill:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  // Load providers from API
  useEffect(() => {
    const loadProviders = async () => {
      // Don't load providers until we have visitName
      if (!visitName) {
        console.log('Waiting for visit name before loading providers...');
        return;
      }

      try {
        setIsLoadingProviders(true);
        setProvidersError(null);
        
        console.log('Loading providers with visit_name:', visitName, 'and search:', searchTerm);
        const response = await patientService.getProvidersList(searchTerm, visitName);
        
        if (response.success && response.data) {
          setProviders(response.data);
          console.log("Providers loaded successfully:", response.data);
        } else {
          setProvidersError(response.message || "Failed to load providers");
          console.error("Failed to load providers:", response.message);
        }
      } catch (error) {
        console.error("Error loading providers:", error);
        setProvidersError("Failed to load providers. Please try again.");
      } finally {
        setIsLoadingProviders(false);
      }
    };

    loadProviders();
  }, [searchTerm, visitName]);

  // Initialize form hook unconditionally to preserve hooks order
  const form = useForm<DoctorSelectionFormData>({
    resolver: zodResolver(doctorSelectionSchema),
    defaultValues: {
      doctorId: "",
    },
  });

  // Convert Provider data to Doctor format for DoctorList component
  const convertProvidersToDoctors = (providers: Provider[]): Doctor[] => {
    return providers.map(provider => ({
      id: provider.id.toString(),
      name: `${provider.first_name} ${provider.last_name}`.trim(),
      specialty: provider.specialty,
      nextAvailable: "Available", // Default since API doesn't provide availability
      rating: 4.5, // Default rating since API doesn't provide this
      yearsOfExperience: undefined, // Not provided by API
      clinic: undefined, // Not provided by API
    }));
  };

  // Removed state null check - using progress API instead

  const handleSubmit = async (data: DoctorSelectionFormData) => {
    if (!phoneNumber) {
      console.error("No phone number found");
      setError("Phone number not found. Please start over.");
      return;
    }

    try {
      setError(null);
      console.log("Provider selection submitted:", data);
      
      // Use the phoneNumber state that was fetched from localStorage
      const providerId = parseInt(data.doctorId);
      
      // Call provider selection API
      const apiResponse = await patientService.saveProviderSelection(phoneNumber, providerId);
      
      if (apiResponse.success) {
        console.log("Provider selection saved successfully:", apiResponse);
        
        // Navigate to next step based on API response (no success toast)
        const nextStep = apiResponse.data.current_step;
        const nextRoute = getRouteFromApiStep(nextStep);
        console.log(`Provider selection API response:`, apiResponse);
        console.log(`Next step from API: ${nextStep}`);
        console.log(`Mapped route: ${nextRoute}`);
        console.log(`Navigating to: ${nextRoute}`);
        router.push(nextRoute);
      } else {
        // Handle API error response
        const errorMessage = apiResponse.message || "Failed to save provider selection";
        
        // Show error toast IMMEDIATELY
        toast({
          variant: "error",
          title: "Save Failed",
          description: errorMessage,
        });
        
        // Set error state after toast
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      // Handle unexpected errors
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
      throw new Error(errorMessage);
    }
  };

  const handleBack = () => {
    router.push("/onboarding/patient/emergency-contact");
  };

  // Show loading state while fetching progress data
  if (isLoadingProgress) {
    return (
      <PatientStepShell
        title="Loading..."
        description="Loading your information..."
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
        useCard={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading your information...</p>
          </div>
        </div>
      </PatientStepShell>
    );
  }

  return (
    <PatientStepShell
      title="Choose Your Doctor"
      description="Select a healthcare provider that best fits your needs"
      progressPercent={stepData.progressPercent}
      currentStep={stepData.currentStep}
      totalSteps={stepData.totalSteps}
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
      isNextDisabled={!form.watch("doctorId")}
      useCard={false}
    >
      <FormProvider {...form}>
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Loading State with Skeleton */}
          {isLoadingProviders && (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    {/* Avatar Skeleton */}
                    <div className="size-12 bg-muted rounded-full"></div>
                    
                    {/* Content Skeleton */}
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                    
                    {/* Selector Skeleton */}
                    <div className="size-6 bg-muted rounded-full"></div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-center mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                <p className="text-sm text-muted-foreground">Loading providers...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {providersError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">{providersError}</p>
            </div>
          )}

          {/* Providers List */}
          {!isLoadingProviders && !providersError && (
            <section aria-labelledby="available-specialists-heading" className="space-y-3">
              <DoctorList 
                doctors={convertProvidersToDoctors(providers)} 
                showSearch={true}
              />
            </section>
          )}

          {/* No Providers Available */}
          {!isLoadingProviders && !providersError && providers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No providers available at the moment.</p>
            </div>
          )}
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
