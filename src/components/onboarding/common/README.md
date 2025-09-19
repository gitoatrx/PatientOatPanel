# Generic StepShell Component

A unified StepShell component that handles onboarding flows for different user types (doctors, clinics, and patients).

## Features

- **Multi-user type support**: Handles doctor, clinic, and patient onboarding flows
- **Automatic token management**: Manages different token types based on user type
- **Customizable logout behavior**: Supports custom logout handlers or uses default behavior
- **Progress tracking**: Built-in progress bar with percentage display
- **Responsive design**: Works across all device sizes
- **Dark mode support**: Fully compatible with light and dark themes
- **Smooth animations**: GSAP-powered animations for better UX

## Usage

### Basic Usage

```tsx
import { StepShell } from "@/components/onboarding/common/StepShell";

export default function MyOnboardingPage() {
  return (
    <StepShell
      title="Step Title"
      description="Step description"
      userType="doctor" // or "clinic" or "patient"
      onNext={handleNext}
      onBack={handleBack}
      progressPercent={50}
    >
      {/* Your step content */}
    </StepShell>
  );
}
```

### Props

| Prop                   | Type                                | Default      | Description                    |
| ---------------------- | ----------------------------------- | ------------ | ------------------------------ |
| `title`                | `string`                            | -            | The step title                 |
| `description`          | `string`                            | -            | Optional step description      |
| `children`             | `ReactNode`                         | -            | The step content               |
| `onBack`               | `() => void`                        | -            | Back button handler            |
| `onNext`               | `() => void`                        | -            | Next button handler            |
| `nextLabel`            | `string`                            | `"Next"`     | Next button text               |
| `backLabel`            | `string`                            | `"Back"`     | Back button text               |
| `isNextDisabled`       | `boolean`                           | `false`      | Disable next button            |
| `isSubmitting`         | `boolean`                           | `false`      | Show loading state             |
| `footerExtra`          | `ReactNode`                         | -            | Additional footer content      |
| `skipButton`           | `object`                            | -            | Skip button configuration      |
| `progressPercent`      | `number`                            | -            | Progress percentage (0-100)    |
| `useCard`              | `boolean`                           | `true`       | Wrap content in card           |
| `contentMaxWidthClass` | `string`                            | `"max-w-xl"` | Content max width class        |
| `userType`             | `'doctor' \| 'clinic' \| 'patient'` | `'doctor'`   | User type for token management |
| `onLogout`             | `() => void`                        | -            | Custom logout handler          |
| `showLogout`           | `boolean`                           | `true`       | Show logout button             |

### User Types

#### Doctor

- Checks for `bimble_doctor_onboarding_access_token` and `bimble_doctor_access_token`
- Default logout redirects to `/login/doctor`
- Clears doctor-specific tokens

#### Clinic

- Checks for `bimble_clinic_onboarding_access_token` and `bimble_clinic_access_token`
- Default logout redirects to `/login/clinic`
- Clears clinic-specific tokens

#### Patient

- Checks for `bimble_patient_onboarding_access_token` and `bimble_patient_access_token`
- Default logout redirects to `/login/patient`
- Clears patient-specific tokens

### Examples

#### Doctor Onboarding Step

```tsx
<StepShell
  title="Personal Information"
  description="Tell us about yourself"
  userType="doctor"
  onBack={() => router.push("/previous-step")}
  onNext={() => form.handleSubmit(handleSubmit)()}
  nextLabel="Continue"
  isSubmitting={isLoading}
  isNextDisabled={!form.formState.isValid}
  useCard={false}
  progressPercent={25}
>
  <FormProvider {...form}>{/* Form content */}</FormProvider>
</StepShell>
```

#### Clinic Onboarding Step

```tsx
<StepShell
  title="Clinic Details"
  description="Tell us about your clinic"
  userType="clinic"
  onBack={() => router.push("/register/clinic")}
  onNext={handleNext}
  nextLabel="Continue to Payment"
  isSubmitting={loading}
  useCard={false}
  progressPercent={40}
>
  <FormProvider {...form}>{/* Form content */}</FormProvider>
</StepShell>
```

#### Custom Logout Handler

```tsx
<StepShell
  title="Custom Step"
  userType="doctor"
  onLogout={() => {
    // Custom logout logic
    customLogoutHandler();
    router.push("/custom-logout-page");
  }}
>
  {/* Content */}
</StepShell>
```

## Migration from Old StepShell

To migrate from the old clinic-specific StepShell:

1. Update import:

   ```tsx
   // Old
   import { StepShell } from "@/components/onboarding/clinic/StepShell";

   // New
   import { StepShell } from "@/components/onboarding/common/StepShell";
   ```

2. Add `userType` prop:

   ```tsx
   // Add this prop to your StepShell usage
   userType = "doctor"; // or "clinic" or "patient"
   ```

3. Remove `progressText` prop (if used):
   ```tsx
   // Remove this prop as it's no longer supported
   progressText = "Step 1 of 5";
   ```

## Benefits

- **Unified codebase**: Single component for all user types
- **Better maintainability**: Easier to update and extend
- **Type safety**: TypeScript support for all props
- **Consistent UX**: Same behavior across all user types
- **Flexible**: Supports custom logout handlers and user-specific logic
