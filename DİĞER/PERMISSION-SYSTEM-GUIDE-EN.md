# Permission System Guide and Best Practices

This guide contains the necessary information and solutions for correctly configuring the permission system in our application. It has been prepared based on the experience gained from solving problems in the Package Sales module.

## Contents

1. [Overview](#overview)
2. [Permission System Architecture](#permission-system-architecture)
3. [Adding New Permissions](#adding-new-permissions)
4. [API Protection Mechanisms](#api-protection-mechanisms)
5. [Multiple Permission Checks](#multiple-permission-checks)
6. [Package Sales Example](#package-sales-example)
7. [Common Errors and Solutions](#common-errors-and-solutions)
8. [Best Practices List](#best-practices-list)

## Overview

Our application provides role and permission-based authorization to users. Each user must have the necessary permissions to perform specific operations. These permissions are managed as follows:

- **Prisma Schema**: Permission types are defined as enums
- **PermissionsModal**: Enables management of permissions in the user interface
- **API Middleware**: Protects API routes against unauthorized access

## Permission System Architecture

### 1. Prisma Schema (Permission Enum)

Permission types are defined as enums in the `prisma/schema.prisma` file:

```prisma
enum Permission {
  // Service permissions
  VIEW_SERVICES
  ADD_SERVICE_CATEGORY
  // ... other permissions
  
  // Package Sales Permissions
  VIEW_PACKAGE_SALES
  ADD_PACKAGE_SALES
  EDIT_PACKAGE_SALES
  DELETE_PACKAGE_SALES
}
```

### 2. PermissionsModal Component

Grouping and labeling permissions in the user interface:

```typescript
const PERMISSION_GROUPS = {
  'Package Sales': [
    'VIEW_PACKAGE_SALES',
    'ADD_PACKAGE_SALES',
    'EDIT_PACKAGE_SALES',
    'DELETE_PACKAGE_SALES'
  ],
  // ... other groups
}

const PERMISSION_LABELS = {
  // Package Sales Permissions
  'VIEW_PACKAGE_SALES': 'Can view package sales',
  'ADD_PACKAGE_SALES': 'Can add new package sale',
  'EDIT_PACKAGE_SALES': 'Can edit package sales',
  'DELETE_PACKAGE_SALES': 'Can delete package sales',
  // ... other labels
}
```

### 3. API Middleware

API routes are protected using the `withProtectedRoute` and `withMultiPermissionRoute` functions:

```typescript
export const GET = withProtectedRoute(getHandler, {
  GET: Permission.VIEW_SOMETHING
});

// or

export const GET = withMultiPermissionRoute(getHandler, {
  GET: [Permission.VIEW_SOMETHING, Permission.VIEW_OTHER_THING]
});
```

## Adding New Permissions

Follow these steps when adding a new permission or module:

1. **Add to Prisma Schema**:
   ```prisma
   enum Permission {
     // Existing permissions...
     
     // New permissions
     VIEW_NEW_MODULE
     ADD_NEW_MODULE
     EDIT_NEW_MODULE
     DELETE_NEW_MODULE
   }
   ```

2. **Create Migration**:
   ```bash
   npx prisma migrate dev --name add_new_module_permissions
   npx prisma generate
   ```

3. **Update PermissionsModal Component**:
   ```typescript
   const PERMISSION_GROUPS = {
     // Existing groups...
     'New Module': [
       'VIEW_NEW_MODULE',
       'ADD_NEW_MODULE',
       'EDIT_NEW_MODULE',
       'DELETE_NEW_MODULE'
     ]
   }

   const PERMISSION_LABELS = {
     // Existing labels...
     'VIEW_NEW_MODULE': 'Can view new module',
     'ADD_NEW_MODULE': 'Can add to new module',
     'EDIT_NEW_MODULE': 'Can edit new module',
     'DELETE_NEW_MODULE': 'Can delete from new module'
   }
   ```

4. **Update handleTogglePermission Function**:
   ```typescript
   const handleTogglePermission = (permission: Permission) => {
     setSelectedPermissions((prev) => {
       const next = new Set(prev);

       const viewPermissionMap = {
         // Existing mappings...
         'ADD_NEW_MODULE': 'VIEW_NEW_MODULE',
         'EDIT_NEW_MODULE': 'VIEW_NEW_MODULE',
         'DELETE_NEW_MODULE': 'VIEW_NEW_MODULE'
       } as const;

       // If the selected permission is one that requires view permission
       if (permission in viewPermissionMap) {
         next.add(viewPermissionMap[permission as keyof typeof viewPermissionMap] as Permission);
       }

       // Toggle operation
       if (next.has(permission)) {
         next.delete(permission);
       } else {
         next.add(permission);
       }

       return next;
     });
   };
   ```

5. **Update usePermissions Hook**:
   ```typescript
   interface PermissionResult {
     // Existing properties...
     
     // New module permissions
     canViewNewModule: boolean;
     canAddNewModule: boolean;
     canEditNewModule: boolean;
     canDeleteNewModule: boolean;
   }
   
   export const usePermissions = (): PermissionResult => {
     // Existing functions...
     
     return {
       // Existing returns...
       
       // New module permissions
       canViewNewModule: hasPermission(Permission.VIEW_NEW_MODULE),
       canAddNewModule: hasPermission(Permission.ADD_NEW_MODULE),
       canEditNewModule: hasPermission(Permission.EDIT_NEW_MODULE),
       canDeleteNewModule: hasPermission(Permission.DELETE_NEW_MODULE),
     };
   };
   ```

6. **Protect API Routes**:
   ```typescript
   export const GET = withProtectedRoute(getHandler, {
     GET: Permission.VIEW_NEW_MODULE
   });
   
   export const POST = withProtectedRoute(createHandler, {
     POST: Permission.ADD_NEW_MODULE
   });
   ```

## API Protection Mechanisms

Two basic approaches are used to protect API routes in our application:

### 1. withProtectedRoute

For routes that require a single permission:

```typescript
export const GET = withProtectedRoute(getHandler, {
  GET: Permission.VIEW_SOMETHING
});
```

### 2. withMultiPermissionRoute

For cases where having any of multiple permissions is sufficient:

```typescript
export const GET = withMultiPermissionRoute(getHandler, {
  GET: [Permission.VIEW_SOMETHING, Permission.VIEW_OTHER_THING]
});
```

## Multiple Permission Checks

Some API routes are required for multiple modules. For example, both the Customers module and the Package Sales module require access to customer data. In this case:

```typescript
export const GET = withMultiPermissionRoute(getCustomers, {
  GET: [Permission.VIEW_CUSTOMERS, Permission.VIEW_PACKAGE_SALES]
});
```

This code allows users with either `VIEW_CUSTOMERS` or `VIEW_PACKAGE_SALES` permissions to access customer data.

## Package Sales Example

The authorization process for the Package Sales module serves as a good example:

1. **Added to Prisma Schema**:
   ```prisma
   enum Permission {
     // ... other permissions
     
     // Package Sales Permissions
     VIEW_PACKAGE_SALES
     ADD_PACKAGE_SALES
     EDIT_PACKAGE_SALES
     DELETE_PACKAGE_SALES
   }
   ```

2. **Updated PermissionsModal Component**:
   ```typescript
   const PERMISSION_GROUPS = {
     // ... other groups
     'Package Sales': [
       'VIEW_PACKAGE_SALES',
       'ADD_PACKAGE_SALES',
       'EDIT_PACKAGE_SALES',
       'DELETE_PACKAGE_SALES'
     ],
   }
   ```

3. **Updated Staff API** (access to staff data for Package Sales):
   ```typescript
   export const GET = withMultiPermissionRoute(getStaff, {
     GET: [Permission.VIEW_STAFF, Permission.VIEW_PACKAGE_SALES]
   });
   ```

4. **Updated Customers API** (access to customer data for Package Sales):
   ```typescript
   export const GET = withMultiPermissionRoute(getCustomers, {
     GET: [Permission.VIEW_CUSTOMERS, Permission.VIEW_PACKAGE_SALES]
   });
   ```

5. **Updated Packages API** (access to package data for Package Sales):
   ```typescript
   export const GET = withMultiPermissionRoute(getPackages, {
     GET: [Permission.VIEW_PACKAGES, Permission.VIEW_PACKAGE_SALES]
   });
   ```

6. **Protected Package Sales API**:
   ```typescript
   export const GET = withProtectedRoute(getPackageSales, {
     GET: Permission.VIEW_PACKAGE_SALES
   });
   
   export const POST = withProtectedRoute(createPackageSale, {
     POST: Permission.ADD_PACKAGE_SALES
   });
   ```

## Common Errors and Solutions

### 1. ID Parameter Error

```
Route "/api/staff/[id]/permissions" used `params.id`. `params` should be awaited before using its properties.
```

**Solution**: Use `params` object with `await`:

```typescript
// Incorrect
const { id } = params;

// Correct
const { id } = await params;
```

### 2. 403 Forbidden Error

If you are getting a 403 error despite the user having the necessary permissions:

1. Make sure the API route is correctly protected
2. Check whether other API routes used by the related module also have multiple permission checks (e.g., Staff API, Customers API, etc.)

### 3. Console Errors

```
Error: Staff information could not be retrieved
```

These types of errors usually occur when dependent API calls (Staff, Customers, etc.) fail due to permission issues.

## Best Practices List

1. **Comprehensive Update**: When adding a new module, comprehensively update the Prisma schema, PermissionsModal, API routes, and other dependent APIs.

2. **Remember Dependencies**: Determine which other APIs a module requires access to and protect them with `withMultiPermissionRoute`.

3. **Working with Params**: When using dynamic route parameters in Next.js, remember to use `await params`.

4. **Hierarchical Permissions**: Viewing permissions should typically be automatically granted for editing, deletion, etc. Implement this logic in the `handleTogglePermission` function.

5. **Test**: After adding new permissions, test with users who have different permissions.

6. **Examine Error Messages**: 403 Forbidden errors show which API call failed and help identify the problem.

7. **Database Migrations**: Don't forget to run database migration after adding new permissions.

By following this guide, you can correctly and comprehensively configure your permission system.
