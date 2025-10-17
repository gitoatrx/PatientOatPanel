"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Video, Phone, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { BimbleLogoIcon } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// Removed dynamic API imports - using static UI

// Form schema
const rescheduleSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
  appointmentDate: z.string().min(1, "Please select a date"),
  appointmentTime: z.string().min(1, "Please select a time"),
});

type RescheduleFormData = z.infer<typeof rescheduleSchema>;

export default function RescheduleAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const followupToken = params.followuptoken as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Static mock data
  const [appointmentData] = useState({
    id: 14840,
    doctor: { first_name: "RAPHAEL", last_name: "AJAYI", specialty: "General Practice" },
    visit_type_name: "Virtual (15 min) - Video Call",
    visit_type_duration: 15,
    scheduled_for: "2025-10-17T12:00:00Z",
  });

  const [providers] = useState([
    { id: 1, first_name: "RAPHAEL", last_name: "AJAYI", specialty: "General Practice", provider_no: "P001" },
    { id: 2, first_name: "SARAH", last_name: "JOHNSON", specialty: "Internal Medicine", provider_no: "P002" },
    { id: 3, first_name: "MICHAEL", last_name: "BROWN", specialty: "Family Medicine", provider_no: "P003" },
    { id: 4, first_name: "EMILY", last_name: "DAVIS", specialty: "General Practice", provider_no: "P004" },
  ]);

  const form = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: { doctorId: "1", appointmentDate: "", appointmentTime: "" },
  });

  const { watch, setValue } = form;
  const formValues = watch();

  // Mock time slots in AM/PM format
  const timeSlots = [
    "9:00 AM", "9:15 AM", "9:30 AM", "9:45 AM", "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM",
    "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM", "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM",
    "1:00 PM", "1:15 PM", "1:30 PM", "1:45 PM", "2:00 PM", "2:15 PM", "2:30 PM", "2:45 PM",
    "3:00 PM", "3:15 PM", "3:30 PM", "3:45 PM", "4:00 PM", "4:15 PM", "4:30 PM", "4:45 PM"
  ];

  // Mock available dates
  const availableDates = [
    "2024-01-15", "2024-01-16", "2024-01-17", "2024-01-18", "2024-01-19",
    "2024-01-22", "2024-01-23", "2024-01-24", "2024-01-25", "2024-01-26",
    "2024-01-29", "2024-01-30", "2024-01-31"
  ];

  // Simple static loading simulation
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const handleReschedule = async (data: RescheduleFormData) => {
    try {
      setIsSubmitting(true);
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Appointment Rescheduled",
        description: "Your appointment has been successfully rescheduled.",
      });
      
      router.push('/test-reschedule?success=true');
    } catch (error) {
      console.error("Reschedule error:", error);
      toast({
        variant: "error",
        title: "Reschedule Failed",
        description: "Failed to reschedule appointment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  // Static provider data - no conversion needed

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString);
    setValue('appointmentDate', dateString);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setValue('appointmentTime', time);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center text-gray-900 max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Unable to Load Appointment</h1>
          <p className="mb-6 text-gray-600">{error}</p>
          <Button onClick={() => router.back()} variant="outline" className="bg-white text-gray-900">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const doctorData = appointmentData.doctor;
  const { date: currentDate, time: currentTime } = formatDateTime(appointmentData.scheduled_for);
  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden">
        {/* Bimble Logo at Top */}
        <div className="flex justify-center py-4 border-b border-border">
          <BimbleLogoIcon className="w-8 h-8 text-primary" />
        </div>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleReschedule)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
              {/* Left Section - Meeting Details */}
              <div className="bg-gray-50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {doctorData.first_name[0]}{doctorData.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Dr. {doctorData.first_name} {doctorData.last_name}
                    </h3>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {appointmentData.visit_type_duration} Min Meeting
                  </h2>
                  <p className="text-gray-600 text-sm">Short & sweet! Let's get to the point.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{appointmentData.visit_type_duration} Minutes</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <Video className="w-4 h-4" />
                    <span className="text-sm">Video Call</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">America/Vancouver</span>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-pink-50 border border-pink-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span className="text-xs font-medium text-pink-800">Former Time</span>
                  </div>
                  <p className="text-xs text-gray-700">{currentTime}, {currentDate}</p>
                </div>
              </div>

              {/* Middle Section - Doctor Selection */}
              <div className="p-2 border-l border-r border-border">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">Select Doctor</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {providers.map(provider => (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => setValue('doctorId', provider.id.toString())}
                        className={`px-2 py-1 text-sm rounded-lg border transition-colors ${
                          formValues.doctorId === provider.id.toString()
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        Dr. {provider.first_name} {provider.last_name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

                  {/* Right Section - Date & Time Selection */}
                  <div className="p-2 space-y-2">
                    {/* Date Selection - Card Format */}
                    {formValues.doctorId && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Dates *</h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-5 gap-2">
                            {availableDates.slice(0, 10).map(dateString => {
                              const date = new Date(dateString);
                              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                              const dayNumber = date.getDate();
                              const isSelected = selectedDate === dateString;
                              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                              
                              return (
                                <button
                                  key={dateString}
                                  type="button"
                                  onClick={() => handleDateSelect(dateString)}
                                  className={`px-1.5 py-1 text-xs rounded-lg border transition-colors ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : isWeekend
                                      ? 'bg-destructive text-destructive-foreground border-destructive'
                                      : 'bg-background text-foreground border-border hover:bg-muted'
                                  }`}
                                >
                                  <div className="font-medium">{dayName}</div>
                                  <div className="font-semibold">{dayNumber}</div>
                                </button>
                              );
                            })}
                          </div>
                          <div className="text-center">
                            <button
                              type="button"
                              className="px-4 py-2 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-600 transition-colors"
                            >
                              +24 More
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Time Selection - Card Format */}
                    {formValues.doctorId && selectedDate && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Time *</h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-4 gap-2">
                            {timeSlots.slice(0, 16).map(time => {
                              const isSelected = selectedTime === time;
                              return (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => handleTimeSelect(time)}
                                  className={`px-1.5 py-1 text-xs rounded-lg border transition-colors ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-background text-foreground border-border hover:bg-muted'
                                  }`}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                          <div className="text-center">
                            <button
                              type="button"
                              className="px-4 py-2 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-600 transition-colors"
                            >
                              +3 More
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
            </div>

            {/* Submit Button */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-center">
              <Button 
                type="submit"
                disabled={!formValues.doctorId || !selectedDate || !selectedTime || isSubmitting}
                className="w-xs max-w-lg h-14"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Rescheduling...
                  </>
                ) : (
                  "Confirm Reschedule"
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}