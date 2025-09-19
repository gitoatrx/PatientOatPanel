# Data Directory

This directory contains all mock data and data-related utilities for the application.

## Files

### `mockAssessmentData.ts`
Contains all mock data for the pre-visit assessment wizard:

- **Disease Questions**: Question sets for different medical conditions (back pain, headache, chest pain, diabetes, hypertension, depression)
- **Medical Conditions**: List of common medical conditions for the history step
- **Appointment Data**: Mock appointment information including doctor, clinic, and patient details
- **Helper Functions**: 
  - `detectConditionFromInput()`: Automatically detects medical condition from user input
  - `getFollowUpQuestions()`: Returns appropriate questions based on detected condition
  - `getConditionTitle()`: Returns the title for a specific condition

## Usage

```typescript
import { 
  mockAssessmentData, 
  detectConditionFromInput, 
  getFollowUpQuestions 
} from '@/data/mockAssessmentData';

// Use mock data
const appointment = mockAssessmentData.appointmentData;

// Detect condition from user input
const condition = detectConditionFromInput("I have back pain");

// Get follow-up questions
const questions = getFollowUpQuestions(condition);
```

## Benefits

- **Separation of Concerns**: UI logic is separated from data
- **Reusability**: Mock data can be used across different components
- **Maintainability**: Easy to update mock data without touching UI code
- **Type Safety**: Full TypeScript support with proper interfaces
- **Extensibility**: Easy to add new conditions and questions
