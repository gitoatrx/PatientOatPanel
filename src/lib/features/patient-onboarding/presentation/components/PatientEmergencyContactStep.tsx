"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormInput } from "@/components/ui/form-input";
import { motion } from "framer-motion";
import { FormPhoneInput, FormSelect } from "@/components/ui";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

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
  const { state, saveStep, isLoading } = usePatientOnboarding();
  
  // Get step configuration
  const stepData = getStepComponentData("emergencyContact");

  const form = useForm<FormValues>({
    resolver: zodResolver(emergencyContactSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      emergencyContactRelationship: (state?.draft?.emergencyContactRelationship as string) || "",
      emergencyContactName: (state?.draft?.emergencyContactName as string) || "",
      emergencyContactPhone: (state?.draft?.emergencyContactPhone as string) || "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log("Emergency contact submitted:", values);
      
      // Save to centralized state
      const result = await saveStep(stepData.stepId, {
        emergencyContactRelationship: values.emergencyContactRelationship,
        emergencyContactName: values.emergencyContactName,
        emergencyContactPhone: values.emergencyContactPhone,
      });
      
      // Navigate to doctor selection step
      router.push("/onboarding/patient/doctor-selection");
    } catch (error) {
      console.error("Error saving emergency contact:", error);
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
      onNext={() => form.handleSubmit(handleSubmit)()}
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
