"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatientStepShell } from "./PatientStepShell";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

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
  const { state, saveStep, isLoading } = usePatientOnboarding();
  
  // Get step configuration
  const stepData = getStepComponentData("dateOfBirth");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(dateOfBirthSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { 
      birthDay: (state?.draft?.birthDay as string) || "", 
      birthMonth: (state?.draft?.birthMonth as string) || "", 
      birthYear: (state?.draft?.birthYear as string) || "" 
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log("Date of birth submitted:", values);
      
      // Save to centralized state
      const result = await saveStep(stepData.stepId, {
        birthDay: values.birthDay,
        birthMonth: values.birthMonth,
        birthYear: values.birthYear,
      });
      
      // Navigate to email step
      router.push("/onboarding/patient/email");
    } catch (error) {
      console.error("Error saving date of birth:", error);
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

  return (
    <PatientStepShell
      title="When were you born?"
      description="We need this information for your medical records."
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((6 / 15) * 100)}
      currentStep={6}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="max-w-xl mx-auto space-y-6">
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
