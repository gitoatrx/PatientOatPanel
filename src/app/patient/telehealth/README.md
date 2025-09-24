# Patient Telehealth Routes

This directory contains the patient-specific telehealth session routes.

## Route Structure

```
/patient/telehealth/[followupToken]/[appointmentId]
```

### Parameters

- **`followupToken`**: A secure token that validates the patient's access to the appointment
- **`appointmentId`**: The unique identifier for the specific appointment

### Example URLs

```
/patient/telehealth/abc123def456/appt_789
/patient/telehealth/xyz789uvw012/appt_456
```

## Magic Link Integration

The route is designed to work with magic links sent to patients via email/SMS:

1. **Magic Link Format**: `https://yourdomain.com/patient/telehealth/{followupToken}/{appointmentId}`
2. **Token Validation**: The `followupToken` should be validated against your backend
3. **Appointment Lookup**: Use the `appointmentId` to fetch appointment details

## Implementation Notes

- The `followupToken` is used for security and access control
- The `appointmentId` is used as the Vonage session ID for video calls
- Both parameters are available in the component props for backend integration
- The route is fully responsive and works on mobile devices

## Backend Integration

TODO: Implement the following in your backend:

1. **Token Validation**: Validate `followupToken` against your database
2. **Appointment Fetching**: Use `appointmentId` to get appointment details
3. **Provider Information**: Fetch doctor/provider details for the session
4. **Session Management**: Handle Vonage session creation and management

## Security Considerations

- `followupToken` should be time-limited and single-use
- Validate tokens server-side before allowing access
- Implement rate limiting for token validation attempts
- Log all access attempts for security monitoring



