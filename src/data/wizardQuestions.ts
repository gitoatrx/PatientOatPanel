// Wizard Question Data Structure and Mock Data

export interface QuestionOption {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
  value: string;
}

export interface Question {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'text' | 'textarea';
  title: string;
  subtitle?: string;
  required: boolean;
  options?: QuestionOption[];
  placeholder?: string;
  maxLength?: number;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface WizardStep {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  questions: Question[];
}

export interface WizardData {
  steps: WizardStep[];
  totalSteps: number;
}

// Mock Data for Health Check-in Wizard
export const healthCheckInWizard: WizardData = {
  totalSteps: 7,
  steps: [
    {
      id: "intro",
      title: "Welcome!",
      subtitle: "Let's help Dr. Johnson prepare for your visit",
      icon: "Sparkles",
      questions: []
    },
    {
      id: "symptoms",
      title: "How are you feeling?",
      subtitle: "Your current health status",
      icon: "Activity",
      questions: [
        {
          id: "feeling_description",
          type: "textarea",
          title: "How are you feeling today?",
          subtitle: "Please describe your current health status and any symptoms you're experiencing",
          placeholder: "e.g., I'm feeling generally good, but I've been having some mild headaches in the morning...",
          required: true,
          maxLength: 500,
          validation: {
            minLength: 10,
            maxLength: 500
          }
        }
      ]
    },
    {
      id: "sleep",
      title: "Sleep Quality",
      subtitle: "How has your sleep been?",
      icon: "Activity",
      questions: [
        {
          id: "sleep_quality",
          type: "single_choice",
          title: "How has your sleep been lately?",
          subtitle: "Good sleep is important for recovery",
          required: true,
          options: [
            {
              id: "sleep_excellent",
              label: "Excellent",
              description: "Sleeping well, feeling rested",
              value: "excellent"
            },
            {
              id: "sleep_good",
              label: "Good",
              description: "Mostly sleeping well",
              value: "good"
            },
            {
              id: "sleep_fair",
              label: "Fair",
              description: "Some sleep issues",
              value: "fair"
            },
            {
              id: "sleep_poor",
              label: "Poor",
              description: "Trouble sleeping",
              value: "poor"
            }
          ]
        }
      ]
    },
    {
      id: "appetite",
      title: "Appetite Changes",
      subtitle: "Any changes in your eating?",
      icon: "Activity",
      questions: [
        {
          id: "appetite_changes",
          type: "single_choice",
          title: "Any changes in your appetite?",
          subtitle: "This can be related to your condition or medication",
          required: true,
          options: [
            {
              id: "appetite_normal",
              label: "Normal appetite",
              description: "Eating as usual",
              value: "normal"
            },
            {
              id: "appetite_increased",
              label: "Increased appetite",
              description: "Eating more than usual",
              value: "increased"
            },
            {
              id: "appetite_decreased",
              label: "Decreased appetite",
              description: "Eating less than usual",
              value: "decreased"
            },
            {
              id: "appetite_nausea",
              label: "Nausea/loss of appetite",
              description: "Feeling sick, can't eat much",
              value: "nausea"
            }
          ]
        }
      ]
    },
    {
      id: "energy",
      title: "Energy Level",
      subtitle: "How is your energy?",
      icon: "Activity",
      questions: [
        {
          id: "energy_level",
          type: "single_choice",
          title: "How is your energy level?",
          subtitle: "Compared to your usual self",
          required: true,
          options: [
            {
              id: "energy_high",
              label: "High energy",
              description: "Feeling energetic and active",
              value: "high"
            },
            {
              id: "energy_normal",
              label: "Normal energy",
              description: "Feeling like my usual self",
              value: "normal"
            },
            {
              id: "energy_low",
              label: "Low energy",
              description: "Feeling tired and sluggish",
              value: "low"
            },
            {
              id: "energy_very_low",
              label: "Very low energy",
              description: "Constantly exhausted",
              value: "very_low"
            }
          ]
        }
      ]
    },
    {
      id: "mood",
      title: "Mood & Well-being",
      subtitle: "How has your mood been?",
      icon: "Activity",
      questions: [
        {
          id: "mood_changes",
          type: "single_choice",
          title: "How has your mood been?",
          subtitle: "Your emotional well-being matters",
          required: true,
          options: [
            {
              id: "mood_positive",
              label: "Positive and upbeat",
              description: "Feeling good and optimistic",
              value: "positive"
            },
            {
              id: "mood_stable",
              label: "Stable and normal",
              description: "Feeling like my usual self",
              value: "stable"
            },
            {
              id: "mood_concerned",
              label: "Somewhat concerned",
              description: "Worried about my health",
              value: "concerned"
            },
            {
              id: "mood_depressed",
              label: "Feeling down",
              description: "Feeling sad or depressed",
              value: "depressed"
            }
          ]
        }
      ]
    },
    {
      id: "medication",
      title: "Medication Adherence",
      subtitle: "How well are you taking your medication?",
      icon: "Activity",
      questions: [
        {
          id: "medication_adherence",
          type: "single_choice",
          title: "How well have you been taking your medication?",
          subtitle: "Following your prescribed treatment plan",
          required: true,
          options: [
            {
              id: "medication_perfect",
              label: "Perfect adherence",
              description: "Taking all medications as prescribed",
              value: "perfect"
            },
            {
              id: "medication_good",
              label: "Mostly good",
              description: "Missing very few doses",
              value: "good"
            },
            {
              id: "medication_sometimes",
              label: "Sometimes forget",
              description: "Missing some doses occasionally",
              value: "sometimes"
            },
            {
              id: "medication_poor",
              label: "Often forget",
              description: "Missing many doses",
              value: "poor"
            }
          ]
        }
      ]
    },
    {
      id: "notes",
      title: "Additional Notes",
      subtitle: "Any other information?",
      icon: "Activity",
      questions: [
        {
          id: "additional_notes",
          type: "textarea",
          title: "Any additional notes? (Optional)",
          placeholder: "e.g., Pain is worse in the morning, medication side effects...",
          required: false,
          maxLength: 300
        }
      ]
    }
  ]
};

// Question Type Definitions
export const QUESTION_TYPES = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  TEXT: 'text',
  TEXTAREA: 'textarea'
} as const;

// Icon Mapping
export const ICON_MAPPING = {
  Sparkles: '✨',
  Heart: '❤️',
  Activity: '📊',
  Shield: '🛡️',
  CheckCircle: '✅'
} as const;
