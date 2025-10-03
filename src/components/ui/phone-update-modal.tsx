"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskPhoneNumber } from "../../lib/utils/phone-utils";

interface PhoneUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneUpdated: (newPhone: string) => void;
  onSkip: () => void;
  currentPhone: string;
  phoneUpdateContext?: {
    existing_phone: string;
    submitted_phone: string;
  };
}

export function PhoneUpdateModal({
  isOpen,
  onClose,
  onPhoneUpdated,
  onSkip,
  currentPhone,
  phoneUpdateContext,
}: PhoneUpdateModalProps) {
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneUpdate = async () => {
    if (!selectedPhone.trim()) {
      setError("Please select a phone number");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Call the callback with the selected phone number
      // The parent component will handle the API call
      onPhoneUpdated(selectedPhone);
      onClose();
    } catch (error) {
      console.error('Error updating phone number:', error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && selectedPhone) {
      e.preventDefault();
      handlePhoneUpdate();
    }
  };

  if (!isOpen) return null;

  // Use phone update context if available, otherwise fallback to current phone
  const existingPhone = phoneUpdateContext?.existing_phone || currentPhone;
  const submittedPhone = phoneUpdateContext?.submitted_phone || currentPhone;
  
  // Mask the existing phone for privacy, but show full submitted phone
  const maskedExistingPhone = maskPhoneNumber(existingPhone);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with Icon */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Phone Number Conflict
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Which number should we use?
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="space-y-3">
            {/* Existing Phone Option */}
            <label className="block cursor-pointer group">
              <input
                type="radio"
                name="phoneSelection"
                value={existingPhone}
                checked={selectedPhone === existingPhone}
                onChange={(e) => setSelectedPhone(e.target.value)}
                className="sr-only"
              />
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedPhone === existingPhone 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedPhone === existingPhone 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'
                  }`}>
                    {selectedPhone === existingPhone && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Use existing number
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {maskedExistingPhone}
                    </p>
                  </div>
                </div>
              </div>
            </label>

            {/* Submitted Phone Option */}
            <label className="block cursor-pointer group">
              <input
                type="radio"
                name="phoneSelection"
                value={submittedPhone}
                checked={selectedPhone === submittedPhone}
                onChange={(e) => setSelectedPhone(e.target.value)}
                className="sr-only"
              />
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedPhone === submittedPhone 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedPhone === submittedPhone 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'
                  }`}>
                    {selectedPhone === submittedPhone && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Use new number
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {submittedPhone}
                    </p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isLoading}
            className="flex-1 h-10 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePhoneUpdate}
            disabled={isLoading || !selectedPhone.trim()}
            className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Updating...</span>
              </div>
            ) : (
              "Update Phone"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
