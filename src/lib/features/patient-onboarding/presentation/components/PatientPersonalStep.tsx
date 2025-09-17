"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormInput } from "@/components/ui/form-input";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

const alphaOnly = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
const schema = z.object({
  firstName: z
    .string()
    .min(2, "First name is required")
    .regex(alphaOnly, "Only letters, spaces, hyphens, and apostrophes"),
  lastName: z
    .string()
    .min(2, "Last name is required")
    .regex(alphaOnly, "Only letters, spaces, hyphens, and apostrophes"),
});

type FormValues = z.infer<typeof schema>;

export function PatientPersonalStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();
  
  // Get step configuration
  const stepData = getStepComponentData("personal");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { 
      firstName: (state?.draft?.firstName as string) || "", 
      lastName: (state?.draft?.lastName as string) || "" 
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log("Personal info submitted:", values);
      
      // Save to centralized state
      const result = await saveStep(stepData.stepId, {
        firstName: values.firstName,
        lastName: values.lastName,
      });
      
      // Navigate to gender step
      router.push("/onboarding/patient/gender");
    } catch (error) {
      console.error("Error saving personal info:", error);
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
    // Navigate back to health card step
    router.push("/onboarding/patient/health-card");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  return (
    <PatientStepShell
      title="Personal Information"
      description="Tell us about yourself"
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((4 / 15) * 100)}
      currentStep={4}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="max-w-xl mx-auto space-y-6">
          <div className="space-y-4">
            <FormInput
              name="firstName"
              label="First Name"
              placeholder="Enter your first name"
              autoComplete="given-name"
            />

            <FormInput
              name="lastName"
              label="Last Name"
              placeholder="Enter your last name"
              autoComplete="family-name"
            />
          </div>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
