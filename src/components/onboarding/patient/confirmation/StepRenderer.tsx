"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionRenderer } from "./QuestionRenderer";
import { WizardStep, Question } from "@/data/wizardQuestions";

interface StepRendererProps {
  step: WizardStep;
  onNext: () => void;
  onPrev: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown>;
  showBackButton?: boolean;
  isLastStep?: boolean;
  onSubmit?: () => void;
  isStepValid?: () => boolean;
}

export function StepRenderer({ 
  step, 
  onNext, 
  onPrev, 
  onUpdate, 
  initialData = {}, 
  showBackButton = true,
  isLastStep = false,
  onSubmit,
  isStepValid
}: StepRendererProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    onUpdate(answers);
  }, [answers]); // Remove onUpdate from dependencies to prevent infinite loop

  // Reset loading state when step changes
  useEffect(() => {
    setIsLoading(false);
  }, [step.id]);

  const handleAnswerChange = (questionId: string, value: unknown) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateStep = () => {
    return step.questions.every(question => {
      if (!question.required) return true;
      const answer = answers[question.id];
      
      if (question.type === 'multiple_choice') {
        return Array.isArray(answer) && answer.length > 0;
      }
      
      if (question.type === 'textarea' || question.type === 'text') {
        return answer && typeof answer === 'string' && answer.trim().length > 0;
      }
      
      return answer !== undefined && answer !== null && answer !== '';
    });
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    setIsLoading(true);
    setTimeout(() => {
      onNext();
    }, 800);
  };

  const handleSubmit = () => {
    if (!validateStep() || !onSubmit) return;
    
    setIsLoading(true);
    setTimeout(() => {
      onSubmit();
    }, 800);
  };

  const renderQuestions = () => {
    if (step.questions.length === 0) {
      return null;
    }

    return step.questions.map((question, index) => (
      <div key={question.id} className="space-y-2 ">
        <QuestionRenderer
          question={question}
          value={answers[question.id]}
          onChange={(value) => handleAnswerChange(question.id, value)}
          disabled={isLoading}
          showBackButton={showBackButton && index === 0}
          onBack={onPrev}
        />
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Questions */}
      {renderQuestions()}
    </div>
  );
}
