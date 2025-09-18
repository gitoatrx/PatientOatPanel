"use client";

import React, { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Question, QuestionOption } from "@/data/wizardQuestions";

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function QuestionRenderer({ question, value, onChange, disabled = false, showBackButton = false, onBack }: QuestionRendererProps) {
  const renderSingleChoice = () => (
    <div className="space-y-3">
      {question.options?.map((option) => (
        <button
          key={option.id}
          onClick={() => !disabled && onChange(option.value)}
          disabled={disabled}
          className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
            value === option.value
              ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm"
              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25 hover:shadow-sm"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-center gap-4">
            {option.emoji && <div className="text-2xl">{option.emoji}</div>}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${
                  value === option.value
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300 group-hover:border-blue-400"
                }`}>
                  {value === option.value && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
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
    </div>
  );

  const renderMultipleChoice = () => (
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
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            Array.isArray(value) && value.includes(option.value)
              ? "bg-blue-500 text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const renderTextarea = () => (
    <div className="space-y-2">
      <textarea
        value={value || ""}
        onChange={(e) => !disabled && onChange(e.target.value)}
        placeholder={question.placeholder}
        disabled={disabled}
        maxLength={question.maxLength}
        className={`w-full min-h-[80px] p-3 border border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:ring-blue-500 focus:outline-none bg-white ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      />
      {question.maxLength && (
        <div className="text-right text-xs text-gray-400">
          {(value || "").length}/{question.maxLength}
        </div>
      )}
    </div>
  );

  const renderText = () => (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => !disabled && onChange(e.target.value)}
      placeholder={question.placeholder}
      disabled={disabled}
      maxLength={question.maxLength}
      className={`w-full p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 focus:outline-none bg-white ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
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
