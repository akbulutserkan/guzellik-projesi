# Balanced Architecture Guide

## Introduction

This document outlines the balanced architecture pattern used across our application modules. The goal of this architecture is to balance responsibilities between frontend and backend, creating a maintainable, testable, and efficient codebase.

## Architecture Overview

Our balanced architecture consists of three main layers:

1. **Formatters Layer** (`/utils/[module]/formatters.ts`)
   - Formatting and validation utilities
   - Data type definitions
   - Pure functions with minimal dependencies

2. **Service Layer** (`/services/[module]Service.ts`)
   - API communication
   - Data processing
   - Error handling
   - Business logic

3. **Hook Layer** (`/hooks/use[Module]Management.ts`)
   - State management
   - UI logic
   - Permission handling
   - Composition of services

## Layer Details

### 1. Formatters Layer

**Purpose**: Handle data formatting, validation, and provide type definitions.

**Location**: `/src/utils/[module]/formatters.ts`

**Responsibilities**:
- Format data for display (dates, prices, phone numbers, etc.)
- Validate data before sending to API
- Define TypeScript interfaces and types
- Provide utility functions for data transformation
- Calculate derived values

**Example**:
```typescript
// /src/utils/appointment/formatters.ts
export const formatDate = (date: string | Date): string => {
  // Format date logic...
};

export const validateAppointmentData = (data: any): { valid: boolean; errors: Record<string, string> } => {
  // Validation logic...
};

export interface Appointment {
  id: string;
  // Properties...
}
```

### 2. Service Layer

**Purpose**: Handle API communication and data processing.

**Location**: `/src/services/[module]Service.ts`

**Responsibilities**:
- Communicate with backend APIs
- Process API responses
- Handle errors consistently
- Apply business logic
- Prepare data for UI consumption

**Example**:
```typescript
// /src/services/appointmentService.ts
export const getAppointments = async (
  filters: AppointmentFilterOptions = {},
  showToast: boolean = false
): Promise<Appointment[]> => {
  try {
    // API call logic...
  } catch (error) {
    // Error handling...
  }
};
```

### 3. Hook Layer

**Purpose**: Manage state and UI logic.

**Location**: `/src/hooks/use[Module]Management.ts`

**Responsibilities**:
- Manage component state
- Connect UI components to services
- Handle permissions and access control
- Provide derived/computed values
- Manage UI-specific operations

**Example**:
```typescript
// /src/hooks/useAppointmentManagement.ts
export const useAppointmentManagement = (props) => {
  // State management...
  
  // API operations using service layer...
  
  // UI logic...
  
  // Return values and functions...
  return {
    // State
    appointments,
    loading,
    error,
    
    // Functions
    fetchAppointments,
    createAppointment,
    // ...
  };
};
```

## Implementation Process

When implementing a new module or converting an existing one to the balanced architecture, follow these steps:

1. **Define Data Types**:
   - Create interfaces for your data in the formatters layer
   - Define all related types needed across the module

2. **Create Formatters**:
   - Implement formatting functions for all display needs
   - Add validation functions for data integrity

3. **Implement Services**:
   - Create API communication functions
   - Add error handling
   - Implement business logic

4. **Build Hooks**:
   - Create state management
   - Connect to services
   - Add UI-specific logic
   - Handle permissions

5. **Update Components**:
   - Replace direct API calls with hook usage
   - Remove formatting and validation code
   - Focus components on UI rendering

6. **Add Backward Compatibility** (if needed):
   - Create wrapper functions for old API calls
   - Forward calls to new services
   - Add deprecation warnings

## Benefits of Balanced Architecture

1. **Separation of Concerns**:
   - UI components focus on presentation
   - Services handle data fetching
   - Formatters manage data transformation

2. **Code Reusability**:
   - Formatting functions used across components
   - Services shared between different parts of the app
   - Hooks can be composed and extended

3. **Maintainability**:
   - Changes to API affect only the service layer
   - UI changes don't impact data handling
   - Formatting changes are centralized

4. **Testability**:
   - Pure functions in formatters are easy to test
   - Services can be mocked for testing components
   - Hooks can be tested independently

5. **Consistency**:
   - Uniform approach across modules
   - Predictable code organization
   - Easier onboarding for new developers

## Best Practices

1. **Keep Formatters Pure**:
   - No API calls in formatters
   - No state in formatters
   - Pure transformation functions

2. **Handle Errors Consistently**:
   - Catch errors in service layer
   - Provide meaningful error messages
   - Use consistent error structures

3. **Optimize Hook Performance**:
   - Use `useCallback` and `useMemo`
   - Minimize effect dependencies
   - Avoid redundant state updates

4. **Type Everything**:
   - Use TypeScript interfaces for all data
   - Define return types for functions
   - Use generic types where appropriate

5. **Document Your Code**:
   - Add comments for complex logic
   - Use JSDoc for function documentation
   - Explain non-obvious design decisions

## Examples

For examples of the balanced architecture in practice, refer to the following modules:

- Staff module
- Customers module
- Services module
- Packages module
- Appointments module

Each demonstrates the three-layer approach and showcases best practices for implementation.

## Conclusion

By following the balanced architecture pattern, we create a more maintainable, testable, and efficient codebase. This approach balances responsibilities between frontend and backend, making our application more robust and easier to develop.
