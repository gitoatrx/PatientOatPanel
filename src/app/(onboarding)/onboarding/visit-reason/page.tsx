"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "@/lib/features/patient-onboarding/presentation/components/PatientStepShell";
import { Combobox } from "@/components/ui/combobox";
import { getHealthConditions } from "@/lib/constants/medical-specialties";
import { FormTextarea } from "@/components/ui";
import { useEffect, useState } from "react";

const healthConcernSchema = z.object({
  selectedReason: z.string().min(1, "Please select a health concern"),
  symptoms: z
    .string()
    .min(1, "Please describe your symptoms")
    .min(10, "Please provide more details about your symptoms"),
});

type FormValues = z.infer<typeof healthConcernSchema>;

export default function VisitReasonPage() {
  const [selectedVisitReason, setSelectedVisitReason] = useState<string>("");
  
  useEffect(() => {
    // Get the selected visit reason from localStorage
    if (typeof window !== "undefined") {
      const visitReason = localStorage.getItem("selected_visit_reason");
      setSelectedVisitReason(visitReason || "");
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(healthConcernSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { selectedReason: "", symptoms: "" },
  });

  const healthConditions = getHealthConditions();
  
  // Customize content based on visit reason
  const getVisitReasonInfo = (reason: string) => {
    switch (reason) {
      case "consultation":
        return {
          title: "General Consultation",
          description: "Please tell us about your health concerns and any symptoms you're experiencing.",
          placeholder: "Describe your symptoms, concerns, or questions you'd like to discuss with the doctor..."
        };
      case "follow-up":
        return {
          title: "Follow-up Appointment",
          description: "Please provide an update on your condition since your last visit.",
          placeholder: "Describe any changes in your condition, new symptoms, or concerns since your last visit..."
        };
      case "urgent":
        return {
          title: "Urgent Care",
          description: "Please describe your urgent medical concern in detail.",
          placeholder: "Describe your urgent symptoms, when they started, and their severity..."
        };
      case "specialist":
        return {
          title: "Specialist Referral",
          description: "Please provide details about your condition for the specialist.",
          placeholder: "Describe your condition, symptoms, and any previous treatments or tests..."
        };
      case "preventive":
        return {
          title: "Preventive Care",
          description: "Please share any health concerns or questions for your preventive care visit.",
          placeholder: "Describe any health concerns, family history updates, or questions about preventive care..."
        };
      case "mental-health":
        return {
          title: "Mental Health Support",
          description: "Please share what you'd like to discuss during your mental health appointment.",
          placeholder: "Describe your concerns, feelings, or topics you'd like to discuss with your mental health provider..."
        };
      default:
        return {
          title: "Health Concern",
          description: "Please tell us about your health concern and any symptoms you're experiencing.",
          placeholder: "Please describe your symptoms, how long you've had them, and any other relevant details..."
        };
    }
  };

  const visitReasonInfo = getVisitReasonInfo(selectedVisitReason);

  const handleSubmit = (values: FormValues) => {

    // TODO: Implement form submission logic
  };

  const handleBack = () => {

    // TODO: Implement back navigation logic
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  const formValues = form.watch();

  return (
    <PatientStepShell
      title={visitReasonInfo.title}
      description={visitReasonInfo.description}
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={false}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={80}
      currentStep={8}
      totalSteps={10}
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
              placeholder={visitReasonInfo.placeholder}
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
