import { z } from "zod";

// Individual step schemas
export const personalSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be at most 100 characters")
    .refine((val) => val.trim().length > 0, "First name cannot be just spaces")
    .refine(
      (val) => /^[a-zA-Z\s'-]+$/.test(val.trim()),
      "First name can only contain letters, spaces, hyphens, and apostrophes",
    ),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be at most 100 characters")
    .refine((val) => val.trim().length > 0, "Last name cannot be just spaces")
    .refine(
      (val) => /^[a-zA-Z\s'-]+$/.test(val.trim()),
      "Last name can only contain letters, spaces, hyphens, and apostrophes",
    ),
});

export const dateOfBirthSchema = z.object({
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
    }, "Please enter a valid month (1-12)"),
  birthYear: z
    .string()
    .min(1, "Year is required")
    .refine((val) => {
      const year = parseInt(val);
      const currentYear = new Date().getFullYear();
      return !isNaN(year) && year >= 1900 && year <= currentYear;
    }, "Please enter a valid year (1900 to current year)"),
});

export const emailSchema = z.object({
  email: z
    .string()
    .optional()
    .refine((val) => {
      // If email is provided, it must be valid
      if (val && val.trim().length > 0) {
        return z.string().email().safeParse(val).success;
      }
      // Empty email is allowed (optional)
      return true;
    }, "Please enter a valid email address"),
});

export const phoneSchema = z.object({
  phone: z.string().min(10, "Please enter a valid phone number"),
});

export const genderSchema = z.object({
  gender: z
    .string()
    .min(1, "Please select your gender"),
});

export const addressSchema = z.object({
  streetAddress: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z
    .string()
    .min(6, "Please enter a valid postal code")
    .regex(
      /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
      "Please enter a valid postal code (e.g., V6B 1A1)",
    ),
});

export const healthCardSchema = z.object({
  hasHealthCard: z.enum(["yes", "no"], {
  }),
  healthCardNumber: z.string().optional(),
});

export const healthConcernSchema = z.object({
  selectedReason: z.string().min(1, "Please select a reason for your visit"),
  symptoms: z
    .string()
    .min(10, "Please provide more details (at least 10 characters)")
    .max(500, "Description too long (max 500 characters)"),
});

export const emergencyContactSchema = z.object({
  emergencyContactRelationship: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export const visitTypeSchema = z.object({
  visitType: z
    .string()
    .min(1, "Please select your preferred visit type"),
});

export const appointmentSchema = z.object({
  appointmentDate: z.string().min(1, "Please select a date"),
  appointmentTime: z.string().min(1, "Please select a time"),
});

// Combined schema for all steps
export const patientOnboardingSchema = z
  .object({
    ...personalSchema.shape,
    ...dateOfBirthSchema.shape,
    ...emailSchema.shape,
    ...phoneSchema.shape,
    ...genderSchema.shape,
    ...addressSchema.shape,
    ...healthCardSchema.shape,
    ...healthConcernSchema.shape,
    ...emergencyContactSchema.shape,
    ...visitTypeSchema.shape,
    ...appointmentSchema.shape,
  })
  .refine(
    (data) => {
      if (
        data.emergencyContactRelationship &&
        data.emergencyContactRelationship.trim() !== ""
      ) {
        if (
          !data.emergencyContactName ||
          data.emergencyContactName.trim() === ""
        ) {
          return false;
        }
        if (
          !data.emergencyContactPhone ||
          data.emergencyContactPhone.trim() === ""
        ) {
          return false;
        }
        if (
          data.emergencyContactPhone &&
          data.emergencyContactPhone.length < 10
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Please fill in all emergency contact details when a relationship is selected",
      path: ["emergencyContactRelationship"],
    },
  );

// Step validation functions
export function validateOnboardingStep(
  step: number,
  data: unknown,
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  try {
    switch (step) {
      case 1:
        personalSchema.parse(data);
        break;
      case 2:
        dateOfBirthSchema.parse(data);
        break;
      case 3:
        emailSchema.parse(data);
        break;
      case 4:
        phoneSchema.parse(data);
        break;
      case 5:
        genderSchema.parse(data);
        break;
      case 6:
        addressSchema.parse(data);
        break;
      case 7:
        healthCardSchema.parse(data);
        break;
      case 8:
        emergencyContactSchema.parse(data);
        break;
      case 9:
        healthConcernSchema.parse(data);
        break;
      case 10:
        visitTypeSchema.parse(data);
        break;
      case 11:
        appointmentSchema.parse(data);
        break;
      default:
        return { isValid: false, errors: { general: "Invalid step" } };
    }

    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
    }
    return { isValid: false, errors };
  }
}

export function isFormValid(step: number, data: unknown): boolean {
  const { isValid } = validateOnboardingStep(step, data);
  return isValid;
}

export type PatientOnboardingFormData = z.infer<typeof patientOnboardingSchema>;
