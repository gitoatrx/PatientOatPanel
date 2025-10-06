import { z } from "zod";

export const wizardSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(100, "First name must be at most 100 characters")
      .refine(
        (val) => val.trim().length > 0,
        "First name cannot be just spaces",
      )
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
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Please enter a valid phone number"),
    gender: z
      .string()
      .min(1, "Please select your gender"),
    streetAddress: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    province: z.string().min(1, "Province is required"),
    postalCode: z.string().min(6, "Please enter a valid postal code"),
    hasHealthCard: z.enum(["yes", "no"]),
    healthCardNumber: z.string().optional(),
    selectedReason: z.string().min(1, "Please select a reason for your visit"),
    symptoms: z
      .string()
      .min(10, "Please provide more details (at least 10 characters)")
      .max(500, "Description too long (max 500 characters)"),
    emergencyContactRelationship: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    visitType: z
      .string()
      .min(1, "Please select your preferred visit type"),
    doctorId: z.string().optional(),
    appointmentDate: z.string().min(1, "Please select a date"),
    appointmentTime: z.string().min(1, "Please select a time"),
    pharmacyOption: z.enum(["delivery", "pickup"]).optional(),
    selectedPharmacy: z.object({
      id: z.number(),
      name: z.string(),
      address: z.string(),
      city: z.string(),
      province: z.string(),
      postal_code: z.string().optional(),
      phone: z.string(),
    }).optional(),
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

export type WizardForm = z.infer<typeof wizardSchema>;
