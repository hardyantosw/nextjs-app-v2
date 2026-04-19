# Task 2-3: Auth Roles & User Management API

## Summary
Updated the auth system to support roles (`admin` | `pegawai`) and `pegawaiId`, and created a complete User Management API.

## Changes Made

### 1. Updated `/src/lib/auth.ts`
- Changed `SessionData.role` from `string` to `'admin' | 'pegawai'` union type
- Updated `createSession` to require `role: string` and `pegawaiId: string | null` (no longer optional)
- Added `checkAuth(request)` helper - returns `{ session, isAuthorized } | null`
- Added `requireAdmin(request)` helper - returns `SessionData | null` (null if not admin or not authenticated)
- Both helpers are synchronous (not async) since `getSession` is sync

### 2. Updated `/src/app/api/auth/login/route.ts`
- Already included `role` and `pegawaiId` in session creation and response (was done by previous agent)

### 3. Updated `/src/app/api/auth/me/route.ts`
- Added `role` and `pegawaiId` to the response data object

### 4. Updated `/src/app/api/auth/setup/route.ts`
- Already had `role: 'admin'` for default admin user (was done by previous agent)

### 5. Created `/src/app/api/users/route.ts`
- **GET**: List all users with pegawai info (admin only)
  - Query params: `search`, `page`, `limit`
  - Includes pegawai relation (id, nama, nip, jabatan, opd)
  - Uses `requireAdmin` for auth
- **POST**: Create new user (admin only)
  - Body: `{ username, password, nama, role, pegawaiId }`
  - Validates role is 'admin' or 'pegawai'
  - If role is 'pegawai', pegawaiId is required
  - If role is 'admin', pegawaiId is set to null
  - Checks username uniqueness
  - Checks pegawaiId isn't already linked to another user
  - Hashes password using `hashPassword`

### 6. Created `/src/app/api/users/[id]/route.ts`
- **GET**: Get single user with pegawai info (admin only)
- **PUT**: Update user (admin only)
  - Body: `{ username?, password?, nama?, role?, pegawaiId? }`
  - If password provided, hash it
  - If role changes to 'admin', clear pegawaiId
  - If role changes to 'pegawai', pegawaiId is required
  - Checks username uniqueness (excluding current user)
  - Checks pegawaiId isn't linked to another user
- **DELETE**: Delete user (admin only, cannot delete self)

### 7. Created `/src/app/api/users/change-password/route.ts`
- **POST**: Change own password (works for both admin and pegawai)
  - Body: `{ currentPassword, newPassword }`
  - Verifies current password before changing
  - Uses `checkAuth` (not `requireAdmin`) so both roles can use it

## Lint Result
- 0 errors, 0 warnings
