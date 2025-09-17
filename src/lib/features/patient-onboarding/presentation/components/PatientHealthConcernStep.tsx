"use client";

import { useEffect } from "react";
import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { Combobox } from "@/components/ui/combobox";
import { getHealthConditions } from "@/lib/constants/medical-specialties";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";
import { useSmartBackNavigation } from "../hooks/useSmartBackNavigation";
import { FormTextarea } from "@/components/ui";

const healthConcernSchema = z.object({
  selectedReason: z.string().min(1, "Please select a health concern"),
  symptoms: z
    .string()
    .min(1, "Please describe your symptoms")
    .min(10, "Please provide more details about your symptoms"),
});

type FormValues = z.infer<typeof healthConcernSchema>;

export function PatientHealthConcernStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();

  // Get health concern from localStorage
  const getStoredHealthConcern = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedHealthConcern");
    }
    return null;
  };
  const { handleSmartBack } = useSmartBackNavigation();

  // Get step configuration from centralized config
  const stepData = getStepComponentData("healthConcern");

  const form = useForm<FormValues>({
    resolver: zodResolver(healthConcernSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { selectedReason: "", symptoms: "" },
  });

  const healthConditions = getHealthConditions();

  // Prefill from onboarding state (draft)
  useEffect(() => {
    if (!state?.draft) return;

    const draft = state.draft;
    console.log(
      "PatientHealthConcernStep: Populating form with draft data:",
      draft,
    );

    let hasChanges = false;

    // Check localStorage first, then draft
    const storedHealthConcern = getStoredHealthConcern();
    const healthConcernToUse = storedHealthConcern || draft.selectedReason;

    if (healthConcernToUse && !form.getValues("selectedReason")) {
      form.setValue("selectedReason", healthConcernToUse as string, {
        shouldDirty: false,
        shouldValidate: true,
      });
      hasChanges = true;
    }
    if (draft.symptoms && !form.getValues("symptoms")) {
      form.setValue("symptoms", draft.symptoms as string, {
        shouldDirty: false,
        shouldValidate: true,
      });
      hasChanges = true;
    }

    if (hasChanges) {
      setTimeout(() => {
        form.trigger();
      }, 0);
    }
  }, [form, state]);

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log("Health concern submitted:", values);
      
      // Save to centralized state
      const result = await saveStep(stepData.stepId, {
        selectedReason: values.selectedReason,
        symptoms: values.symptoms,
      });
      
      // Navigate to visit type step
      router.push("/onboarding/patient/visit-type");
    } catch (error) {
      console.error("Error saving health concern:", error);
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
    // Navigate back to address step
    router.push("/onboarding/patient/address");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  // Get personalized label
  const getPersonalizedLabel = () => {
    const firstName = state?.draft?.firstName as string;
    if (firstName) {
      return `Hi ${firstName}, what brings you in today?`;
    }
    return "What brings you in today?";
  };

  const formValues = form.watch();

  return (
    <PatientStepShell
      title={getPersonalizedLabel()}
      description="Please tell us about your health concern and any symptoms you're experiencing."
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={stepData.progressPercent}
      currentStep={stepData.currentStep}
      totalSteps={stepData.totalSteps}
    >
      <FormProvider {...form}>
        <div className="max-w-xl mx-auto space-y-6">
          <div className="space-y-4">
            <div>
              <Combobox
                options={healthConditions}
                value={formValues.selectedReason}
                onValueChange={(value) =>
                  form.setValue("selectedReason", value, {
                    shouldValidate: true,
                  })
                }
                placeholder="Select your health concern..."
                emptyMessage="No health conditions found."
                displayValue={(value) => {
                  const option = healthConditions.find(
                    (opt) => opt.value === value,
                  );
                  return option ? option.label : value;
                }}
              />
              {form.formState.errors.selectedReason && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.selectedReason?.message as string}
                </p>
              )}
            </div>
            <FormTextarea
              name="symptoms"
              label="Please describe your symptoms in detail"
              placeholder="Please describe your symptoms, how long you've had them, and any other relevant details..."
              rows={6}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  form.handleSubmit(handleSubmit)();
                }
              }}
            />
          </div>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
