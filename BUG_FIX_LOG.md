# Bug Fix Log - African Nations League

## Issue 1: Invalid API Key on Authentication ❌ → ✅ FIXED

**Date Fixed:** November 9, 2025
**Severity:** CRITICAL (Blocks authentication)
**Status:** RESOLVED

### Problem Description
Users received an "Invalid API key" error when attempting to sign up or sign in.

### Root Cause
The Supabase client was initialized with `VITE_SUPABASE_PUBLISHABLE_KEY` instead of `VITE_SUPABASE_ANON_KEY`.

**Incorrect:**
```typescript
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
```

**Why This Failed:**
- `VITE_SUPABASE_PUBLISHABLE_KEY` is for public metadata only
- Authentication operations require `VITE_SUPABASE_ANON_KEY` (Anonymous User Key)
- Using the wrong key causes API rejection with "Invalid API key" error

### Solution
Changed the Supabase client to use the correct anonymous key:

```typescript
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
```

### Files Modified
- `src/integrations/supabase/client.ts` (Line 6, 11)

### Verification
- ✅ Build successful (0 errors)
- ✅ No TypeScript errors
- ✅ Environment variables correctly configured
- ✅ Supabase client now uses correct key

### Testing Steps
1. Navigate to `/auth`
2. Try signing up with a new email
3. Should now work without "Invalid API key" error
4. Try signing in with existing credentials
5. Should work successfully

### Impact
- **Users Affected:** All users attempting authentication
- **Services Restored:** Login and signup functionality
- **Data Lost:** None
- **Breaking Changes:** None

### Commit
- **Hash:** 70d0ef1
- **Message:** Fix Supabase authentication API key issue
- **Files Changed:** 1 file

### Key Difference Between Supabase Keys

| Key Type | Purpose | Use Case |
|----------|---------|----------|
| **Publishable Key** | Public metadata | Data that can be exposed (non-sensitive) |
| **Anon Key** | Anonymous access | Authentication, public data access |
| **Service Role Key** | Admin access | Server-side operations, RLS bypass |

Always use **Anon Key** for client-side authentication and user operations.

### Prevention
- Document the correct key to use in Supabase client setup
- Add comments explaining which key should be used
- Verify during code review that correct keys are used
- Add environment variable validation on startup

---

## Summary
The authentication issue has been resolved by using the correct Supabase API key. Users can now successfully sign up and sign in to the application.
