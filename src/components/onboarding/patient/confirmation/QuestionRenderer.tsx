"use client";

import React, { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Question, QuestionOption } from "@/data/wizardQuestions";

interface QuestionRendererProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function QuestionRenderer({ question, value, onChange, disabled = false, showBackButton = false, onBack }: QuestionRendererProps) {
  const renderSingleChoice = () => {
    const isOtherSelected = value && typeof value === 'string' && value.includes('Others, please specify');
    const otherValue = isOtherSelected ? (value as string).replace(/^Others, please specify:?\s*/, '') : '';

    return (
      <div className="space-y-3">
        {question.options?.map((option) => (
          <button
            key={option.id}
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left group ${value === option.value || (isOtherSelected && option.value.includes('Others, please specify'))
              ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm"
              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25 hover:shadow-sm"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-4">
              {option.emoji && <div className="text-2xl">{option.emoji}</div>}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${value === option.value || (isOtherSelected && option.value.includes('Others, please specify'))
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300 group-hover:border-blue-400"
                    }`}>
                    {(value === option.value || (isOtherSelected && option.value.includes('Others, please specify'))) ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : null}
                  </div>
                  <div>
                    <span className="font-medium text-base">{option.label}</span>
                    {option.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* Show text area when "Others, please specify" is selected */}
        {isOtherSelected ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mt-3"
          >
            <div className="p-4 bg-blue-50 rounded-xl">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Please specify:
              </label>
              <textarea
                value={otherValue}
                onChange={(e) => {
                  const newValue = `Others, please specify: ${e.target.value}`;
                  onChange(newValue);
                }}
                disabled={disabled}
                className={`w-full min-h-[80px] p-3 border-0 rounded-lg resize-none focus:outline-none bg-white ${disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              />
            </div>
          </motion.div>
        ) : null}
      </div>
    );
  };

  const renderMultipleChoice = () => {
    const currentValues = Array.isArray(value) ? value : [];
    const hasOtherSelected = currentValues.some(v => typeof v === 'string' && v.includes('Others, please specify'));
    const otherValue = hasOtherSelected ?
      currentValues.find(v => typeof v === 'string' && v.includes('Others, please specify'))?.replace(/^Others, please specify:?\s*/, '') || ''
      : '';

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {question.options?.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                if (disabled) return;
                const currentValues = Array.isArray(value) ? value : [];
                const newValues = currentValues.includes(option.value)
                  ? currentValues.filter((v: string) => v !== option.value)
                  : [...currentValues, option.value];
                onChange(newValues);
              }}
              disabled={disabled}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${Array.isArray(value) && (value.includes(option.value) || (hasOtherSelected && option.value.includes('Others, please specify')))
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Show text area when "Others, please specify" is selected */}
        {hasOtherSelected ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mt-3"
          >
            <div className="p-4 bg-blue-50 rounded-xl">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Please specify:
              </label>
              <textarea
                value={otherValue}
                onChange={(e) => {
                  const currentValues = Array.isArray(value) ? value : [];
                  const filteredValues = currentValues.filter(v => !(typeof v === 'string' && v.includes('Others, please specify')));
                  const newValue = `Others, please specify: ${e.target.value}`;
                  onChange([...filteredValues, newValue]);
                }}
                disabled={disabled}
                className={`w-full min-h-[80px] p-3 border-0 rounded-lg resize-none focus:outline-none bg-white ${disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              />
            </div>
          </motion.div>
        ) : null}
      </div>
    );
  };

  const renderTextarea = () => (
    <div className="space-y-2">
      <textarea
        value={typeof value === 'string' ? value : ""}
        onChange={(e) => !disabled && onChange(e.target.value)}
        placeholder={question.placeholder}
        disabled={disabled}
        maxLength={question.maxLength}
        className={`w-full min-h-[80px] p-3 border border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:ring-blue-500 focus:outline-none bg-white ${disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
      />
      {question.maxLength && (
        <div className="text-right text-xs text-gray-400">
          {(typeof value === 'string' ? value : "").length}/{question.maxLength}
        </div>
      )}
    </div>
  );

  const renderText = () => (
    <input
      type="text"
      value={typeof value === 'string' ? value : ""}
      onChange={(e) => !disabled && onChange(e.target.value)}
      placeholder={question.placeholder}
      disabled={disabled}
      maxLength={question.maxLength}
      className={`w-full p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 focus:outline-none bg-white ${disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
    />
  );

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'single_choice':
        return renderSingleChoice();
      case 'multiple_choice':
        return renderMultipleChoice();
      case 'textarea':
        return renderTextarea();
      case 'text':
        return renderText();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Question Title */}
      <h4 className="text-xl font-semibold text-foreground">
        {question.title}
      </h4>

      {renderQuestionContent()}

      {question.required && (
        <p className="text-xs text-gray-500">
          * This field is required
        </p>
      )}
    </div>
  );
}
