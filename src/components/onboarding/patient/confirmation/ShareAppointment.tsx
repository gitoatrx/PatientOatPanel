"use client";

import { useState, useEffect, useRef } from "react";
import { Share2, MessageCircle, Mail, Copy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import {
  generateShareText,
  generateShareURL,
  copyToClipboard,
  isMobileDevice,
  isWebShareSupported,
  type AppointmentData
} from "@/lib/utils/calendar-utils";

interface ShareAppointmentProps {
  appointment: AppointmentData;
  className?: string;
}

export function ShareAppointment({ appointment, className = "" }: ShareAppointmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Copy to clipboard
  const copyToClipboardAction = async () => {
    try {
      const shareText = generateShareText(appointment);
      const shareURL = generateShareURL(appointment);
      const fullText = `${shareText}\n\nView details: ${shareURL}`;

      const success = await copyToClipboard(fullText);
      if (success) {
        setCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "Appointment details have been copied to your clipboard",
          variant: "default",
        });
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Copy failed');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please try again.",
        variant: "error",
      });
    }
  };

  // Share via email
  const shareViaEmail = () => {
    const subject = `Appointment Confirmation - ${appointment.doctor.name}`;
    const shareText = generateShareText(appointment);
    const shareURL = generateShareURL(appointment);
    const body = `Hi,

I wanted to share my upcoming appointment details:

${shareText}

View more details: ${shareURL}

Best regards`;

    const mailtoURL = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoURL, '_blank');
  };

  // Share via SMS/WhatsApp
  const shareViaSMS = () => {
    const shareText = generateShareText(appointment);
    const shareURL = generateShareURL(appointment);
    const fullText = `${shareText}\n\nView details: ${shareURL}`;

    if (isMobileDevice()) {
      // Try WhatsApp first, fallback to SMS
      const whatsappURL = `whatsapp://send?text=${encodeURIComponent(fullText)}`;
      const smsURL = `sms:?body=${encodeURIComponent(fullText)}`;

      // Try to open WhatsApp, fallback to SMS if it fails
      const link = document.createElement('a');
      link.href = whatsappURL;
      link.click();

      // Fallback to SMS after a short delay if WhatsApp doesn't open
      setTimeout(() => {
        if (document.hidden) return; // WhatsApp opened successfully
        window.open(smsURL, '_blank');
      }, 1000);
    } else {
      // Desktop - open SMS app
      const smsURL = `sms:?body=${encodeURIComponent(fullText)}`;
      window.open(smsURL, '_blank');
    }
  };

  // Share via native Web Share API (if supported)
  const shareViaNative = async () => {
    if (isWebShareSupported()) {
      try {
        await navigator.share({
          title: `Appointment with ${appointment.doctor.name}`,
          text: generateShareText(appointment),
          url: generateShareURL(appointment),
        });
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast({
            title: "Share failed",
            description: "Unable to share. Please try another method.",
            variant: "error",
          });
        }
      }
    } else {
      // Fallback to copy to clipboard
      copyToClipboardAction();
    }
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copied ? Check : Copy,
      action: copyToClipboardAction,
      description: 'Copy appointment details to clipboard',
      isActive: copied
    },
    {
      name: 'Email',
      icon: Mail,
      action: shareViaEmail,
      description: 'Send via email'
    },
    {
      name: 'SMS/WhatsApp',
      icon: MessageCircle,
      action: shareViaSMS,
      description: 'Send via text message'
    },
    ...(isWebShareSupported() ? [{
      name: 'Share',
      icon: Share2,
      action: shareViaNative,
      description: 'Share using device options'
    }] : [])
  ];

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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Button
        onClick={handleToggleDropdown}
        variant="outline"
        className="w-full h-12 text-base font-medium border-gray-300 hover:bg-gray-50"
      >
        <Share2 className="w-5 h-5 mr-2" />
        Share Appointment
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
              {shareOptions.map((option, index) => (
                <motion.button
                  key={option.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    option.action();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-md ${option.isActive ? 'bg-green-50 text-green-700' : ''
                    }`}
                >
                  <option.icon className={`w-5 h-5 ${option.isActive ? 'text-green-600' : 'text-gray-600'}`} />
                  <div className="flex-1">
                    <div className={`font-medium ${option.isActive ? 'text-green-800' : 'text-gray-900'}`}>
                      {option.name}
                    </div>
                    <div className={`text-sm ${option.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                      {option.description}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
