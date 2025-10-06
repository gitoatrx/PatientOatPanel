"use client";

import { useState, useEffect, useRef } from "react";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateICSContent,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL,
  downloadICSFile,
  type AppointmentData
} from "@/lib/utils/calendar-utils";

interface AddToCalendarProps {
  appointment: AppointmentData;
  className?: string;
  buttonWidth?: string;
}

export function AddToCalendar({ appointment, className = "", buttonWidth = "w-full" }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);

  // Download ICS file
  const downloadICS = async () => {
    setIsGenerating(true);
    try {
      downloadICSFile(appointment);
    } catch (error) {
      console.error('Error downloading ICS file:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Open calendar in new tab
  const openCalendar = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Check available space and position dropdown accordingly
  const checkDropdownPosition = (buttonElement: HTMLElement) => {
    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Approximate height of dropdown

    // Check if there's enough space below
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Position dropdown above if there's more space above and not enough below
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  };

  // Handle dropdown toggle with position detection
  const handleToggleDropdown = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      checkDropdownPosition(event.currentTarget);
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Recalculate position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen && containerRef.current) {
        const button = containerRef.current.querySelector('button');
        if (button) {
          checkDropdownPosition(button);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const calendarOptions = [
    {
      name: 'Google Calendar',
      icon: '📅',
      action: () => openCalendar(generateGoogleCalendarURL(appointment)),
      description: 'Add to Google Calendar'
    },
    {
      name: 'Outlook',
      icon: '📧',
      action: () => openCalendar(generateOutlookCalendarURL(appointment)),
      description: 'Add to Outlook Calendar'
    },
    {
      name: 'Download .ics',
      icon: '💾',
      action: downloadICS,
      description: 'Download calendar file',
      isLoading: isGenerating
    }
  ];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Button
        onClick={handleToggleDropdown}
        className={`${buttonWidth} h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white`}
        disabled={isGenerating}
      >
        <CalendarPlus className="w-5 h-5 mr-2" />
        Add to Calendar
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: dropdownPosition === 'top' ? 10 : -10,
              scale: 0.95
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            exit={{
              opacity: 0,
              y: dropdownPosition === 'top' ? 10 : -10,
              scale: 0.95
            }}
            transition={{ duration: 0.2 }}
            className={`absolute left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden ${dropdownPosition === 'top'
              ? 'bottom-full mb-2'
              : 'top-full mt-2'
              }`}
          >
            <div className="p-2">
              {calendarOptions.map((option, index) => (
                <motion.button
                  key={option.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    option.action();
                    setIsOpen(false);
                  }}
                  disabled={option.isLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-lg">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.name}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                  {option.isLoading && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
