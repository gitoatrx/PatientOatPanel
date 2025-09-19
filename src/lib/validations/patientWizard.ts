import type {
  UseFormClearErrors,
  UseFormSetError,
  UseFormTrigger,
} from "react-hook-form";
import type { WizardForm } from "@/types/wizard";

export async function validateDateOfBirthStep(
  values: WizardForm,
  setError: UseFormSetError<WizardForm>,
  clearErrors: UseFormClearErrors<WizardForm>,
) {
  const { birthDay, birthMonth, birthYear } = values;
  clearErrors(["birthDay", "birthMonth", "birthYear"]);
  if (!birthDay || !birthMonth || !birthYear) {
    if (!birthDay)
      setError("birthDay", { type: "manual", message: "Day is required" });
    if (!birthMonth)
      setError("birthMonth", { type: "manual", message: "Month is required" });
    if (!birthYear)
      setError("birthYear", { type: "manual", message: "Year is required" });
    return false;
  }
  const day = parseInt(birthDay);
  const month = parseInt(birthMonth);
  const year = parseInt(birthYear);
  if (day < 1 || day > 31) {
    setError("birthDay", {
      type: "manual",
      message: "Please enter a valid day (1-31)",
    });
    return false;
  }
  if (month < 1 || month > 12) {
    setError("birthMonth", {
      type: "manual",
      message: "Please select a valid month",
    });
    return false;
  }
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    setError("birthYear", {
      type: "manual",
      message: "Please enter a valid year (1900 to current year)",
    });
    return false;
  }
  const date = new Date(year, month - 1, day);
  const valid =
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year;
  if (!valid) {
    setError("birthDay", {
      type: "manual",
      message: "Please enter a valid date",
    });
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date >= today) {
    setError("birthYear", {
      type: "manual",
      message: "Date of birth cannot be in the future",
    });
    return false;
  }
  return true;
}

export async function validateHealthCardStep(
  values: WizardForm,
  setError: UseFormSetError<WizardForm>,
  clearErrors: UseFormClearErrors<WizardForm>,
) {
  if (!values.hasHealthCard) {
    setError("hasHealthCard", {
      type: "manual",
      message: "Please select an option",
    });
    return false;
  }
  clearErrors("hasHealthCard");
  if (values.hasHealthCard === "yes") {
    const num = values.healthCardNumber?.trim();
    if (!num) {
      setError("healthCardNumber", {
        type: "manual",
        message: "Please enter health card number",
      });
      return false;
    }
    if (!/^\d{10}$/.test(num)) {
      setError("healthCardNumber", {
        type: "manual",
        message: "Health card number must be exactly 10 digits",
      });
      return false;
    }
    clearErrors("healthCardNumber");
  } else if (values.hasHealthCard === "no") {
    // Normalize to empty string when user selects "No" to avoid null shape errors
    (values as unknown as Record<string, unknown>)["healthCardNumber"] = "";
    clearErrors("healthCardNumber");
  }
  return true;
}

export async function validateReasonAndSymptomsStep(
  trigger: UseFormTrigger<WizardForm>,
) {
  const reason = await trigger("selectedReason");
  const symptoms = await trigger("symptoms");
  return reason && symptoms;
}

export async function validateVisitTypeStep(
  values: WizardForm,
  setError: UseFormSetError<WizardForm>,
  clearErrors: UseFormClearErrors<WizardForm>,
) {
  if (!values.visitType || values.visitType.trim() === "") {
    setError("visitType", {
      type: "manual",
      message: "Please select your preferred visit type",
    });
    return false;
  }
  clearErrors("visitType");
  return true;
}

export async function validateAppointmentStep(
  values: WizardForm,
  setError: UseFormSetError<WizardForm>,
  clearErrors: UseFormClearErrors<WizardForm>,
) {
  clearErrors(["appointmentDate", "appointmentTime"]);
  let hasErrors = false;
  if (!values.appointmentDate || values.appointmentDate.trim() === "") {
    setError("appointmentDate", {
      type: "manual",
      message: "Please select a date",
    });
    hasErrors = true;
  }
  if (!values.appointmentTime || values.appointmentTime.trim() === "") {
    setError("appointmentTime", {
      type: "manual",
      message: "Please select a time",
    });
    hasErrors = true;
  }
  return !hasErrors;
}
export async function validateEmergencyContactStep(
  values: WizardForm,
  setError: UseFormSetError<WizardForm>,
  clearErrors: UseFormClearErrors<WizardForm>,
) {
  const relationship = values.emergencyContactRelationship;
  clearErrors([
    "emergencyContactRelationship",
    "emergencyContactName",
    "emergencyContactPhone",
  ]);

  // Only show error if user has explicitly selected an empty string
  // Don't show error for undefined/null (initial state)
  if (relationship === "") {
    setError("emergencyContactRelationship", {
      type: "manual",
      message: "Please select an option",
    });
    return false;
  }

  // If no relationship is selected (undefined/null), don't show error
  // This allows the user to see the step without immediate validation errors
  if (relationship === undefined || relationship === null) {
    return false; // Don't proceed, but don't show error either
  }
  let hasErrors = false;
  if (
    !values.emergencyContactName ||
    values.emergencyContactName.trim() === ""
  ) {
    setError("emergencyContactName", {
      type: "manual",
      message: "Emergency contact name is required",
    });
    hasErrors = true;
  }
  if (
    !values.emergencyContactPhone ||
    values.emergencyContactPhone.trim() === ""
  ) {
    setError("emergencyContactPhone", {
      type: "manual",
      message: "Emergency contact phone is required",
    });
    hasErrors = true;
  } else if (values.emergencyContactPhone.length < 10) {
    setError("emergencyContactPhone", {
      type: "manual",
      message: "Please enter a valid phone number (at least 10 digits)",
    });
    hasErrors = true;
  }
  return !hasErrors;
}

export async function validateAddressStep(
  values: WizardForm,
  setError: UseFormSetError<WizardForm>,
  clearErrors: UseFormClearErrors<WizardForm>,
) {
  clearErrors(["streetAddress", "city", "province", "postalCode"]);
  let hasErrors = false;
  if (!values.streetAddress || values.streetAddress.trim() === "") {
    setError("streetAddress", {
      type: "manual",
      message: "Street address is required",
    });
    hasErrors = true;
  }
  if (!values.city || values.city.trim() === "") {
    setError("city", { type: "manual", message: "City is required" });
    hasErrors = true;
  }
  if (!values.province || values.province.trim() === "") {
    setError("province", { type: "manual", message: "Province is required" });
    hasErrors = true;
  }
  if (!values.postalCode || values.postalCode.trim() === "") {
    setError("postalCode", {
      type: "manual",
      message: "Postal code is required",
    });
    hasErrors = true;
  } else {
    const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    if (!postalCodeRegex.test(values.postalCode)) {
      setError("postalCode", {
        type: "manual",
        message: "Please enter a valid postal code (e.g., V6B 1A1)",
      });
      hasErrors = true;
    }
  }
  return !hasErrors;
}
