"use client";
import React, { memo } from "react";
import { motion } from "framer-motion";
import { formatDateShort, formatDateOfBirthShort } from "@/lib/utils/date";
import type { WizardForm } from "@/types/wizard";
import { Calendar, User, Stethoscope, FileText, Truck, Store } from "lucide-react";
import { InclinicIcon, WalkinIcon } from "@/components/icons";
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

  const formatDateOfBirthWithAge = () => {
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

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Format date as "12 Aug 1986" without age
      const formattedDate = birthDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      
      return `${formattedDate} (${age} years old)`;
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
    // Use the visit type name directly from the API
    return visitType || "Not selected";
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
  const InfoItem = ({ label, value, noBorder = false }: { label: string; value: string; noBorder?: boolean }) => (
    <div className={`w-full rounded-lg p-3 bg-gradient-to-br from-primary/5 to-primary/10 ${noBorder ? '' : 'border border-border/30'}`}>
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
      className="w-full max-w-2xl mx-auto space-y-6 pt-3"
    >
      {/* Appointment Card - Compact Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/30 p-4"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-50" />
        <div className="relative z-10 space-y-3">
          {/* Date and Time */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {formatDate(formValues.appointmentDate)} · {formatTime(formValues.appointmentTime)}
            </span>
          </div>

          {/* Visit Type */}
          <div className="flex items-center gap-2">
            {formValues.visitType?.toLowerCase().includes('virtual') || formValues.visitType?.toLowerCase().includes('video') ? (
              <InclinicIcon className="w-4 h-4" />
            ) : (
              <WalkinIcon className="w-4 h-4" />
            )}
            <span className="text-sm font-medium text-foreground">
              {getVisitTypeLabel(formValues.visitType)}
            </span>
          </div>

          {/* Doctor */}
          {formValues.doctorId && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {getDoctorName(formValues.doctorId)}
              </span>
            </div>
          )}

          {/* Reason */}
          {formValues.selectedReason && (
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Reason: {getHealthConcernLabel(formValues.selectedReason)}
              </span>
            </div>
          )}

          {/* Details */}
          {formValues.symptoms && (
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-foreground">Details: </span>
                <span className="text-sm text-foreground/70">{formValues.symptoms}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Patient Info - Condensed Two-Column Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-border/30 p-4"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Patient Info</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* PHN */}
          <div>
            <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-1">
              PHN
            </div>
            <div className="text-sm font-semibold text-foreground">
              {formValues.hasHealthCard === "yes" && formValues.healthCardNumber
                ? formValues.healthCardNumber
                : "Not provided"}
            </div>
          </div>

          {/* Last Name */}
          <div>
            <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-1">
              Last Name
            </div>
            <div className="text-sm font-semibold text-foreground">
              {formValues.lastName || "Not provided"}
            </div>
          </div>

          {/* First Name */}
          <div>
            <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-1">
              First Name
            </div>
            <div className="text-sm font-semibold text-foreground">
              {formValues.firstName || "Not provided"}
            </div>
          </div>

          {/* DOB */}
          <div>
            <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-1">
              DOB
            </div>
            <div className="text-sm font-semibold text-foreground">
              {formatDateOfBirthWithAge()}
            </div>
          </div>

          {/* Gender */}
          <div>
            <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-1">
              Gender
            </div>
            <div className="text-sm font-semibold text-foreground">
              {getGenderLabel(formValues.gender)}
            </div>
          </div>

          {/* Phone */}
          <div>
            <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-1">
              Phone
            </div>
            <div className="text-sm font-semibold text-foreground">
              {formValues.phone || "Not provided"}
            </div>
          </div>

          {/* Email - only show if provided */}
          {formValues.email && (
            <div className="col-span-2">
              <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-1">
                Email
              </div>
              <div className="text-sm font-semibold text-foreground">
                {formValues.email}
              </div>
            </div>
          )}

          {/* Address - 1 column, truncate if long */}
          {(formValues.streetAddress || formValues.city || formValues.province || formValues.postalCode) && (
            <div className="col-span-2">
              <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-1">
                Address
              </div>
              <div 
                className="text-sm font-semibold text-foreground truncate cursor-help" 
                title={formatAddress()}
              >
                {formatAddress()}
              </div>
            </div>
          )}

          {/* Pharmacy Option */}
          <div className="col-span-2">
            <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-1">
              Pharmacy
            </div>
            <div className="flex items-center gap-2">
              {formValues.pharmacyOption === 'delivery' ? (
                <Truck className="w-4 h-4 text-primary" />
              ) : (
                <Store className="w-4 h-4 text-primary" />
              )}
              <span className="text-sm font-semibold text-foreground">
                {formValues.pharmacyOption === 'delivery' ? 'Delivery' : 'Pickup'}
                {formValues.selectedPharmacy && (
                  <span className="text-foreground/70">
                    {' '}-
                    {` ${formValues.selectedPharmacy.name}, ${formValues.selectedPharmacy.address}, ${formValues.selectedPharmacy.province} ${formValues.selectedPharmacy.postal_code || ''}`.trim()}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Emergency Contact - only show if provided */}
      {hasEmergencyContact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-border/30 p-4"
        >
          <div className="space-y-3">
            <div className="w-full">
              <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-1">
                Emergency Contact
              </div>
              <div className="text-sm font-semibold text-foreground leading-relaxed break-words">
                {formatEmergencyContact()}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});
