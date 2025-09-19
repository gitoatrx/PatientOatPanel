export interface TimeSlot {
  value: string;
  label: string;
  period: "morning" | "afternoon" | "evening";
  available: boolean;
}

export const TIME_SLOTS: TimeSlot[] = [
  // Morning slots (9:00 AM - 11:30 AM)
  { value: "09:00", label: "9:00 AM", period: "morning", available: true },
  { value: "09:30", label: "9:30 AM", period: "morning", available: true },
  { value: "10:00", label: "10:00 AM", period: "morning", available: true },
  { value: "10:30", label: "10:30 AM", period: "morning", available: false },
  { value: "11:00", label: "11:00 AM", period: "morning", available: true },
  { value: "11:30", label: "11:30 AM", period: "morning", available: true },

  // Afternoon slots (12:00 PM - 4:30 PM)
  { value: "12:00", label: "12:00 PM", period: "afternoon", available: true },
  { value: "12:30", label: "12:30 PM", period: "afternoon", available: false },
  { value: "13:00", label: "1:00 PM", period: "afternoon", available: true },
  { value: "13:30", label: "1:30 PM", period: "afternoon", available: true },
  { value: "14:00", label: "2:00 PM", period: "afternoon", available: false },
  { value: "14:30", label: "2:30 PM", period: "afternoon", available: true },
  { value: "15:00", label: "3:00 PM", period: "afternoon", available: true },
  { value: "15:30", label: "3:30 PM", period: "afternoon", available: true },
  { value: "16:00", label: "4:00 PM", period: "afternoon", available: false },
  { value: "16:30", label: "4:30 PM", period: "afternoon", available: true },

  // Evening slots (5:00 PM - 7:30 PM)
  { value: "17:00", label: "5:00 PM", period: "evening", available: true },
  { value: "17:30", label: "5:30 PM", period: "evening", available: true },
  { value: "18:00", label: "6:00 PM", period: "evening", available: false },
  { value: "18:30", label: "6:30 PM", period: "evening", available: true },
  { value: "19:00", label: "7:00 PM", period: "evening", available: true },
  { value: "19:30", label: "7:30 PM", period: "evening", available: true },
];

export const getAvailableTimeSlots = () =>
  TIME_SLOTS.filter((slot) => slot.available);

export const getTimeSlotsByPeriod = (
  period: "morning" | "afternoon" | "evening",
) => TIME_SLOTS.filter((slot) => slot.period === period && slot.available);

export const getMorningSlots = () => getTimeSlotsByPeriod("morning");
export const getAfternoonSlots = () => getTimeSlotsByPeriod("afternoon");
export const getEveningSlots = () => getTimeSlotsByPeriod("evening");
