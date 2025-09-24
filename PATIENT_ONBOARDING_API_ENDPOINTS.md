# Patient Onboarding API Endpoints Documentation

## Overview
This document provides comprehensive documentation for all API endpoints used in the patient onboarding process. The system uses a RESTful API with JSON payloads and follows a step-by-step onboarding flow.

## Base Configuration
- **Base URL**: `https://cloud.oatrx.ca/api/v1`
- **Clinic ID**: `4` (Static)
- **Content-Type**: `application/json`
- **Authentication**: None required for onboarding endpoints

## API Endpoints

### 1. Send OTP
**Endpoint**: `POST /clinic/onboarding/send-otp`

**Description**: Sends a one-time password (OTP) to the patient's phone number for verification.

**Request Payload**:
```json
{
  "clinic_id": 4,
  "phone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "message": "Verification code sent",
    "otpCode": "123456"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "OTP_SEND_FAILED",
    "message": "Failed to send OTP",
    "type": "network"
  },
  "message": "Failed to send verification code. Please try again."
}
```

---

### 2. Verify OTP
**Endpoint**: `POST /clinic/onboarding/verify-otp`

**Description**: Verifies the OTP code entered by the patient.

**Request Payload**:
```json
{
  "clinic_id": 4,
  "phone": "+1234567890",
  "code": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "clinic_id": 4,
    "phone": "+1234567890",
    "current_step": "health_card",
    "status": "verified",
    "otp_verified_at": "2024-01-15T10:30:00Z",
    "state": {
      "contact": {
        "phone": "+1234567890"
      },
      "otp_verified_at": "2024-01-15T10:30:00Z"
    },
    "guest_patient_id": "guest_123",
    "appointment_id": null
  }
}
```

---

### 3. Get Onboarding Progress
**Endpoint**: `GET /clinic/onboarding/progress?clinic_id=4&phone=+1234567890`

**Description**: Retrieves the current onboarding progress for a patient.

**Query Parameters**:
- `clinic_id`: Clinic ID (4)
- `phone`: Patient's phone number (URL encoded)

**Response**:
```json
{
  "success": true,
  "message": "Progress retrieved successfully",
  "data": {
    "clinic_id": 4,
    "phone": "+1234567890",
    "current_step": "personal_info_step1",
    "status": "in_progress",
    "otp_verified_at": "2024-01-15T10:30:00Z",
    "state": {
      "contact": {
        "phone": "+1234567890"
      },
      "otp_verified_at": "2024-01-15T10:30:00Z",
      "health_card": {
        "health_card_number": "123456789"
      }
    },
    "guest_patient_id": "guest_123",
    "appointment_id": null
  }
}
```

---

### 4. Save Health Card
**Endpoint**: `POST /clinic/onboarding/health-card`

**Description**: Saves the patient's health card information.

**Request Payload**:
```json
{
  "clinic_id": 4,
  "phone": "+1234567890",
  "health_card_number": "123456789"
}
```

**Note**: `health_card_number` is optional. If not provided or empty, the field is omitted from the payload.

**Response**:
```json
{
  "success": true,
  "message": "Health card saved successfully",
  "data": {
    "clinic_id": 4,
    "phone": "+1234567890",
    "current_step": "personal_info_step1",
    "status": "in_progress",
    "otp_verified_at": "2024-01-15T10:30:00Z",
    "state": {
      "contact": {
        "phone": "+1234567890"
      },
      "otp_verified_at": "2024-01-15T10:30:00Z",
      "health_card": {
        "health_card_number": "123456789"
      }
    },
    "guest_patient_id": "guest_123",
    "appointment_id": null
  }
}
```

---

### 5. Save Personal Info Step 1 (Name)
**Endpoint**: `POST /clinic/onboarding/personal-info/step1`

**Description**: Saves the patient's first and last name.

**Request Payload**:
```json
{
  "clinic_id": 4,
  "phone": "+1234567890",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Personal information saved successfully",
  "data": {
    "clinic_id": 4,
    "phone": "+1234567890",
    "current_step": "personal_info_step2",
    "status": "in_progress",
    "otp_verified_at": "2024-01-15T10:30:00Z",
    "state": {
      "contact": {
        "phone": "+1234567890"
      },
      "otp_verified_at": "2024-01-15T10:30:00Z",
      "personal_info": {
        "first_name": "John",
        "last_name": "Doe"
      }
    },
    "guest_patient_id": "guest_123",
    "appointment_id": null
  }
}
```

---

### 6. Save Personal Info Step 2 (Gender)
**Endpoint**: `POST /clinic/onboarding/personal-info/step2`

**Description**: Saves the patient's gender information.

**Request Payload**:
```json
{
  "clinic_id": 4,
  "phone": "+1234567890",
  "gender": "male"
}
```

**Gender Options**: `male`, `female`, `other`, `prefer_not_to_say`

---

### 7. Save Personal Info Step 3 (Date of Birth)
**Endpoint**: `POST /clinic/onboarding/personal-info/step3`

**Description**: Saves the patient's date of birth.

**Request Payload**:
```json
{
  "clinic_id": 4,
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15"
}
```

**Date Format**: `YYYY-MM-DD`

---

### 8. Save Personal Info Step 4 (Email)
**Endpoint**: `POST /clinic/onboarding/personal-info/step4`

**Description**: Saves the patient's email address.

**Request Payload**:
```json
{
  "clinic_id": 4,
  "phone": "+1234567890",
  "email": "john.doe@example.com"
}
```

---

### 9. Save Address
**Endpoint**: `POST /clinic/onboarding/address`

**Description**: Saves the patient's address information.

**Request Payload**:
```json
{
  "clinic_id": 4,
  "phone": "+1234567890",
  "address_line1": "123 Main Street",
  "address_line2": "Apt 4B",
  "city": "Toronto",
  "state_province": "ON",
  "postal_code": "M5V 3A8",
  "country": "Canada"
}
```

**Note**: `address_line2` is optional.

---

### 10. Get Visit Types List
**Endpoint**: `GET /clinic/onboarding/visit-types?clinic_id=4`

**Description**: Retrieves available visit types for the clinic.

**Response**:
```json
{
  "success": true,
  "message": "Visit types retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "General Consultation",
      "description": "General medical consultation",
      "duration": 30,
      "price": 150.00
    },
    {
      "id": 2,
      "name": "Follow-up Visit",
      "description": "Follow-up appointment",
      "duration": 15,
      "price": 75.00
    }
  ]
}
```

---

### 11. Save Visit Type
**Endpoint**: `POST /clinic/onboarding/visit-type`

**Description**: Saves the patient's selected visit type.

**Request Payload**:
```json
{
  "clinic_id": 4,
  "phone": "+1234567890",
  "visit_type_id": 1
}
```

---

### 12. Get Health Concerns List
**Endpoint**: `GET /clinic/onboarding/health-concerns/list?clinic_id=4`

**Description**: Retrieves available health concerns for selection.

**Response**:
```json
{
  "success": true,
  "message": "Health concerns retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Diabetes Management",
      "description": "Blood sugar monitoring and management"
    },
    {
      "id": 2,
      "name": "Hypertension",
      "description": "High blood pressure management"
    }
  ]
}
```

---

### 13. Save Health Concern
**Endpoint**: `POST /clinic/onboarding/health-concerns`

**Description**: Saves the patient's health concerns and symptoms.

**Request Payload**:
```json
{
  "phone": "+1234567890",
  "clinic_id": 4,
  "selected_concern_ids": [1, 2],
  "other_concerns": ["I have been experiencing headaches for the past week"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Health concerns saved successfully",
  "data": {
    "current_step": "visit_type"
  }
}
```

---

### 14. Save Emergency Contact
**Endpoint**: `POST /clinic/onboarding/emergency-contact`

**Description**: Saves the patient's emergency contact information.

**Request Payload**:
```json
{
  "clinic_id": 4,
  "phone": "+1234567890",
  "name": "Jane Doe",
  "relationship": "spouse",
  "emergency_phone": "+1987654321"
}
```

**Relationship Options**: `spouse`, `parent`, `child`, `sibling`, `friend`, `other`, `none`

---

### 15. Get Providers List
**Endpoint**: `GET /clinic/onboarding/providers?clinic_id=4&search=doctor&visit_name=General Consultation`

**Description**: Retrieves available healthcare providers.

**Query Parameters**:
- `clinic_id`: Clinic ID (4)
- `search`: Optional search term for provider name
- `visit_name`: Optional visit type name for filtering

**Response**:
```json
{
  "success": true,
  "message": "Providers retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Dr. John Smith",
      "specialty": "Endocrinology",
      "title": "MD",
      "available": true,
      "next_available": "2024-01-16T09:00:00Z"
    }
  ]
}
```

---

### 16. Save Provider Selection
**Endpoint**: `POST /clinic/onboarding/provider`

**Description**: Saves the patient's selected healthcare provider.

**Request Payload**:
```json
{
  "phone": "+1234567890",
  "clinic_id": 4,
  "provider_id": 1,
  "preferred_provider_notes": "I prefer morning appointments"
}
```

**Note**: `preferred_provider_notes` is optional.

---

### 17. Get Available Slots (Provider)
**Endpoint**: `GET /clinic/onboarding/available-slots-provider?clinic_id=4&provider_id=1`

**Description**: Retrieves available appointment slots for a specific provider.

**Response**:
```json
{
  "success": true,
  "message": "Available slots retrieved successfully",
  "data": [
    {
      "date": "2024-01-16",
      "available": true,
      "slots_count": 5
    },
    {
      "date": "2024-01-17",
      "available": true,
      "slots_count": 3
    }
  ]
}
```

---

### 18. Get Available Time Slots
**Endpoint**: `GET /clinic/onboarding/available-slots?clinic_id=4&provider_id=1&date=2024-01-16`

**Description**: Retrieves specific time slots for a provider on a given date.

**Response**:
```json
{
  "success": true,
  "message": "Available time slots retrieved successfully",
  "data": [
    {
      "time": "09:00",
      "available": true,
      "duration": 30
    },
    {
      "time": "09:30",
      "available": true,
      "duration": 30
    },
    {
      "time": "10:00",
      "available": false,
      "duration": 30
    }
  ]
}
```

---

### 19. Save Appointment
**Endpoint**: `POST /clinic/onboarding/appointment`

**Description**: Saves the patient's selected appointment date and time.

**Request Payload**:
```json
{
  "phone": "+1234567890",
  "clinic_id": 4,
  "date": "2024-01-16",
  "time": "09:00"
}
```

**Date Format**: `YYYY-MM-DD`
**Time Format**: `HH:MM` (24-hour format)

---

### 20. Confirm Appointment
**Endpoint**: `POST /clinic/onboarding/confirm`

**Description**: Confirms the patient's appointment and generates confirmation details.

**Request Payload**:
```json
{
  "phone": "+1234567890",
  "clinic_id": 4
}
```

**Response**:
```json
{
  "success": true,
  "message": "Appointment confirmed successfully",
  "data": {
    "appointment_id": 14443,
    "confirmation_number": "APT-2024-001"
  }
}
```

---

## Follow-up Endpoints

### 21. Get Follow-ups Token
**Endpoint**: `POST /clinic/get-followups-token`

**Description**: Generates a token for accessing follow-up questions.

**Request Payload**:
```json
{
  "clinic_id": 4,
  "appointment_id": 14443
}
```

**Response**:
```json
{
  "success": true,
  "message": "Token generated successfully",
  "data": {
    "token": "1b5376c1-8df1-4d6f-8077-2cbf8f47d425"
  }
}
```

---

### 22. Get Follow-up Questions
**Endpoint**: `GET /clinic/followups/4/14443/1b5376c1-8df1-4d6f-8077-2cbf8f47d425/questions`

**Description**: Retrieves follow-up questions for a specific appointment.

**Response**:
```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": {
    "questions": [
      {
        "id": "q1",
        "question": "How are you feeling today?",
        "type": "text",
        "required": true
      },
      {
        "id": "q2",
        "question": "Any new symptoms?",
        "type": "textarea",
        "required": false
      }
    ]
  }
}
```

---

### 23. Save Follow-up Answers
**Endpoint**: `POST /clinic/followups/4/14443/1b5376c1-8df1-4d6f-8077-2cbf8f47d425/answers`

**Description**: Saves the patient's answers to follow-up questions.

**Request Payload**:
```json
{
  "answers": [
    {
      "id": "q1",
      "value": "I'm feeling much better today"
    },
    {
      "id": "q2",
      "value": "No new symptoms to report"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Answers saved successfully",
  "data": {
    "saved": true,
    "answers": {
      "q1": {
        "value": "I'm feeling much better today",
        "updated_at": "2024-01-15T14:30:00Z"
      },
      "q2": {
        "value": "No new symptoms to report",
        "updated_at": "2024-01-15T14:30:00Z"
      }
    }
  }
}
```

---

## Telehealth Endpoints

### 24. Get Telehealth Patient Session
**Endpoint**: `GET /clinic/appointments/14443/video/session/patient?token=1b5376c1-8df1-4d6f-8077-2cbf8f47d425`

**Description**: Retrieves telehealth session details for video consultation.

**Response**:
```json
{
  "success": true,
  "message": "Session details retrieved successfully",
  "data": {
    "appointment_id": 14443,
    "vonage_session_id": "1_MX40NzIwMzJ-fjE3NTg2OTM0Mjl9",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
    "application_id": "b1bd2316-1785-4818-8f90-0f6692ef85cf"
  }
}
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message",
    "type": "validation|network|server"
  }
}
```

### Common Error Codes
- `OTP_SEND_FAILED`: Failed to send OTP
- `OTP_VERIFICATION_FAILED`: Invalid OTP code
- `VALIDATION_ERROR`: Input validation failed
- `NETWORK_ERROR`: Network connection issue
- `SERVER_ERROR`: Internal server error
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

## Request Configuration

### Timeout Settings
- **Request Timeout**: 180 seconds (3 minutes)
- **Retries**: Disabled (0)
- **Retry Delay**: 500ms

### Headers
```
Content-Type: application/json
Accept: application/json
```

---

## Step Flow Mapping

The API returns a `current_step` field that maps to frontend routes:

| API Step | Frontend Route |
|----------|----------------|
| `verify_otp` | `/onboarding/patient/verify-otp` |
| `health_card` | `/onboarding/patient/health-card` |
| `personal_info_step1` | `/onboarding/patient/personal` |
| `personal_info_step2` | `/onboarding/patient/gender` |
| `personal_info_step3` | `/onboarding/patient/date-of-birth` |
| `personal_info_step4` | `/onboarding/patient/email` |
| `address` | `/onboarding/patient/address` |
| `health_concerns` | `/onboarding/patient/health-concern` |
| `visit_type` | `/onboarding/patient/visit-type` |
| `emergency_contact` | `/onboarding/patient/emergency-contact` |
| `provider` | `/onboarding/patient/doctor-selection` |
| `appointment` | `/onboarding/patient/appointment-datetime` |
| `completed` | `/onboarding/patient/confirmation` |

---

## Notes

1. **Phone Number Format**: All phone numbers should include country code (e.g., `+1234567890`)
2. **Date Formats**: Use ISO 8601 format (`YYYY-MM-DD`) for dates
3. **Time Formats**: Use 24-hour format (`HH:MM`) for times
4. **Clinic ID**: Always use `4` as the clinic ID
5. **Error Handling**: All endpoints return structured error responses
6. **Progress Tracking**: Use the progress endpoint to resume onboarding from any step
7. **Token Security**: Follow-up tokens are single-use and time-limited
8. **Rate Limiting**: Be mindful of API rate limits for production use

---

## Testing

For testing purposes, you can use the following test data:
- **Phone**: `+1234567890`
- **OTP Code**: `123456` (for development)
- **Clinic ID**: `4`
- **Test Appointment ID**: `14443`

---

*Last Updated: January 2024*
*Version: 1.0*
