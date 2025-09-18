// Mock data for pre-visit assessment wizard

export interface DiseaseQuestionSet {
  title: string;
  questions: string[];
}

export interface AssessmentMockData {
  diseaseQuestions: Record<string, DiseaseQuestionSet>;
  medicalConditions: string[];
  appointmentData: {
    id: string;
    status: string;
    patientName: string;
    date: string;
    time: string;
    endTime: string;
    durationMin: number;
    timezone: string;
    visitType: string;
    doctor: {
      name: string;
      specialty: string;
      years: number;
    };
    clinic: {
      name: string;
      room: string;
      address: string;
    };
    contact: {
      phone: string;
      email: string;
      website: string;
    };
    policy: {
      cancelWindow: string;
      latePolicy: string;
    };
    payment: {
      insurance: string;
      copayEstimate: string;
    };
    prep: string[];
    documents: string[];
  };
}

export const mockAssessmentData: AssessmentMockData = {
  diseaseQuestions: {
    back_pain: {
      title: "Back Pain Assessment",
      questions: [
        "Is the pain constant or does it come and go?",
        "Does the pain radiate down your leg(s)?",
        "Is the pain associated with numbness or weakness?",
        "Have you had any recent trauma or injury?",
        "Is the pain worse when lying down?",
        "Do you have a fever or chills?"
      ]
    },
    headache: {
      title: "Headache Assessment", 
      questions: [
        "How would you describe the pain (throbbing, sharp, dull)?",
        "Is the pain on one side or both sides?",
        "Do you experience nausea or vomiting?",
        "Are you sensitive to light or sound?",
        "How long do the headaches typically last?",
        "Have you noticed any triggers?"
      ]
    },
    chest_pain: {
      title: "Chest Pain Assessment",
      questions: [
        "Is the pain sharp, dull, or crushing?",
        "Does the pain worsen with breathing?",
        "Do you experience shortness of breath?",
        "Is the pain associated with exertion?",
        "Do you have any heart conditions?",
        "Are you experiencing any dizziness?"
      ]
    },
    diabetes: {
      title: "Diabetes Management Assessment",
      questions: [
        "How have your blood sugar levels been?",
        "Are you experiencing any new symptoms?",
        "Have you had any episodes of low blood sugar?",
        "How is your medication adherence?",
        "Have you made any dietary changes?",
        "Are you monitoring your blood pressure?"
      ]
    },
    hypertension: {
      title: "Blood Pressure Assessment",
      questions: [
        "What have your recent blood pressure readings been?",
        "Are you experiencing any dizziness or headaches?",
        "How is your medication working?",
        "Have you made any lifestyle changes?",
        "Are you monitoring your salt intake?",
        "How is your stress level?"
      ]
    },
    depression: {
      title: "Mental Health Assessment",
      questions: [
        "How has your mood been lately?",
        "Are you sleeping well?",
        "How is your appetite?",
        "Are you taking your medication as prescribed?",
        "Have you been engaging in activities you enjoy?",
        "Are you experiencing any side effects from medication?"
      ]
    }
  },

  medicalConditions: [
    "Diabetes",
    "High blood pressure",
    "Heart disease",
    "Asthma",
    "Arthritis",
    "Depression/Anxiety",
    "Thyroid conditions",
    "Chronic pain",
    "Migraine",
    "Allergies",
    "Sleep disorders",
    "None of the above"
  ],

  appointmentData: {
    id: "BK-7D3Q29",
    status: "Confirmed",
    patientName: "Alex Chen",
    date: "Sep 15, 2025",
    time: "2:30 PM",
    endTime: "3:15 PM",
    durationMin: 45,
    timezone: "PST (-8:00)",
    visitType: "In‑person",
    doctor: { 
      name: "Dr. Sarah Johnson", 
      specialty: "General Practitioner", 
      years: 5 
    },
    clinic: { 
      name: "Downtown Medical Center", 
      room: "Room 205, Floor 2", 
      address: "123 Main St, Vancouver" 
    },
    contact: { 
      phone: "+1 (604) 555‑0123", 
      email: "frontdesk@downtownmed.example", 
      website: "downtownmed.example" 
    },
    policy: { 
      cancelWindow: "24h before", 
      latePolicy: "10‑minute grace period" 
    },
    payment: { 
      insurance: "BlueShield PPO", 
      copayEstimate: "$25" 
    },
    prep: [
      "Bring a photo ID and insurance card", 
      "Arrive 10 minutes early for check‑in"
    ],
    documents: [
      "Prior lab results (last 6 months)", 
      "Medication list"
    ]
  }
};

// Helper function to detect condition from user input
export const detectConditionFromInput = (input: string): string | null => {
  const lowerInput = input.toLowerCase();
  
  const conditionKeywords = {
    back_pain: ['back', 'spine', 'lumbar', 'lower back', 'upper back'],
    headache: ['head', 'migraine', 'headache', 'head pain'],
    chest_pain: ['chest', 'heart', 'cardiac', 'chest pain'],
    diabetes: ['diabetes', 'diabetic', 'blood sugar', 'glucose'],
    hypertension: ['blood pressure', 'hypertension', 'high bp', 'bp'],
    depression: ['depression', 'anxiety', 'mental health', 'mood', 'sad']
  };

  for (const [condition, keywords] of Object.entries(conditionKeywords)) {
    if (keywords.some(keyword => lowerInput.includes(keyword))) {
      return condition;
    }
  }
  
  return null;
};

// Helper function to get follow-up specific questions
export const getFollowUpQuestions = (condition: string | null): string[] => {
  if (!condition || !mockAssessmentData.diseaseQuestions[condition]) {
    return [
      "How have you been feeling since your last visit?",
      "Are you experiencing any new symptoms?",
      "How is your current treatment working?",
      "Have you had any concerns or questions?"
    ];
  }
  
  return mockAssessmentData.diseaseQuestions[condition].questions;
};

// Helper function to get condition title
export const getConditionTitle = (condition: string | null): string => {
  if (!condition || !mockAssessmentData.diseaseQuestions[condition]) {
    return "Follow-up Assessment";
  }
  
  return mockAssessmentData.diseaseQuestions[condition].title;
};
