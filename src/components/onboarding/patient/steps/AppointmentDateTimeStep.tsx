"use client";
import React, { useState, useMemo, memo } from "react";
import { Clock, Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { useEnterKey } from "@/lib/hooks/useEnterKey";
import {
  createVancouverDateFromString,
  toVancouverDateString,
  generateVancouverDates,
  generateVancouverTimeSlots,
  formatVancouverDateForDisplay,
  formatVancouverDayForDisplay,
  formatTimeForDisplay,
  isVancouverToday,
  isPastVancouverBusinessHours,
} from "@/lib/utils/date-time-utils";

interface AppointmentDateTimeStepProps {
  onNext: () => void;
  getPersonalizedLabel: (step: number) => string;
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

// Use the reusable Vancouver date generation function
const generateMockDates = () => generateVancouverDates();

// Use the reusable Vancouver time slots generation function
const generateTimeSlotsForDate = (selectedDate: Date) => {
  // If it's today and past business hours, return empty array
  if (isVancouverToday(selectedDate) && isPastVancouverBusinessHours(selectedDate)) {
    return [];
  }

  return generateVancouverTimeSlots(selectedDate);
};

export const AppointmentDateTimeStep = memo(function AppointmentDateTimeStep({
  onNext,
}: AppointmentDateTimeStepProps) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Date, 2: Time
  const [direction, setDirection] = useState(0);
  const [displayedDatesCount, setDisplayedDatesCount] = useState(6);
  const [displayedSlotsCount, setDisplayedSlotsCount] = useState(12);

  const {
    watch,
    setValue,
    formState: { errors },
    trigger,
    clearErrors, // Add this line
  } = useFormContext();
  const formValues = watch();

  // Generate available dates
  const availableDates = useMemo(() => generateMockDates(), []);

  // Generate time slots based on selected date
  const availableTimeSlots = useMemo(() => {
    const selectedDate = formValues.appointmentDate;
    if (!selectedDate) return [];

    // Parse the selected date string properly to avoid timezone issues
    const date = createVancouverDateFromString(selectedDate);

    // If it's today and past business hours, return empty array
    if (isVancouverToday(date) && isPastVancouverBusinessHours(date)) {
      return [];
    }

    return generateTimeSlotsForDate(date);
  }, [formValues.appointmentDate]);

  // Constants
  const DATES_TO_LOAD_MORE = 6;
  const SLOTS_TO_LOAD_MORE = 12;

  // Helper functions - now using reusable Vancouver timezone functions
  const formatDateForDisplay = formatVancouverDateForDisplay;
  const formatDayForDisplay = formatVancouverDayForDisplay;

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
    }
  };

  const enterKeyHandler = useEnterKey(handleNext);

  // Get displayed dates and slots
  const displayedDates = availableDates.slice(0, displayedDatesCount);
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
  const handleDateSelect = async (selectedDate: Date) => {
    // Use reusable Vancouver date string function
    const dateString = toVancouverDateString(selectedDate);
    setValue("appointmentDate", dateString);

    // Validate the field
    await trigger("appointmentDate");

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
                          date => toVancouverDateString(date.date) === formValues.appointmentDate
                        );
                        return selectedDateObj ? selectedDateObj.label : formatDateForDisplay(createVancouverDateFromString(formValues.appointmentDate));
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
        <div className="space-y-2">
          {errors.appointmentDate && (
            <div className="text-red-600 text-sm">
              {errors.appointmentDate.message?.toString()}
            </div>
          )}
          {errors.appointmentTime && (
            <div className="text-red-600 text-sm">
              {errors.appointmentTime.message?.toString()}
            </div>
          )}
        </div>
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
                  {/* Available dates grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-2">
                    {displayedDates.map((date, index) => {
                      // Use reusable Vancouver date string function
                      const dateString = toVancouverDateString(date.date);
                      const isSelected =
                        formValues.appointmentDate === dateString;

                      return (
                        <motion.button
                          key={dateString}
                          type="button"
                          onClick={() => handleDateSelect(date.date)}
                          className={cn(
                            "p-3 sm:p-3 rounded-lg transition-all duration-300 text-center font-medium relative overflow-hidden group text-sm",
                            isSelected
                              ? "text-white border-2 border-transparent"
                              : "border-2 border-gray-200 bg-white text-gray-700",
                          )}
                          style={
                            isSelected
                              ? {
                                  background: "#2563eb", // blue-600 - prominent blue from your project
                                }
                              : {
                                  background: "white",
                                }
                          }
                          variants={itemVariants}
                          custom={index}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = "#3b82f6"; // blue-500 - lighter blue for hover
                              e.currentTarget.style.color = "white";
                              e.currentTarget.style.borderColor = "#3b82f6"; // Maintain border color on hover
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = "white";
                              e.currentTarget.style.color = "#374151";
                              e.currentTarget.style.borderColor = "#e5e7eb"; // Reset to gray-200 border
                            }
                          }}
                        >
                          {/* Content */}
                          <div className="relative z-10">
                            <div className="text-sm font-semibold">
                              {date.label}
                            </div>
                            <div className="text-xs opacity-80 mt-1">
                              {formatDayForDisplay(date.date)}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Simplified Load More Dates Button */}
                  {hasMoreDates && (
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
                ) : availableTimeSlots.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No slots available for this date</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Please select a different date
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Time slots grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1 sm:gap-2">
                      {displayedTimeSlots.map((slot, index) => (
                        <motion.button
                          key={slot.value}
                          type="button"
                          onClick={() => handleTimeSelect(slot)}
                          className={cn(
                            "p-2 sm:p-3 rounded-lg transition-all duration-300 text-center font-medium relative overflow-hidden group text-sm",
                            formValues.appointmentTime === slot.value
                              ? "text-white border-2 border-transparent"
                              : "border-2 border-gray-200 bg-white text-gray-700",
                          )}
                          style={
                            formValues.appointmentTime === slot.value
                              ? {
                                  background: "#16a34a", // green-600 - different color for time slots
                                }
                              : {
                                  background: "white",
                                }
                          }
                          variants={itemVariants}
                          custom={index}
                          onMouseEnter={(e) => {
                            if (formValues.appointmentTime !== slot.value) {
                              e.currentTarget.style.background = "#22c55e"; // green-500 - lighter green for hover
                              e.currentTarget.style.color = "white";
                              e.currentTarget.style.borderColor = "#22c55e"; // Maintain border color on hover
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (formValues.appointmentTime !== slot.value) {
                              e.currentTarget.style.background = "white";
                              e.currentTarget.style.color = "#374151";
                              e.currentTarget.style.borderColor = "#e5e7eb"; // Reset to gray-200 border
                            }
                          }}
                        >
                          {/* Content */}
                          <div className="relative z-10">
                            <div className="text-xs font-semibold">
                              {slot.value}
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
