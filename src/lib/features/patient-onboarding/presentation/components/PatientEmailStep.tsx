"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormInput } from "@/components/ui/form-input";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof emailSchema>;

export function PatientEmailStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();
  
  // Get step configuration
  const stepData = getStepComponentData("email");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(emailSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { 
      email: (state?.draft?.email as string) || "" 
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log("Email submitted:", values);
      
      // Save to centralized state
      const result = await saveStep(stepData.stepId, {
        email: values.email,
      });
      
      // Navigate to address step
      router.push("/onboarding/patient/address");
    } catch (error) {
      console.error("Error saving email:", error);
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
    // Navigate back to date of birth step
    router.push("/onboarding/patient/date-of-birth");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  return (
    <PatientStepShell
      title="What's your email address?"
      description="We'll use this to send you appointment confirmations and updates."
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((7 / 15) * 100)}
      currentStep={7}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="max-w-xl mx-auto space-y-6">
          <FormInput
            name="email"
            type="email"
            label="Email Address"
            placeholder="your.email@example.com"
            autoComplete="email"
          />
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
