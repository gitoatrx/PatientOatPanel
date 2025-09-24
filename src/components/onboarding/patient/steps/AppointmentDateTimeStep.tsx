"use client";
import React, { useState, memo, useEffect } from "react";
import { Clock, Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { useEnterKey } from "@/lib/hooks/useEnterKey";
import { format, addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { patientService } from "@/lib/services/patientService";
import { DateGridSkeleton, TimeSlotsGridSkeleton } from "@/components/ui/skeleton-loaders";

// Interface for the component's internal date format - using strings to avoid timezone issues
interface ComponentDate {
  value: string; // ISO date string (YYYY-MM-DD)
  label: string; // Display label (e.g., "Sep 22, Mon")
  formatted_date: string; // API formatted date
  day_name: string; // Day name from API
  day_short: string; // Short day name from API
}

interface AppointmentDateTimeStepProps {
  onNext: () => void;
  getPersonalizedLabel: (step: number) => string;
  providerId?: number;
}

// Enhanced animation variants for step transitions
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
};

const stepTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 35,
  mass: 0.8,
};

// Simplified container variants without zoom animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
    },
  },
};

// Simplified item variants without scale animation
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

// Helper function to add "Today" or "Tomorrow" labels for Vancouver, BC timezone
const addRelativeDateLabel = (dateString: string, originalLabel: string): string => {
  try {
    // Get current date in Vancouver, BC timezone
    const vancouverTimeZone = "America/Vancouver";
    const now = new Date();
    const vancouverTime = toZonedTime(now, vancouverTimeZone);
    
    // Format dates for comparison (YYYY-MM-DD)
    const today = format(vancouverTime, "yyyy-MM-dd");
    const tomorrow = format(addDays(vancouverTime, 1), "yyyy-MM-dd");
    
    // Compare with the appointment date
    if (dateString === today) {
      return "Today";
    } else if (dateString === tomorrow) {
      return "Tomorrow";
    }
    
    return originalLabel;
  } catch (error) {
    // If there's any error with date processing, return the original label
    return originalLabel;
  }
};

// Mock data generation removed - only using real API data now

// Static time slots generation removed - now using API data

export const AppointmentDateTimeStep = memo(function AppointmentDateTimeStep({
  onNext,
  providerId,
}: AppointmentDateTimeStepProps) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Date, 2: Time
  const [direction, setDirection] = useState(0);
  const [displayedDatesCount, setDisplayedDatesCount] = useState(6);
  const [displayedSlotsCount, setDisplayedSlotsCount] = useState(12);
  const [availableDates, setAvailableDates] = useState<ComponentDate[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [datesError, setDatesError] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [timeSlotsError, setTimeSlotsError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // Track selected date independently

  const {
    watch,
    setValue,
    formState: { errors },
    trigger,
    clearErrors, // Add this line
  } = useFormContext();
  const formValues = watch();

  // Sync selected date with form state
  useEffect(() => {
    if (formValues.appointmentDate && formValues.appointmentDate !== selectedDate) {
      setSelectedDate(formValues.appointmentDate);
    }
  }, [formValues.appointmentDate, selectedDate]);

  // Fetch available dates from API when providerId is available
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!providerId) {
        // No providerId available - show error message
        setDatesError('No provider selected. Please go back and select a provider first.');
        setAvailableDates([]);
        return;
      }

      setIsLoadingDates(true);
      setDatesError(null);

      try {
        const response = await patientService.getAvailableSlots(providerId);

        if (response.success && response.data) {

          // Convert API dates to the format expected by the component - using strings to avoid timezone issues
          const convertedDates: ComponentDate[] = response.data.map(apiDate => {
            // Remove year from the formatted date for display
            const labelWithoutYear = apiDate.formatted_date.replace(/,?\s*\d{4}$/, '');
            
            // Add "Today" or "Tomorrow" labels for Vancouver, BC timezone
            const enhancedLabel = addRelativeDateLabel(apiDate.date, labelWithoutYear);

            return {
              value: apiDate.date, // Keep as string (YYYY-MM-DD)
              label: enhancedLabel, // Enhanced label with Today/Tomorrow
              formatted_date: apiDate.formatted_date,
              day_name: apiDate.day_name,
              day_short: apiDate.day_short,
            };
          });

          setAvailableDates(convertedDates);
        } else {
          console.error('Failed to fetch available dates:', response.message);
          setDatesError(response.message || 'Failed to fetch available dates');
          setAvailableDates([]);
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
        setDatesError('Failed to fetch available dates');
        setAvailableDates([]);
      } finally {
        setIsLoadingDates(false);
      }
    };

    fetchAvailableDates();
  }, [providerId]);

  // Fetch available time slots when a date is selected
  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      const selectedDate = formValues.appointmentDate;

      if (!selectedDate || !providerId) {
        setAvailableTimeSlots([]);
        return;
      }

      setIsLoadingTimeSlots(true);
      setTimeSlotsError(null);

      try {
        const response = await patientService.getAvailableTimeSlots(providerId, selectedDate);

        if (response.success && response.data) {

          // Convert API time slots to the format expected by the component
          // The API already provides both time and label, so we can use them directly
          const convertedTimeSlots = response.data.map(slot => ({
            value: slot.time, // Use the raw time format (e.g., "09:30")
            label: slot.label, // Use the user-friendly label (e.g., "9:30 AM")
          }));

          setAvailableTimeSlots(convertedTimeSlots);
        } else {
          console.error('Failed to fetch time slots:', response);
          setTimeSlotsError('Failed to fetch available time slots');
          setAvailableTimeSlots([]);
        }
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setTimeSlotsError('Failed to fetch available time slots');
        setAvailableTimeSlots([]);
      } finally {
        setIsLoadingTimeSlots(false);
      }
    };

    fetchAvailableTimeSlots();
  }, [formValues.appointmentDate, providerId]);

  // Time slots are now fetched from API - no need for static generation

  // Constants
  const DATES_TO_LOAD_MORE = 6;
  const SLOTS_TO_LOAD_MORE = 12;

  // Helper functions removed - using API data directly to avoid timezone issues

  // Validation function
  const validateCurrentStep = async () => {
    if (currentStep === 1) {
      return await trigger("appointmentDate");
    } else if (currentStep === 2) {
      // Validate both date and time when on time step
      const dateValid = await trigger("appointmentDate");
      const timeValid = await trigger("appointmentTime");
      return dateValid && timeValid;
    }
    return true;
  };

  // Update the handleNext function to properly validate both date and time
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      if (currentStep < 2) {
        goToStep(currentStep + 1, 1);
      } else {
        // Only proceed if both date and time are selected
        if (formValues.appointmentDate && formValues.appointmentTime) {
          onNext();
        } else {
          // Show error if time is not selected
          if (!formValues.appointmentTime) {
            await trigger("appointmentTime");
          }
        }
      }
    } else {
      // If validation fails, trigger the specific field that's missing
      if (currentStep === 1 && !formValues.appointmentDate) {
        await trigger("appointmentDate");
      } else if (currentStep === 2 && !formValues.appointmentTime) {
        await trigger("appointmentTime");
      }
    }
  };

  const enterKeyHandler = useEnterKey(handleNext);

  // Get displayed dates and slots with smart pagination
  const getDisplayedDates = () => {
    if (!selectedDate) {
      // If no date is selected, show the first batch
      return availableDates.slice(0, displayedDatesCount);
    }

    // Find the index of the selected date
    const selectedIndex = availableDates.findIndex(date => date.value === selectedDate);

    if (selectedIndex === -1) {
      // Selected date not found, show first batch
      return availableDates.slice(0, displayedDatesCount);
    }

    // Ensure selected date is visible by adjusting the slice
    const startIndex = Math.max(0, selectedIndex - Math.floor(displayedDatesCount / 2));
    const endIndex = Math.min(availableDates.length, startIndex + displayedDatesCount);

    return availableDates.slice(startIndex, endIndex);
  };

  const displayedDates = getDisplayedDates();
  const hasMoreDates = displayedDatesCount < availableDates.length;
  const displayedTimeSlots = availableTimeSlots.slice(0, displayedSlotsCount);
  const hasMoreSlots = displayedSlotsCount < availableTimeSlots.length;

  // Step navigation functions
  const goToStep = (step: number, newDirection: number = 1) => {
    setDirection(newDirection);
    setCurrentStep(step);
  };

  const goToNextStep = () => {
    if (currentStep < 2) {
      goToStep(currentStep + 1, 1);
    }
  };

  // Handle date selection with validation
  const handleDateSelect = async (dateToSelect: ComponentDate) => {
    // Use the date string directly from the API - no timezone conversion needed
    setValue("appointmentDate", dateToSelect.value);
    setSelectedDate(dateToSelect.value); // Update local state

    // Validate the field
    await trigger("appointmentDate");

    // Clear any existing time selection when date changes
    setValue("appointmentTime", "");
    clearErrors("appointmentTime");

    // Auto-advance to next step
    setTimeout(() => {
      goToNextStep();
    }, 500);
  };

  // Handle time selection with validation
  const handleTimeSelect = async (slot: { value: string; label: string }) => {
    // Set the value first
    setValue("appointmentTime", slot.value);

    // Clear any existing errors immediately
    clearErrors("appointmentTime");

    // Validate the field
    await trigger("appointmentTime");

    // Don't auto-advance - let the Continue button handle navigation
  };

  // Load more functions
  const handleLoadMoreDates = () => {
    setDisplayedDatesCount((prev) => prev + DATES_TO_LOAD_MORE);
  };

  const handleLoadMoreSlots = () => {
    setDisplayedSlotsCount((prev) => prev + SLOTS_TO_LOAD_MORE);
  };

  // Date navigation functions
  const handlePreviousDates = () => {
    if (selectedDate) {
      const selectedIndex = availableDates.findIndex(date => date.value === selectedDate);
      if (selectedIndex > 0) {
        const previousDate = availableDates[selectedIndex - 1];
        handleDateSelect(previousDate);
      }
    } else if (availableDates.length > 0) {
      // If no date selected, select the first available date
      handleDateSelect(availableDates[0]);
    }
  };

  const handleNextDates = () => {
    if (selectedDate) {
      const selectedIndex = availableDates.findIndex(date => date.value === selectedDate);
      if (selectedIndex < availableDates.length - 1) {
        const nextDate = availableDates[selectedIndex + 1];
        handleDateSelect(nextDate);
      }
    } else if (availableDates.length > 0) {
      // If no date selected, select the first available date
      handleDateSelect(availableDates[0]);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6" onKeyDown={enterKeyHandler}>
      {/* Selected Summary (when not on first step) */}
      {currentStep > 1 && (
        <motion.div
          className="p-0 sm:p-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-col gap-3 sm:gap-4 w-full">
            {/* Date Card */}
            {formValues.appointmentDate && (
              <div className="flex-1 bg-background border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2  min-w-0">
                <Calendar className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {formValues.appointmentDate
                    ? (() => {
                      // Find the date object from availableDates to get the proper label
                      const selectedDateObj = availableDates.find(
                        date => date.value === formValues.appointmentDate
                      );
                      return selectedDateObj ? selectedDateObj.label : formValues.appointmentDate;
                    })()
                    : ""}
                </span>
                <button
                  type="button"
                  onClick={() => goToStep(1, -1)}
                  className="ml-auto px-2 py-1 text-xs font-medium text-blue-600 hover:underline rounded transition-colors flex-shrink-0"
                >
                  Change
                </button>
              </div>
            )}
            {/* Time Card */}
            {formValues.appointmentTime && (
              <div className="flex-1 bg-background border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2  min-w-0">
                <Clock className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <span className="font-medium text-foreground">
                  {availableTimeSlots.find(slot => slot.value === formValues.appointmentTime)?.label || formValues.appointmentTime}
                </span>
                <button
                  type="button"
                  onClick={() => goToStep(2, -1)}
                  className="ml-auto px-2 py-1 text-xs font-medium text-blue-600 hover:underline rounded transition-colors flex-shrink-0"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Error Messages */}
      {(errors.appointmentDate || errors.appointmentTime) && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
        >
          {errors.appointmentDate && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium text-sm">
                    {errors.appointmentDate.message?.toString()}
                  </p>
                  <p className="text-red-600 text-xs mt-1">
                    Choose a date from the available options below
                  </p>
                </div>
              </div>
            </div>
          )}
          {errors.appointmentTime && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium text-sm">
                    {errors.appointmentTime.message?.toString()}
                  </p>
                  <p className="text-red-600 text-xs mt-1">
                    Choose a time from the available slots below
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Step Content */}
      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {/* Step 1: Date Selection */}
          {currentStep === 1 && (
            <motion.div
              key="date"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
              className="w-full"
            >
              <motion.div
                className=" p-4 sm:p-0 rounded-2xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="space-y-4">
                  {/* Loading state */}
                  {isLoadingDates && <DateGridSkeleton count={10} />}

                  {/* Error state */}
                  {datesError && !isLoadingDates && (
                    <div className="text-center py-8">
                      <div className="text-red-600 text-sm mb-2">{datesError}</div>
                      {datesError.includes('No provider selected') && (
                        <p className="text-xs text-muted-foreground">Please go back and select a provider first</p>
                      )}
                    </div>
                  )}

                  {/* No available dates state */}
                  {!isLoadingDates && !datesError && availableDates.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Available Dates</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        There are currently no available appointment dates for this provider.
                      </p>
                      <p className="text-xs text-gray-400">
                        Please try again later or contact the clinic for assistance.
                      </p>
                    </div>
                  )}

                  {/* Available dates grid */}
                  {!isLoadingDates && !datesError && availableDates.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {displayedDates.map((date, index) => {
                        // Use the selectedDate state for more reliable selection tracking
                        const isSelected = selectedDate === date.value || formValues.appointmentDate === date.value;

                        return (
                          <motion.button
                            key={date.value}
                            type="button"
                            onClick={() => handleDateSelect(date)}
                            className={cn(
                              "p-4 sm:p-3 rounded-lg transition-all duration-300 text-center font-medium relative overflow-hidden group text-sm min-h-[80px] sm:min-h-[70px]",
                              isSelected
                                ? "text-white border-2 border-transparent bg-blue-600"
                                : "border-2 border-gray-200 bg-white text-gray-700 hover:bg-blue-500 hover:text-white hover:border-blue-500",
                            )}
                            variants={itemVariants}
                            custom={index}
                          >
                            {/* Content */}
                            <div className="relative z-10 flex flex-col justify-center h-full">
                              <div className="text-sm font-semibold leading-tight">
                                {date.label}
                              </div>
                              <div className="text-xs opacity-80 mt-1">
                                {date.day_short}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* Simplified Load More Dates Button */}
                  {!isLoadingDates && !datesError && hasMoreDates && (
                    <div className="text-center pt-4 sm:pt-6">
                      <button
                        type="button"
                        onClick={handleLoadMoreDates}
                        className="px-6 sm:px-8 py-3 text-sm rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg text-white mx-auto"
                        style={{
                          background: "#2563eb", // blue-600 - same as selected date
                        }}
                      >
                        Load More Dates
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Step 2: Time Selection */}
          {currentStep === 2 && (
            <motion.div
              key="time"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
              className="w-full"
            >
              <motion.div
                className=" p-4 sm:p-0 rounded-2xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <h3 className="font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 text-lg sm:text-xl">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                  Available Times
                </h3>

                {!formValues.appointmentDate ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Please select a date first</p>
                  </div>
                ) : isLoadingTimeSlots ? (
                  <TimeSlotsGridSkeleton count={8} />
                ) : timeSlotsError ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-red-600 mb-2">{timeSlotsError}</p>
                    <p className="text-xs text-gray-400">
                      Please try again or select a different date
                    </p>
                  </div>
                ) : availableTimeSlots.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No time slots available for this date</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Please select a different date
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Time slots grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {displayedTimeSlots.map((slot, index) => (
                        <motion.button
                          key={slot.value}
                          type="button"
                          onClick={() => handleTimeSelect(slot)}
                          className={cn(
                            "p-4 sm:p-3 rounded-lg transition-all duration-300 text-center font-medium relative overflow-hidden group text-sm min-h-[60px] sm:min-h-[50px]",
                            formValues.appointmentTime === slot.value
                              ? "text-white border-2 border-transparent bg-green-600"
                              : "border-2 border-gray-200 bg-white text-gray-700 hover:bg-green-500 hover:text-white hover:border-green-500",
                          )}
                          variants={itemVariants}
                          custom={index}
                        >
                          {/* Content */}
                          <div className="relative z-10 flex items-center justify-center h-full">
                            <div className="text-sm font-semibold">
                              {slot.label}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Simplified Load More Button */}
                    {hasMoreSlots && (
                      <div className="text-center pt-3 sm:pt-4">
                        <button
                          type="button"
                          onClick={handleLoadMoreSlots}
                          className="px-6 sm:px-8 py-3 text-sm rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg text-white mx-auto"
                          style={{
                            background: "#16a34a", // green-600 - same as selected time slot
                          }}
                        >
                          Load More
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
