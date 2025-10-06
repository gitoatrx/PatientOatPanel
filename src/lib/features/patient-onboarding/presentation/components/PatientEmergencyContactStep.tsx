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
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, UserX, CheckCircle, Edit, Trash2 } from "lucide-react";

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
  { value: "spouse", label: "Spouse/Partner" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

// Flow states for different user types
type FlowState = 'initial' | 'new-patient-decision' | 'new-patient-form' | 'returning-patient-confirmation' | 'returning-patient-edit' | 'returning-patient-remove';

export function PatientEmergencyContactStep() {
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [flowState, setFlowState] = useState<FlowState>('initial');
  const [isNewPatient, setIsNewPatient] = useState<boolean>(false);
  const [existingEmergencyContact, setExistingEmergencyContact] = useState<{
    name: string;
    relationship: string;
    phone: string;
  } | null>(null);
  
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
      
      if (progressResponse.success && progressResponse.data?.state) {
        const state = progressResponse.data.state;
        
        // Check if patient has existing emergency contact
        if (state.emergency_contact && state.emergency_contact.name) {
          // Returning patient with existing emergency contact
          setIsNewPatient(false);
          setExistingEmergencyContact({
            name: state.emergency_contact.name,
            relationship: state.emergency_contact.relationship,
            phone: state.emergency_contact.phone
          });
          setFlowState('returning-patient-confirmation');
          
          // Prefill form with existing data
          form.setValue('emergencyContactName', state.emergency_contact.name);
          form.setValue('emergencyContactPhone', state.emergency_contact.phone);
          form.setValue('emergencyContactRelationship', state.emergency_contact.relationship);
        } else {
          // New patient or returning patient without emergency contact
          setIsNewPatient(true);
          setFlowState('new-patient-decision');
        }
      } else {
        // New patient
        setIsNewPatient(true);
        setFlowState('new-patient-decision');
      }
    } catch (error) {
      console.error('Error fetching progress for prefill:', error);
      // Default to new patient flow on error
      setIsNewPatient(true);
      setFlowState('new-patient-decision');
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
      
      // Handle different flow states
      if (flowState === 'new-patient-decision') {
        // User chose not to provide emergency contact
        router.push("/onboarding/patient/health-concern");
        return;
      }
      
      if (flowState === 'returning-patient-confirmation') {
        // User confirmed existing contact, proceed to next step
        router.push("/onboarding/patient/health-concern");
        return;
      }
      
      if (flowState === 'returning-patient-remove') {
        // User wants to remove existing contact
        // TODO: Call API to remove emergency contact
        router.push("/onboarding/patient/health-concern");
        return;
      }
      
      // For new-patient-form and returning-patient-edit states
      // Validate required fields for emergency contact
      if (!values.emergencyContactName || !values.emergencyContactPhone || !values.emergencyContactRelationship) {
        console.error("Emergency contact name, phone, and relationship are required");
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
        
        // Navigate to next step based on API response (no success toast)
        const nextStep = apiResponse.data.current_step;
        const nextRoute = getRouteFromApiStep(nextStep);
        
        // Debug: Check if route mapping is working
        if (!nextRoute) {
          console.error(`No route found for step: ${nextStep}`);
          // Fallback to health concern step
          router.push("/onboarding/patient/health-concern");
        } else {
          router.push(nextRoute);
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
    // Navigate back to address step
    router.push("/onboarding/patient/address");
  };

  // Helper functions for flow actions
  const handleNewPatientDecision = (wantsToAdd: boolean) => {
    if (wantsToAdd) {
      setFlowState('new-patient-form');
    } else {
      setFlowState('new-patient-decision');
      // Navigate to next step without emergency contact
      router.push("/onboarding/patient/health-concern");
    }
  };

  const handleReturningPatientAction = (action: 'keep' | 'update' | 'remove') => {
    switch (action) {
      case 'keep':
        setFlowState('returning-patient-confirmation');
        router.push("/onboarding/patient/health-concern");
        break;
      case 'update':
        setFlowState('returning-patient-edit');
        break;
      case 'remove':
        setFlowState('returning-patient-remove');
        router.push("/onboarding/patient/health-concern");
        break;
    }
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  const formValues = form.watch();
  const selectedRelationship = formValues.emergencyContactRelationship;

  // Show loading state while fetching progress data
  if (isLoadingProgress) {
    return (
      <PatientStepShell
        title="Loading..."
        description="Loading your information..."
        progressPercent={Math.round((9 / 15) * 100)}
        currentStep={9}
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

  // Get title and description based on flow state
  const getTitleAndDescription = () => {
    switch (flowState) {
      case 'new-patient-decision':
        return {
          title: "Emergency Contact",
          description: "Tell us who we should reach if needed."
        };
      case 'new-patient-form':
        return {
          title: "Emergency Contact",
          description: "Tell us who we should reach if needed."
        };
      case 'returning-patient-confirmation':
        return {
          title: "Emergency Contact",
          description: "Confirm or update the details we have on file."
        };
      case 'returning-patient-edit':
        return {
          title: "Emergency Contact",
          description: "Update the details we have on file."
        };
      default:
        return {
          title: "Emergency Contact",
          description: "Tell us who we should reach if needed."
        };
    }
  };

  const { title, description } = getTitleAndDescription();

  return (
    <PatientStepShell
      title={title}
      description={description}
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
      progressPercent={Math.round((9 / 15) * 100)}
      currentStep={9}
      totalSteps={15}
    >
        <div className="max-w-xl mx-auto space-y-6 w-full overflow-hidden">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mx-4 sm:mx-0">
              <p className="text-sm text-destructive font-medium break-words">{error}</p>
            </div>
          )}

          {/* New Patient Decision Flow */}
          {flowState === 'new-patient-decision' && (
            <div className="space-y-4 px-4 sm:px-0">
              <div className="text-left space-y-4">
                <p className="text-muted-foreground text-base px-2">Would you like to provide an emergency contact?</p>
                <div className="flex flex-col gap-4 w-full">
                  <Card 
                    className="cursor-pointer p-0 border border-primary/30 bg-white shadow-sm hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md transition-all duration-200"
                    onClick={() => handleNewPatientDecision(true)}
                  >
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center p-2 group-hover:bg-blue-100">
                          <UserPlus className="h-6 w-6 text-primary group-hover:text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-foreground leading-tight group-hover:text-blue-700">Yes, add contact</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1.5 group-hover:text-blue-600">Provide emergency contact details</p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                  
                  <Card 
                    className="cursor-pointer border border-muted-foreground/30 p-0 bg-white shadow-sm hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md transition-all duration-200"
                    onClick={() => handleNewPatientDecision(false)}
                  >
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-muted-foreground/15 flex items-center justify-center p-2 group-hover:bg-blue-100">
                          <UserX className="h-6 w-6 text-muted-foreground group-hover:text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-foreground leading-tight group-hover:text-blue-700">No, I don&apos;t want to provide one</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1.5 group-hover:text-blue-600">Skip emergency contact for now</p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* New Patient Form Flow */}
          {flowState === 'new-patient-form' && (
            <FormProvider {...form}>
              <div className="space-y-6 px-4 sm:px-0">
                <FormSelect
                  name="emergencyContactRelationship"
                  label="Relationship to you"
                  placeholder="Select relationship"
                  options={RELATIONSHIP_OPTIONS}
                />

                <FormInput
                  name="emergencyContactName"
                  type="text"
                  label="Contact Name"
                  placeholder="Enter contact name"
                />

                <FormPhoneInput
                  name="emergencyContactPhone"
                  label="Contact Phone"
                />
              </div>
            </FormProvider>
          )}

          {/* Returning Patient Confirmation Flow */}
          {flowState === 'returning-patient-confirmation' && existingEmergencyContact && (
            <div className="space-y-4 px-4 sm:px-0">
              <div className="bg-muted/30 border border-border/50 p-4 sm:p-6 rounded-lg space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Relationship to you</label>
                  <p className="text-base capitalize font-medium break-words">{existingEmergencyContact.relationship}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Contact Name</label>
                  <p className="text-base font-medium break-words">{existingEmergencyContact.name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Contact Phone</label>
                  <p className="text-base font-medium break-words">{existingEmergencyContact.phone}</p>
                </div>
              </div>
              
              <div className="space-y-3 w-full">
                <Button
                  onClick={() => handleReturningPatientAction('keep')}
                  size="lg"
                  className="w-full text-lg cursor-pointer"
                >
                  Yes, keep this contact
                </Button>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    variant="outline"
                    onClick={() => handleReturningPatientAction('update')}
                    size="lg"
                    className="w-full text-lg cursor-pointer"
                  >
                    Update contact
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReturningPatientAction('remove')}
                    size="lg"
                    className="w-full text-lg cursor-pointer"
                  >
                    Remove contact
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Returning Patient Edit Flow */}
          {flowState === 'returning-patient-edit' && (
            <FormProvider {...form}>
              <div className="space-y-6 px-4 sm:px-0">
                <FormSelect
                  name="emergencyContactRelationship"
                  label="Relationship to you"
                  placeholder="Select relationship"
                  options={RELATIONSHIP_OPTIONS}
                />

                <FormInput
                  name="emergencyContactName"
                  type="text"
                  label="Contact Name"
                  placeholder="Enter contact name"
                />

                <FormPhoneInput
                  name="emergencyContactPhone"
                  label="Contact Phone"
                />
              </div>
            </FormProvider>
          )}
        </div>
      </PatientStepShell>
  );
}
