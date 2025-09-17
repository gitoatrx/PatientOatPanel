"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

const genderSchema = z.object({
  gender: z.string().min(1, "Please select your gender"),
});

type FormValues = z.infer<typeof genderSchema>;

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export function PatientGenderStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();
  
  // Get step configuration
  const stepData = getStepComponentData("gender");

  const form = useForm<FormValues>({
    resolver: zodResolver(genderSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { 
      gender: (state?.draft?.gender as string) || "" 
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log("Gender submitted:", values);
      
      // Save to centralized state
      const result = await saveStep(stepData.stepId, {
        gender: values.gender,
      });
      
      // Navigate to date of birth step
      router.push("/onboarding/patient/date-of-birth");
    } catch (error) {
      console.error("Error saving gender:", error);
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
    // Navigate back to personal step
    router.push("/onboarding/patient/personal");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  const selectedGender = form.watch("gender");
  const fieldError = form.formState.errors.gender?.message;

  return (
    <PatientStepShell
      title="What's your gender?"
      description="This information helps us provide personalized care."
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((5 / 15) * 100)}
      currentStep={5}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="max-w-xl mx-auto space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {genderOptions.map((option) => (
                <label key={option.value} className="cursor-pointer">
                  <input
                    {...form.register("gender", {
                      required: "Please select your gender",
                      validate: (value) => {
                        if (!value) return "Please select your gender";
                        return true;
                      },
                    })}
                    type="radio"
                    value={option.value}
                    className="sr-only"
                  />
                  <Card
                    className={cn(
                      "transition-all duration-200 border-1",
                      selectedGender === option.value
                        ? option.value.toLowerCase() === "female"
                          ? "border-pink-400 bg-pink-500/20 "
                          : "border-primary bg-primary/10 "
                        : "border-border ",
                    )}
                  >
                    <CardContent className=" text-center">
                      <div className="space-y-0.5">
                        <h3 className="text-md sm:text-lg font-medium text-foreground">
                          {option.label}
                        </h3>
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
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
