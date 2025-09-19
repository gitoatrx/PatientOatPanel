"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormInput } from "@/components/ui/form-input";
import { motion } from "framer-motion";
import { FormPhoneInput, FormSelect } from "@/components/ui";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";
import { getRouteFromApiStep, API_STEP_TO_ROUTE_MAP } from "@/lib/config/api";

const emergencyContactSchema = z
  .object({
    emergencyContactRelationship: z.string().min(1, "Please select an option"),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Only validate name and phone if a relationship is selected (not the "don't want to provide" option)
    if (
      data.emergencyContactRelationship &&
      data.emergencyContactRelationship !== "none"
    ) {
      // Validate emergency contact name
      if (
        !data.emergencyContactName ||
        data.emergencyContactName.trim() === ""
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Emergency contact name is required",
          path: ["emergencyContactName"],
        });
      }

      // Validate emergency contact phone
      if (
        !data.emergencyContactPhone ||
        data.emergencyContactPhone.trim() === ""
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Emergency contact phone is required",
          path: ["emergencyContactPhone"],
        });
      } else if (data.emergencyContactPhone.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid phone number (at least 10 digits)",
          path: ["emergencyContactPhone"],
        });
      }
    }
  });

type FormValues = z.infer<typeof emergencyContactSchema>;

const RELATIONSHIP_OPTIONS = [
  { value: "none", label: "I don't want to provide emergency contact" },
  { value: "spouse", label: "Spouse/Partner" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

export function PatientEmergencyContactStep() {
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  
  // Get step configuration
  const stepData = getStepComponentData("emergencyContact");

  // Get phone number from localStorage and fetch progress data
  useEffect(() => {
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
      
      if (progressResponse.success && progressResponse.data?.state?.emergency_contact) {
        const emergencyContact = progressResponse.data.state.emergency_contact;
        console.log('Prefilling emergency contact form with:', emergencyContact);
        
        // Prefill form with existing data
        form.setValue('emergencyContactName', emergencyContact.name || '');
        form.setValue('emergencyContactPhone', emergencyContact.phone || '');
        form.setValue('emergencyContactRelationship', emergencyContact.relationship || '');
      }
    } catch (error) {
      console.error('Error fetching progress for prefill:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(emergencyContactSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      emergencyContactRelationship: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
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
      console.log("Emergency contact submitted:", values);
      
      // Check if user doesn't want to provide emergency contact
      if (values.emergencyContactRelationship === "none") {
        // Navigate to doctor selection step
        router.push("/onboarding/patient/doctor-selection");
        return;
      }
      
      // Validate required fields for emergency contact
      if (!values.emergencyContactName || !values.emergencyContactPhone) {
        console.error("Emergency contact name and phone are required");
        return;
      }
      
      // Prepare emergency contact data for API
      const emergencyContactData = {
        name: values.emergencyContactName,
        relationship: values.emergencyContactRelationship,
        emergency_phone: values.emergencyContactPhone,
      };
      
      let apiResponse;
      try {
        // Call emergency contact API
        apiResponse = await patientService.saveEmergencyContact(phoneNumber, emergencyContactData);
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
        throw new Error(errorMessage);
      }
      
      if (apiResponse.success) {
        console.log("Emergency contact saved successfully:", apiResponse);
        
        try {
          // Save to centralized state
          await saveStep(stepData.stepId, {
            emergencyContactRelationship: values.emergencyContactRelationship,
            emergencyContactName: values.emergencyContactName,
            emergencyContactPhone: values.emergencyContactPhone,
            currentStep: apiResponse.data.current_step,
            status: apiResponse.data.status,
            guestPatientId: apiResponse.data.guest_patient_id,
            appointmentId: apiResponse.data.appointment_id,
          });
          
          // Navigate to next step based on API response (no success toast)
          const nextStep = apiResponse.data.current_step;
          const nextRoute = getRouteFromApiStep(nextStep);
          console.log(`Emergency contact API response:`, apiResponse);
          console.log(`Next step from API: ${nextStep}`);
          console.log(`Mapped route: ${nextRoute}`);
          console.log(`Navigating to: ${nextRoute}`);
          
          // Debug: Check if route mapping is working
          if (!nextRoute) {
            console.error(`No route found for step: ${nextStep}`);
            console.log('Available routes:', Object.keys(API_STEP_TO_ROUTE_MAP));
            // Fallback to doctor selection
            router.push("/onboarding/patient/doctor-selection");
          } else {
            router.push(nextRoute);
          }
        } catch (saveError) {
          console.error('Error saving step:', saveError);
          const errorMessage = 'Failed to save your information. Please try again.';
          
          // Show error toast IMMEDIATELY
          toast({
            variant: "error",
            title: "Save Error",
            description: errorMessage,
          });
          
          // Set error state after toast
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      } else {
        // Handle API error response
        const errorMessage = apiResponse.message || "Failed to save emergency contact information";
        
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
      throw new Error(errorMessage);
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
    // Navigate back to visit type step
    router.push("/onboarding/patient/visit-type");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  const formValues = form.watch();
  const selectedRelationship = formValues.emergencyContactRelationship;

  return (
    <PatientStepShell
      title="Who should we contact in case of emergency?"
      description="Please provide an emergency contact person we can reach if needed."
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
      isSubmitting={isLoading}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((11 / 15) * 100)}
      currentStep={11}
      totalSteps={15}
    >
        <FormProvider {...form}>
          <div className="max-w-xl mx-auto space-y-4">
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}
            
            <FormSelect
              name="emergencyContactRelationship"
              label="Relationship to you"
              placeholder="Select relationship"
              options={RELATIONSHIP_OPTIONS}
            />

            {selectedRelationship && selectedRelationship !== "none" && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FormInput
                  name="emergencyContactName"
                  type="text"
                  label="Emergency Contact Name"
                  placeholder="Enter emergency contact name"
                />

                <FormPhoneInput
                  name="emergencyContactPhone"
                  label="Emergency Contact Phone"
                />
              </motion.div>
            )}
          </div>
        </FormProvider>
      </PatientStepShell>
  );
}
