export type PatientRole = "patient";

export interface RegisterPatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  hasHealthCard: "yes" | "no";
  healthCardNumber?: string;
  selectedReason: string;
  symptoms: string;
  emergencyContactRelationship?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  visitType: string;
  appointmentDate: string;
  appointmentTime: string;
}

export interface RegisterPatientResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export const patientService = {
  async registerPatient(data: RegisterPatientRequest): Promise<RegisterPatientResponse> {
    // Simulate API call for UI-only mode
    console.log("PatientService: Simulating patient registration with data:", data);
    
    // Simulate successful registration
    return {
      success: true,
      message: "Patient registered successfully (UI-only mode)",
      data: data,
    };
  },

  async getProfile() {
    // Simulate API call for UI-only mode
    console.log("PatientService: Simulating get profile");
    
    return {
      success: true,
      data: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      },
    };
  },

  async updateProfile(data: unknown) {
    // Simulate API call for UI-only mode
    console.log("PatientService: Simulating profile update with data:", data);
    
    return {
      success: true,
      message: "Profile updated successfully (UI-only mode)",
      data: data,
    };
  },
};
