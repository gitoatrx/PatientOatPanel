"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";
import { getRouteFromApiStep } from "@/lib/config/api";

const dateOfBirthSchema = z
  .object({
    birthDay: z
      .string()
      .min(1, "Day is required")
      .refine((val) => {
        const day = parseInt(val);
        return !isNaN(day) && day >= 1 && day <= 31;
      }, "Please enter a valid day (1-31)"),
    birthMonth: z
      .string()
      .min(1, "Month is required")
      .refine((val) => {
        const month = parseInt(val);
        return !isNaN(month) && month >= 1 && month <= 12;
      }, "Please select a valid month"),
    birthYear: z
      .string()
      .min(1, "Year is required")
      .refine((val) => {
        const year = parseInt(val);
        const currentYear = new Date().getFullYear();
        return !isNaN(year) && year >= 1900 && year <= currentYear;
      }, "Please enter a valid year (1900 to current year)"),
  })
  .refine(
    (data) => {
      // Only validate date combination if all fields are filled and pass individual validation
      if (!data.birthDay || !data.birthMonth || !data.birthYear) {
        return true; // Skip validation if any field is empty
      }

      const day = parseInt(data.birthDay);
      const month = parseInt(data.birthMonth);
      const year = parseInt(data.birthYear);

      // Skip validation if any field is invalid (let individual field validation handle it)
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return true;
      }

      // Skip validation if individual field validations would fail
      if (
        day < 1 ||
        day > 31 ||
        month < 1 ||
        month > 12 ||
        year < 1900 ||
        year > new Date().getFullYear()
      ) {
        return true;
      }

      // Now validate that the date combination is actually valid
      const date = new Date(year, month - 1, day);

      // Check if the date is valid and matches the input values
      return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      );
    },
    {
      message:
        "Please enter a valid date (e.g., February doesn't have 31 days)",
      path: ["birthDay"], // Show error on the day field
    },
  );

type FormValues = z.infer<typeof dateOfBirthSchema>;

export function PatientDateOfBirthStep() {
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  
  // Get step configuration
  const stepData = getStepComponentData("dateOfBirth");

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
      
      if (progressResponse.success && progressResponse.data?.state?.personal_info?.date_of_birth) {
        const dateOfBirth = progressResponse.data.state.personal_info.date_of_birth;
        console.log('Prefilling date of birth form with:', dateOfBirth);
        
        // Parse the date string (format: "1986-04-15")
        const [year, month, day] = dateOfBirth.split('-');
        
        // Prefill form with existing data
        form.setValue('birthYear', year || '');
        form.setValue('birthMonth', month ? parseInt(month).toString() : ''); // Remove leading zero: "04" -> "4"
        form.setValue('birthDay', day || '');
      }
    } catch (error) {
      console.error('Error fetching progress for prefill:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(dateOfBirthSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { 
      birthDay: "", 
      birthMonth: "", 
      birthYear: "" 
    },
  });

  // Form prefilling is now handled by fetchProgressAndPrefillForm

  const handleSubmit = async (values: FormValues) => {
    if (!phoneNumber) {
      console.error("No phone number found");
      return;
    }

    try {
      setError(null);
      console.log("Date of birth submitted:", values);
      
      // Format date of birth as YYYY-MM-DD
      const dateOfBirth = `${values.birthYear}-${values.birthMonth.padStart(2, '0')}-${values.birthDay.padStart(2, '0')}`;
      
      let apiResponse;
      try {
        // Call personal info step 3 API
        apiResponse = await patientService.savePersonalInfoStep3(phoneNumber, {
          date_of_birth: dateOfBirth,
        });
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
        console.log("Date of birth saved successfully:", apiResponse);
        
        // Navigate to next step based on API response (no success toast)
        const nextStep = apiResponse.data.current_step;
        const nextRoute = getRouteFromApiStep(nextStep);
        console.log(`Date of birth API response:`, apiResponse);
        console.log(`Next step from API: ${nextStep}`);
        console.log(`Mapped route: ${nextRoute}`);
        console.log(`Navigating to: ${nextRoute}`);
        router.push(nextRoute);
      } else {
        // Handle API error response
        const errorMessage = apiResponse.message || "Failed to save date of birth";
        
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
    console.log("Back button clicked");
    // Navigate back to gender step
    router.push("/onboarding/patient/gender");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  // Generate month options
  const monthOptions = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handleDateChange = (field: string, value: string) => {
    form.setValue(field as keyof FormValues, value, { shouldValidate: true });

    // Auto-advance to next field when current field is complete
    if (field === "birthDay" && value.length === 2) {
      const monthInput = document.querySelector(
        'select[name="birthMonth"]',
      ) as HTMLSelectElement;
      if (monthInput) monthInput.focus();
    } else if (field === "birthMonth" && value.length > 0) {
      const yearInput = document.querySelector(
        'input[name="birthYear"]',
      ) as HTMLInputElement;
      if (yearInput) yearInput.focus();
    }
  };

  // Show loading state while fetching progress data
  if (isLoadingProgress) {
    return (
      <PatientStepShell
        title="Loading..."
        description="Loading your information..."
        progressPercent={Math.round((6 / 15) * 100)}
        currentStep={6}
        totalSteps={15}
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
      title="When were you born?"
      description="We need this information for your medical records."
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
      progressPercent={Math.round((6 / 15) * 100)}
      currentStep={6}
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
          
          <div className="grid grid-cols-12 gap-1 sm:gap-4">
            <div className="col-span-3 sm:col-span-3">
              <FormInput
                name="birthDay"
                type="text"
                label="Day"
                placeholder="DD"
                maxLength={2}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  handleDateChange("birthDay", value);
                }}
              />
            </div>
            <div className="col-span-6 sm:col-span-5">
              <FormSelect
                name="birthMonth"
                label="Month"
                placeholder="Select month"
                options={monthOptions}
              />
            </div>
            <div className="col-span-3 sm:col-span-4">
              <FormInput
                name="birthYear"
                type="text"
                label="Year"
                placeholder="YYYY"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  handleDateChange("birthYear", value);
                }}
              />
            </div>
          </div>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
