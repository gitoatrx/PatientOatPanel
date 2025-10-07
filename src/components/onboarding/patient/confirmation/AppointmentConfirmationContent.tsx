"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Check,
  CheckCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Calendar,
  Link,
  MapPin,
  Phone,
  Navigation,
  Store,
  Hospital,
  FileText,
  Timer,
  Lock,
} from "lucide-react";
import { InclinicIcon, WalkinIcon } from "@/components/icons";
import { AiAssessmentChat } from "./AiAssessmentChat";
import { AddToCalendar } from "./AddToCalendar";
import { ShareAppointment } from "./ShareAppointment";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { patientService } from "@/lib/services/patientService";
import { PatientStepShell } from "@/lib/features/patient-onboarding/presentation/components/PatientStepShell";
import { getStepComponentData } from "@/lib/features/patient-onboarding/config/patient-onboarding-config";
import { useClinic } from "@/contexts/ClinicContext";
import { OnboardingReturningPatientDecision } from "@/lib/types/api";


export function AppointmentConfirmationContent() {
  const [showAssessment, setShowAssessment] = useState(false);
  const { clinicInfo } = useClinic();
  const [confirmationData, setConfirmationData] = useState<{
    appointment_id: number;
    guest_patient_id: number;
    doctor: { name: string };
    date: string;
    time: string;
    visitType: { name: string; id: number };
    address?: {
      address_line1: string;
      address_line2?: string | null;
      city: string;
      state_province: string;
      postal_code: string;
      country: string;
    };
    clinic?: {
      name: string;
      address: string;
      phone: string;
    };
    fulfillment?: {
      method: 'pickup' | 'delivery';
      pharmacy?: {
        id: number;
        name: string;
        address: string;
        city: string;
        province: string;
        postal_code?: string;
        phone: string;
      };
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShowHealthCheckin, setShouldShowHealthCheckin] = useState(false);
  const [returningPatientDecision, setReturningPatientDecision] = useState<OnboardingReturningPatientDecision | null>(null);
  const router = useRouter();

  // Get step configuration
  const stepData = getStepComponentData("confirmation");

  // Fetch confirmation data from API
  useEffect(() => {
    const fetchConfirmationData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get phone number from localStorage
        const savedPhone = localStorage.getItem('patient-phone-number');

        if (!savedPhone) {
          setError('Phone number not found. Please start the onboarding process again.');
          setIsLoading(false);
          return;
        }

        const progressResponse = await patientService.getOnboardingProgress(savedPhone);

        if (progressResponse.success && progressResponse.data) {
          const apiData = progressResponse.data;
          
          // Extract returning patient decision first (regardless of confirmation status)
          if (apiData.returning_patient_decision) {
            setReturningPatientDecision(apiData.returning_patient_decision);
          }

          const followupStatuses = apiData.state?.health_concerns?.followup_status;
          const hasFollowupFlag = Array.isArray(followupStatuses)
            ? followupStatuses.some((status) => status === true || status === "true")
            : followupStatuses === true || followupStatuses === "true";
          setShouldShowHealthCheckin(hasFollowupFlag);

          // Extract confirmation data from the API response
          if (apiData.state?.confirmation && apiData.state?.appointment && apiData.state?.provider) {
            const confirmation = {
              appointment_id: apiData.state.confirmation.appointment_id,
              guest_patient_id: apiData.state.confirmation.guest_patient_id,
              date: apiData.state.appointment.date,
              time: apiData.state.appointment.time,
              doctor: {
                name: `Dr. ${apiData.state.provider.first_name} ${apiData.state.provider.last_name}`,
                specialty: 'Family Medicine' // Default specialty since not in API
              },
              visitType: apiData.state.visit_type || { name: 'Virtual Visit', id: 1 },
              address: apiData.state.address,
              clinic: {
                name: clinicInfo?.name || 'Health Clinic',
                address: clinicInfo ? `${clinicInfo.address}, ${clinicInfo.city}, ${clinicInfo.province} ${clinicInfo.postal_code}` : '123 Main Street, Prince Rupert, BC V8J 1A1',
                phone: clinicInfo?.phone || '(250) 555-0123'
              },
              fulfillment: apiData.state.fulfillment ? {
                method: apiData.state.fulfillment.method,
                pharmacy: apiData.state.fulfillment.pharmacy
              } : undefined
            };

            setConfirmationData(confirmation);
          } else {
            setError('Confirmation data not found. Please try again.');
          }
        } else {
          console.error('Confirmation API failed:', progressResponse.message);
          setError(progressResponse.message || 'Failed to fetch confirmation information');
        }
      } catch (error) {
        console.error('Error fetching confirmation data:', error);
        setError('Failed to fetch confirmation information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfirmationData();
  }, []);

  // Only prevent body scroll when chat modal is open (not for wizard)
  useEffect(() => {
    if (showAssessment) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAssessment]);

  // Format date from API response (YYYY-MM-DD)
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Format time from API response (HH:MM)
  const formatTime = (timeString: string) => {
    if (!timeString) return "Not specified";
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  // Format address for display
  const formatAddress = (address: {
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state_province: string;
    postal_code: string;
  }) => {
    if (!address) return '';
    const parts = [
      address.address_line1,
      address.address_line2,
      address.city,
      address.state_province,
      address.postal_code
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Check if visit is virtual
  const isVirtualVisit = (visitType: { name: string; id: number }) => {
    if (!visitType) return true; // Default to virtual
    return visitType.name?.toLowerCase().includes('virtual') || 
           visitType.name?.toLowerCase().includes('telehealth') ||
           visitType.name?.toLowerCase().includes('online');
  };

  const handleStartAssessment = async () => {
    if (!confirmationData) {
      console.error('No confirmation data available');
      return;
    }

    try {
      setIsGeneratingQuestions(true);

      // SECURITY: Navigate to health-checkin without exposing appointment_id in URL
      // The health-checkin page will authenticate the user and get their appointment_id securely
      router.push('/onboarding/patient/health-checkin');
    } catch (error) {
      console.error('Error starting health check-in:', error);
      setIsGeneratingQuestions(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <PatientStepShell
        title="Loading..."
        description="Loading your confirmation..."
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
        useCard={false}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading confirmation..." />
        </div>
      </PatientStepShell>
    );
  }

  // Show error state
  if (error) {
    return (
      <PatientStepShell
        title="Error"
        description="Something went wrong"
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
        useCard={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      </PatientStepShell>
    );
  }

  // Show confirmation content
  if (!confirmationData) {
    return (
      <PatientStepShell
        title="No Data"
        description="Confirmation data not available"
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
        useCard={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-gray-500 mb-4">No confirmation data available</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      </PatientStepShell>
    );
  }

  const appt = confirmationData;


  return (
    <>
      <PatientStepShell
        title=""
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
        useCard={false}
        contentMaxWidthClass="max-w-xl"
      >
        <div className="max-w-xl mx-auto pb-16 px-6">
          {/* Confirmation Section - Compact + Actionable */}
          <div className="mb-6 pt-8">
            <div className="w-full">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 min-w-[24px] min-h-[24px] bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 aspect-square">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Your appointment is confirmed!</h1>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-12">
            {/* Appointment Details */}
            <div className="w-full space-y-4">
              {/* Doctor Name */}
              <h2 className="text-xl font-semibold text-gray-900">{appt.doctor.name}</h2>
              
              {/* Date & Time */}
              <div className="flex items-center gap-3 w-fit">
                <Calendar className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <span className="text-gray-900">{formatDate(appt.date)} · {formatTime(appt.time)}</span>
              </div>
              
              {/* Visit Type */}
              <div className="flex items-center gap-3 w-fit">
                {isVirtualVisit(appt.visitType) ? (
                  <InclinicIcon className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <WalkinIcon className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-gray-900">
                  {isVirtualVisit(appt.visitType) ? 'Virtual Visit' : 'In-Clinic Visit'}
                </span>
              </div>
              
              {/* Video Link Info - Virtual Only */}
              {isVirtualVisit(appt.visitType) && (
                <div className="flex items-center gap-3 text-sm text-blue-600 w-fit">
                  <Link className="w-4 h-4 flex-shrink-0" />
                  <span>Your secure video link will be shared with you 2 hours before your appointment.</span>
                </div>
              )}
              
              {/* Add to Calendar Button */}
              <div className="pt-4">
                <AddToCalendar appointment={appt} buttonWidth="w-auto" />
              </div>
            </div>

            {/* Clinic Info for in-person visits */}
            {!isVirtualVisit(appt.visitType) && appt.clinic && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinic Information</h3>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">{appt.clinic.name}</p>
                    <p className="text-gray-600">{appt.clinic.address}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      Directions
                    </Button>
                  </div>
                </div>
              </div>
            )}


            {/* Additional Services */}
            <div className="grid grid-cols-1 gap-6">
              {/* Prescription Services Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Store className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Rx Fulfillment</h3>
                </div>
                
                <div className="space-y-4">
                  {appt.fulfillment?.method === 'delivery' ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-gray-900">Delivery — to your home address</p>
                          {appt.address && (
                            <p className="text-sm text-gray-600 mt-1">{formatAddress(appt.address)}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Show pharmacy info for delivery method */}
                      {appt.fulfillment?.pharmacy && (
                        <div className="flex items-start gap-3">
                          <Store className="w-4 h-4 text-gray-600 mt-1" />
                          <div>
                            <p className="font-medium text-gray-900">Your Pharmacy</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {`${appt.fulfillment.pharmacy.name}, ${appt.fulfillment.pharmacy.address}, ${appt.fulfillment.pharmacy.province} ${appt.fulfillment.pharmacy.postal_code ?? ''}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Pickup — {appt.fulfillment?.pharmacy?.name || 'Selected Pharmacy'}</p>
                        {appt.fulfillment?.pharmacy && (
                          <>
                            <p className="text-sm text-gray-600 mt-1">{`${appt.fulfillment.pharmacy.address}, ${appt.fulfillment.pharmacy.province} ${appt.fulfillment.pharmacy.postal_code ?? ''}`}</p>
                            <p className="text-xs text-gray-500 mt-1">{appt.fulfillment.pharmacy.phone}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clinic Info Card - Only for in-person visits */}
              {appt.visitType && !appt.visitType.name.toLowerCase().includes('virtual') && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Hospital className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Clinic Info</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-900">{appt.clinic?.name || 'Health Clinic'}</p>
                      <p className="text-sm text-gray-600 mt-1">{appt.clinic?.address || '123 Main Street, Prince Rupert, BC V8J 1A1'}</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => window.open(`tel:${appt.clinic?.phone || '(250) 555-0123'}`)}
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          const address = encodeURIComponent(appt.clinic?.address || '123 Main Street, Prince Rupert, BC V8J 1A1');
                          window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                        }}
                      >
                        <Navigation className="w-4 h-4" />
                        Get Directions
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pre-Visit Questions Card */}
              {shouldShowHealthCheckin && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Pre-Visit Questions</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    Answer a few quick questions about your symptoms so {appt.doctor.name} can prepare for your visit.
                  </p>

                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      <span>2–3 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>Secure & private</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleStartAssessment}
                    disabled={isGeneratingQuestions}
                    size="lg"
                    className="w-full"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating Questions...
                      </>
                    ) : (
                      'Start Followup'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </PatientStepShell>

      {/* AI Assessment Chat Modal - Outside PatientStepShell */}
      {showAssessment && (
        <AiAssessmentChat
          onClose={() => setShowAssessment(false)}
          doctorName={appt.doctor.name}
          appointmentDate={formatDate(appt.date)}
          appointmentTime={formatTime(appt.time)}
          followupQuestions={[]}
        />
      )}
    </>
  );
}


