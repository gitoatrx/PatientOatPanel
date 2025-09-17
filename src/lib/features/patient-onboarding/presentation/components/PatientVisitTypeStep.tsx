"use client";

import React from "react";
import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEnterKey } from "@/lib/hooks/useEnterKey";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

const visitTypeSchema = z.object({
  visitType: z.string().min(1, "Please select a visit type"),
});

type FormValues = z.infer<typeof visitTypeSchema>;

const visitTypeOptions = [
  {
    value: "InPerson",
    label: "In-person visit",
    description: "Visit our clinic in person",
  },
  {
    value: "Virtual",
    label: "Virtual/Telehealth visit",
    description: "Video consultation from home",
  },
];

export function PatientVisitTypeStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();
  
  // Get step configuration
  const stepData = getStepComponentData("visitType");

  const form = useForm<FormValues>({
    resolver: zodResolver(visitTypeSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      visitType: (state?.draft?.visitType as string) || "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log("Visit type submitted:", values);
      
      // Save to centralized state
      const result = await saveStep(stepData.stepId, {
        visitType: values.visitType,
      });
      
      // Navigate to emergency contact step
      router.push("/onboarding/patient/emergency-contact");
    } catch (error) {
      console.error("Error saving visit type:", error);
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
    // Navigate back to health concern step
    router.push("/onboarding/patient/health-concern");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  const selectedVisitType = form.watch("visitType");
  const fieldError = form.formState.errors.visitType?.message;
  
  // Ensure form is valid before enabling continue button
  const isFormValid = isValid && selectedVisitType && selectedVisitType.length > 0;

  const enterKeyHandler = useEnterKey(() => form.handleSubmit(handleSubmit)());

  return (
    <PatientStepShell
      title="What type of visit would you prefer?"
      description="Choose the type of appointment that works best for you."
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isFormValid}
      useCard={false}
      progressPercent={Math.round((10 / 15) * 100)}
      currentStep={10}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="space-y-3" onKeyDown={enterKeyHandler} tabIndex={0}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visitTypeOptions.map((option) => (
              <label key={option.value} className="block cursor-pointer">
                <input
                  {...form.register("visitType", {
                    required: "Please select a visit type",
                  })}
                  type="radio"
                  value={option.value}
                  className="sr-only"
                />
                <Card
                  className={cn(
                    "transition-all duration-200 border-2 py-6 h-full",
                    selectedVisitType === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:shadow-sm",
                  )}
                >
                  <CardContent className="flex flex-col justify-center h-full">
                    <div className="space-y-2 text-center">
                      <span className="text-lg font-medium text-foreground block">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-sm text-muted-foreground block">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </label>
            ))}
          </div>

          <AnimatePresence>
            {fieldError && (
              <motion.p
                className="text-destructive text-sm"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {fieldError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
