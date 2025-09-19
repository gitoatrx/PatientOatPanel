"use client";
import React, { memo } from "react";
import { motion } from "framer-motion";
import { formatDateShort, formatDateOfBirthShort } from "@/lib/utils/date";
import type { WizardForm } from "@/types/wizard";
import { Calendar } from "lucide-react";
import { MEDICAL_SPECIALTIES } from "@/lib/constants/medical-specialties";

interface ReviewStepProps {
  getPersonalizedLabel: (step: number) => string;
  formValues: WizardForm;
}

export const ReviewStep = memo(function ReviewStep({
  formValues,
}: ReviewStepProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not selected";
    try {
      const date = new Date(dateString);
      return formatDateShort(date);
    } catch {
      return dateString;
    }
  };

  const formatDateOfBirthDisplay = () => {
    if (
      !formValues.birthMonth ||
      !formValues.birthDay ||
      !formValues.birthYear
    ) {
      return "Not provided";
    }

    try {
      const birthDate = new Date(
        parseInt(formValues.birthYear),
        parseInt(formValues.birthMonth) - 1,
        parseInt(formValues.birthDay),
      );

      return formatDateOfBirthShort(birthDate);
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "Not selected";
    try {
      const [hours, minutes] = timeString.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  const getVisitTypeLabel = (visitType: string) => {
    switch (visitType) {
      case "Virtual":
        return "Virtual/Telehealth visit";
      case "InPerson":
        return "In-person visit";
      case "Either":
        return "Either option works for me";
      case "video calling":
        return "Video calling";
      case "in-person":
        return "In-person visit";
      default:
        return visitType || "Not selected";
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case "male":
        return "Male";
      case "female":
        return "Female";
      case "other":
        return "Other";
      case "prefer-not-to-say":
        return "Prefer not to say";
      default:
        return "Not selected";
    }
  };

  const getEmergencyContactLabel = (relationship: string) => {
    switch (relationship) {
      case "spouse":
        return "Spouse/Partner";
      case "parent":
        return "Parent";
      case "child":
        return "Child";
      case "sibling":
        return "Sibling";
      case "friend":
        return "Friend";
      case "other":
        return "Other";
      default:
        return "Not selected";
    }
  };

  const getHealthConcernLabel = (concern: string) => {
    const specialty = MEDICAL_SPECIALTIES.find((s) => s.value === concern);
    return specialty ? specialty.label : concern;
  };

  const getDoctorName = (doctorName: string) => {
    // If doctorName is provided (from API), use it directly
    if (doctorName && doctorName.trim() !== "") {
      return `Dr. ${doctorName}`;
    }
    
    // Fallback to mock data for backward compatibility
    const doctors = [
      { id: "dr-smith", name: "Dr. Sarah Smith", specialty: "Family Medicine" },
      { id: "dr-johnson", name: "Dr. Michael Johnson", specialty: "Internal Medicine" },
      { id: "dr-williams", name: "Dr. Emily Williams", specialty: "Pediatrics" },
      { id: "dr-brown", name: "Dr. David Brown", specialty: "Cardiology" },
      { id: "dr-davis", name: "Dr. Lisa Davis", specialty: "Dermatology" },
      { id: "dr-miller", name: "Dr. James Miller", specialty: "Orthopedics" },
    ];
    
    const doctor = doctors.find(d => d.id === doctorName);
    return doctor ? `${doctor.name} - ${doctor.specialty}` : "No doctor selected";
  };

  const formatAddress = () => {
    const parts = [
      formValues.streetAddress,
      formValues.city,
      formValues.province,
      formValues.postalCode,
      "CA",
    ].filter(Boolean);

    if (parts.length >= 4) {
      const [street, city, province, postalCode, country] = parts;
      return `${street}, ${city}, ${province} ${postalCode}, ${country}`;
    }

    return parts.length > 0 ? parts.join(", ") : "Not provided";
  };

  // NEW: Format emergency contact in single line
  const formatEmergencyContact = () => {
    if (!formValues.emergencyContactName || !formValues.emergencyContactPhone) {
      return "Not provided";
    }

    const relationship = getEmergencyContactLabel(
      formValues.emergencyContactRelationship || "",
    );
    return `${formValues.emergencyContactName} (${relationship}), ${formValues.emergencyContactPhone}`;
  };

  // Check if sections have any data
  const hasPersonalInfo = Boolean(
    formValues.firstName ||
      formValues.lastName ||
      formValues.email ||
      formValues.phone ||
      (formValues.birthDay && formValues.birthMonth && formValues.birthYear) ||
      formValues.gender ||
      // Include address in personal info
      formValues.streetAddress ||
      formValues.city ||
      formValues.province ||
      formValues.postalCode,
  );

  const hasHealthInfo = Boolean(
    formValues.hasHealthCard ||
      formValues.selectedReason ||
      formValues.symptoms,
  );

  const hasEmergencyContact = Boolean(
    formValues.emergencyContactRelationship &&
      formValues.emergencyContactName &&
      formValues.emergencyContactPhone,
  );

  // Simple info item component
  const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <div className="w-full rounded-lg p-3 bg-gradient-to-br from-primary/5 to-primary/10 border border-border/30">
      <div className="w-full">
        <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className="text-sm font-semibold text-foreground leading-relaxed break-words">
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto space-y-6  pt-3"
    >
      {/* Appointment Summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/30 p-6"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-50" />
        <div className="relative z-10 space-y-4">
          {/* Patient and Visit Type */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-foreground truncate">
                  {formValues.firstName && formValues.lastName
                    ? `${formValues.firstName} ${formValues.lastName}`
                    : formValues.firstName || formValues.lastName || "Patient"}
                </h3>
                <p className="text-primary font-medium text-sm truncate">
                  {getVisitTypeLabel(formValues.visitType)}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-primary mb-1">
                {formatDate(formValues.appointmentDate)}
              </div>
              <div className="text-sm text-foreground/70 font-medium">
                {formatTime(formValues.appointmentTime)}
              </div>
            </div>
          </div>

          {/* Doctor Information */}
          {formValues.doctorId && (
            <div className="border-t border-border/30 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground/80 mb-1">Selected Doctor</p>
                  <p className="text-base font-semibold text-foreground truncate">
                    {getDoctorName(formValues.doctorId)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Information Sections */}
      <div className="space-y-6 w-full">
        {/* Personal Information (now includes address) */}
        {hasPersonalInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-semibold text-foreground">
              Personal Information
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {formValues.firstName && (
                <InfoItem label="First Name" value={formValues.firstName} />
              )}
              {formValues.lastName && (
                <InfoItem label="Last Name" value={formValues.lastName} />
              )}
              {formValues.birthDay &&
                formValues.birthMonth &&
                formValues.birthYear && (
                  <InfoItem
                    label="Date of Birth"
                    value={formatDateOfBirthDisplay()}
                  />
                )}
              {formValues.gender && (
                <InfoItem
                  label="Gender"
                  value={getGenderLabel(formValues.gender)}
                />
              )}
              {formValues.email && (
                <InfoItem label="Email Address" value={formValues.email} />
              )}
              {formValues.phone && (
                <InfoItem label="Phone Number" value={formValues.phone} />
              )}
              {/* Address moved to personal info section */}
              {(formValues.streetAddress ||
                formValues.city ||
                formValues.province ||
                formValues.postalCode) && (
                <InfoItem label="Address" value={formatAddress()} />
              )}
            </div>
          </motion.div>
        )}

        {/* Health Information */}
        {hasHealthInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-semibold text-foreground">
              Health Information
            </h3>
            <div className="space-y-3">
              {/* Health Card and Health Concern - side by side */}
              <div className="grid gap-3 md:grid-cols-2">
                {/* Health Card - show status */}
                <InfoItem
                  label="BC Health Card"
                  value={
                    formValues.hasHealthCard === "yes" && formValues.healthCardNumber
                      ? formValues.healthCardNumber
                      : formValues.hasHealthCard === "no"
                      ? "No health card"
                      : "Not specified"
                  }
                />

                {/* Health Concern */}
                {formValues.selectedReason && (
                  <InfoItem
                    label="Health Concern"
                    value={getHealthConcernLabel(formValues.selectedReason)}
                  />
                )}
              </div>

              {/* Symptoms & Details - full width */}
              {formValues.symptoms && (
                <InfoItem
                  label="Symptoms & Details"
                  value={formValues.symptoms}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Emergency Contact - single line format */}
        {hasEmergencyContact && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-semibold text-foreground">
              Emergency Contact
            </h3>
            <InfoItem
              label="Emergency Contact"
              value={formatEmergencyContact()}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});
