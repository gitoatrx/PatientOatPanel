"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Calendar, CheckCircle } from "lucide-react";
import { WalkinIcon, InclinicIcon } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { patientService } from "@/lib/services/patientService";
import { RescheduleAppointmentData } from "@/lib/types/api";
import { PatientStepShell } from "@/lib/features/patient-onboarding/presentation/components/PatientStepShell";
import { DoctorList } from "@/components/onboarding/patient/doctor/DoctorList";
import { AppointmentDateTimeStep } from "@/components/onboarding/patient/steps/AppointmentDateTimeStep";
import { Doctor } from "@/components/onboarding/patient/doctor/DoctorCard";
import { motion, AnimatePresence } from "framer-motion";

// Form schema
const rescheduleSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
  appointmentDate: z.string().min(1, "Please select a date"),
  appointmentTime: z.string().min(1, "Please select a time"),
});

type RescheduleFormData = z.infer<typeof rescheduleSchema>;

export default function RescheduleAppointmentPage() {
  const params = useParams();
  const { toast } = useToast();
  const clinicId = params.clinicId as string;
  const followupToken = params.followuptoken as string;
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1); // 1: Appointment Details, 2: Doctor Selection, 3: Date/Time Selection, 4: Confirmation, 5: Success

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState<RescheduleAppointmentData | null>(null);
  
  // Dynamic data from API
  const [appointmentData, setAppointmentData] = useState<RescheduleAppointmentData | null>(null);
  const [providers, setProviders] = useState<Array<{ id: number; first_name: string; last_name: string; specialty: string; provider_no: string }>>([]);

  // Form setup
  const form = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      doctorId: "",
      appointmentDate: "",
      appointmentTime: "",
    },
  });

  const formValues = form.watch();

  // Step navigation functions
  const goToNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Convert providers to Doctor format for DoctorList component
  const doctors: Doctor[] = providers.map(provider => ({
    id: provider.id.toString(),
    name: `Dr. ${provider.first_name.charAt(0).toUpperCase() + provider.first_name.slice(1).toLowerCase()} ${provider.last_name.charAt(0).toUpperCase() + provider.last_name.slice(1).toLowerCase()}`,
    specialty: provider.specialty,
  }));

  // Load appointment details on mount
  useEffect(() => {
    const loadAppointmentDetails = async () => {
      try {
        setIsLoading(true);
        const response = await patientService.getRescheduleAppointmentDetails(clinicId, followupToken);
        
        if (response.success) {
          setAppointmentData(response.data);
          
          // Load providers for the visit type
          const providersResponse = await patientService.getProvidersList(undefined, response.data.appointment.visit_type_name);
          if (providersResponse.success) {
            setProviders(providersResponse.data);
            
            // Preselect current doctor
            const currentDoctorId = response.data.doctor.id.toString();
            const matchingProvider = providersResponse.data.find(p => p.provider_no === currentDoctorId);
            if (matchingProvider) {
              form.setValue('doctorId', matchingProvider.id.toString());
            }
          }
        } else {
          setError(response.message || 'Failed to load appointment details');
        }
      } catch (error) {
        console.error('Error loading appointment details:', error);
        setError('Failed to load appointment details');
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointmentDetails();
  }, [clinicId, followupToken, form]);

  const handleReschedule = async (data: RescheduleFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await patientService.rescheduleAppointment(
        clinicId,
        followupToken,
        data.doctorId,
        data.appointmentDate,
        data.appointmentTime
      );
      
      if (response.success) {
        // Store the success response data
        setRescheduleSuccess(response.data);
        
        toast({
          title: "Appointment Rescheduled",
          description: "Your appointment has been successfully rescheduled.",
          variant: "success",
        });
        
        // Move to step 5 (success confirmation)
        setCurrentStep(5);
      } else {
        throw new Error(response.message || 'Failed to reschedule appointment');
      }
      
    } catch (error) {
      console.error("Reschedule error:", error);
      toast({
        variant: "error",
        title: "Reschedule Failed",
        description: error instanceof Error ? error.message : "Failed to reschedule appointment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PatientStepShell
        title=""
        useCard={false}
        contentMaxWidthClass="max-w-xl"
        progressPercent={0}
      >
        <div className="text-center py-8">
          <img src="/loading.svg" alt="Loading..." className="w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </PatientStepShell>
    );
  }

  // Error state
  if (error || !appointmentData) {
    return (
      <PatientStepShell
        title="Error"
        useCard={true}
        contentMaxWidthClass="max-w-2xl"
      >
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error || 'Failed to load appointment details'}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </PatientStepShell>
    );
  }

  const doctorData = appointmentData.doctor;

  // Step content components
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Clinic Information */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">{appointmentData.clinic.name}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(appointmentData.clinic.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    {appointmentData.clinic.address}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a 
                    href={`tel:${appointmentData.clinic.phone}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {appointmentData.clinic.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a 
                    href={`mailto:${appointmentData.clinic.email}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {appointmentData.clinic.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Meeting Participants */}
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Meeting with:</div>
              <div className="text-lg font-semibold text-gray-900">
                Dr. {doctorData.first_name.charAt(0).toUpperCase() + doctorData.first_name.slice(1).toLowerCase()} {doctorData.last_name.charAt(0).toUpperCase() + doctorData.last_name.slice(1).toLowerCase()} & {appointmentData.patient.last_name.charAt(0).toUpperCase() + appointmentData.patient.last_name.slice(1).toLowerCase()},{appointmentData.patient.first_name.charAt(0).toUpperCase() + appointmentData.patient.first_name.slice(1).toLowerCase()} ({appointmentData.appointment.visit_type_name})
              </div>
            </div>

            {/* Former Time */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-xs font-medium text-blue-700 mb-1">Former Time</div>
              <div className="text-sm text-blue-800">{appointmentData.appointment.formatted_date} at {appointmentData.appointment.time}</div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Doctor</h3>
            {providers.length > 0 ? (
              <DoctorList doctors={doctors} showSearch={false} />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No doctors available for this visit type.</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <AppointmentDateTimeStep
            onNext={goToNextStep}
            getPersonalizedLabel={() => "Select Date & Time"}
            providerId={formValues.doctorId ? parseInt(formValues.doctorId) : undefined}
          />
        );

      case 4:
        // Confirmation step
        const selectedDoctor = providers.find(p => p.id.toString() === formValues.doctorId);
        const selectedDate = formValues.appointmentDate;
        const selectedTime = formValues.appointmentTime;
        
        return (
          <div className="space-y-6">
            <div className="text-left">
              <h3 className="text-xl sm:text-2xl font-semibold leading-tight text-gray-900 mb-2">Confirm Reschedule</h3>
              <p className="text-sm text-muted-foreground italic mt-1">Please review your new appointment details</p>
            </div>

            <div className="w-full space-y-4">
              {/* Doctor Name */}
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedDoctor ? `Dr. ${selectedDoctor.first_name.charAt(0).toUpperCase() + selectedDoctor.first_name.slice(1).toLowerCase()} ${selectedDoctor.last_name.charAt(0).toUpperCase() + selectedDoctor.last_name.slice(1).toLowerCase()}` : 'Doctor not selected'}
              </h2>
              
              {/* Date & Time */}
              <div className="flex items-center gap-3 w-fit">
                <Calendar className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <span className="text-gray-900">
                  {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Date not selected'} · {selectedTime ? new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  }) : 'Time not selected'}
                </span>
              </div>
              
              {/* Visit Type */}
              <div className="flex items-center gap-3 w-fit">
                {appointmentData?.appointment.visit_type_is_video_call ? (
                  <InclinicIcon className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <WalkinIcon className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-gray-900">
                  {appointmentData?.appointment.visit_type_name || 'Visit type not available'}
                  {appointmentData?.appointment.visit_type_duration && (
                    <span className="text-gray-500 ml-2">• {appointmentData.appointment.visit_type_duration} minutes</span>
                  )}
                </span>
              </div>
            </div>

            {/* Former Appointment */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-700 mb-1">Previous Appointment</div>
              <div className="text-sm text-blue-800">
                {appointmentData?.appointment.formatted_date} at {appointmentData?.appointment.time}
              </div>
            </div>
          </div>
        );

      case 5:
        // Success confirmation with API response data
        if (!rescheduleSuccess) return null;
        
        return (
          <div className="space-y-8">
            {/* Success Header */}
            <div className="text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">Appointment Rescheduled!</h2>
              <p className="text-sm text-gray-600">Your appointment has been successfully updated</p>
            </div>

            {/* New Appointment Details - Same format as first step */}
            <div className="space-y-6">
              {/* Clinic Information - Same as first step */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">{rescheduleSuccess.clinic.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(rescheduleSuccess.clinic.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      {rescheduleSuccess.clinic.address}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a 
                      href={`tel:${rescheduleSuccess.clinic.phone}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {rescheduleSuccess.clinic.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a 
                      href={`mailto:${rescheduleSuccess.clinic.email}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {rescheduleSuccess.clinic.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Meeting Participants - Same as first step */}
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Meeting with:</div>
                <div className="text-lg font-semibold text-gray-900">
                  Dr. {rescheduleSuccess.doctor.first_name.charAt(0).toUpperCase() + rescheduleSuccess.doctor.first_name.slice(1).toLowerCase()} {rescheduleSuccess.doctor.last_name.charAt(0).toUpperCase() + rescheduleSuccess.doctor.last_name.slice(1).toLowerCase()} & {rescheduleSuccess.patient.last_name.charAt(0).toUpperCase() + rescheduleSuccess.patient.last_name.slice(1).toLowerCase()},{rescheduleSuccess.patient.first_name.charAt(0).toUpperCase() + rescheduleSuccess.patient.first_name.slice(1).toLowerCase()} ({rescheduleSuccess.appointment.visit_type_name})
                </div>
              </div>

              {/* New Appointment Time - Same format as Former Time */}
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xs font-medium text-green-700 mb-1">New appointment time</div>
                <div className="text-sm text-green-800">{rescheduleSuccess.appointment.formatted_date} at {rescheduleSuccess.appointment.time}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleReschedule)}>
        <PatientStepShell
          title={currentStep === 1 ? `Reschedule Appointment – ${appointmentData.patient.last_name.charAt(0).toUpperCase() + appointmentData.patient.last_name.slice(1).toLowerCase()},${appointmentData.patient.first_name.charAt(0).toUpperCase() + appointmentData.patient.first_name.slice(1).toLowerCase()}` : ""}
          onNext={currentStep < 4 ? goToNextStep : currentStep === 4 ? form.handleSubmit(handleReschedule) : undefined}
          onBack={currentStep > 1 && currentStep < 5 ? goToPreviousStep : undefined}
          nextLabel={currentStep === 4 ? "Confirm Reschedule" : currentStep < 4 ? "Continue" : undefined}
          backLabel={currentStep < 5 ? "Back" : undefined}
          isNextDisabled={
            currentStep === 1 ? false :
            currentStep === 2 ? !formValues.doctorId :
            currentStep === 3 ? !formValues.doctorId || !formValues.appointmentDate || !formValues.appointmentTime :
            currentStep === 4 ? false :
            false
          }
          isSubmitting={isSubmitting}
          useCard={false}
          contentMaxWidthClass="max-w-xl"
          progressPercent={0}
          
        >
          <div className="pt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </PatientStepShell>
      </form>
    </FormProvider>
  );
}