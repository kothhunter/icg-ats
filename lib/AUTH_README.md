# Authentication System Documentation

## Overview

The ICG-ATS authentication system uses cookie-based sessions to protect officer routes. Officers can log in through `/login` and access protected `/dashboard` routes.

## Files

- **`/lib/auth.ts`** - Authentication helper functions
- **`/middleware.ts`** - Route protection middleware
- **`/app/login/page.tsx`** - Login page
- **`/components/LogoutButton.tsx`** - Reusable logout button component

## Cookie Structure

The `officer_session` cookie stores:
```json
{
  "id": "officer-uuid",
  "username": "officer-username",
  "display_name": "Officer Full Name"
}
```

- **Expires**: 7 days
- **SameSite**: strict
- **Secure**: Automatically set in production

## Helper Functions

### `getSession()`

Get the current officer session from cookies.

```typescript
import { getSession } from '@/lib/auth';

const session = getSession();
if (session) {
  console.log(session.display_name); // "Officer Full Name"
  console.log(session.username);     // "officer-username"
  console.log(session.id);           // "officer-uuid"
}
```

### `requireAuth(redirectUrl?)`

Check authentication and redirect to login if not authenticated. Use in client components.

```typescript
'use client';

import { requireAuth } from '@/lib/auth';
import { useEffect } from 'react';

export default function ProtectedPage() {
  useEffect(() => {
    requireAuth('/dashboard'); // Redirects to login if not authenticated
  }, []);

  return <div>Protected content</div>;
}
```

### `isAuthenticated()`

Check if user is authenticated without redirecting.

```typescript
import { isAuthenticated } from '@/lib/auth';

if (isAuthenticated()) {
  // User is logged in
} else {
  // User is not logged in
}
```

### `logout(redirectHome?)`

Log out the current user and optionally redirect to home.

```typescript
import { logout } from '@/lib/auth';

// Logout and redirect to home
logout();

// Logout without redirect
logout(false);
```

### `getOfficerName()`

Get the display name of the current officer.

```typescript
import { getOfficerName } from '@/lib/auth';

const name = getOfficerName(); // "Officer Full Name" or null
```

### `getOfficerUsername()`

Get the username of the current officer.

```typescript
import { getOfficerUsername } from '@/lib/auth';

const username = getOfficerUsername(); // "officer-username" or null
```

## Middleware

The middleware automatically protects all `/dashboard/*` routes. No additional configuration needed.

**Protected routes:**
- `/dashboard`
- `/dashboard/applicants`
- `/dashboard/settings`
- Any other route under `/dashboard`

**Behavior:**
1. Checks for `officer_session` cookie
2. Validates cookie content
3. If invalid/missing: redirects to `/login?redirect=/dashboard/...`
4. If valid: allows access

## Usage Examples

### Protected Page Component

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getSession, type OfficerSession } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';

export default function DashboardPage() {
  const [session, setSession] = useState<OfficerSession | null>(null);

  useEffect(() => {
    // Get session on mount
    const currentSession = getSession();
    setSession(currentSession);
  }, []);

  return (
    <div>
      <h1>Welcome, {session?.display_name}!</h1>
      <LogoutButton />
    </div>
  );
}
```

### Using the LogoutButton Component

```typescript
import LogoutButton from '@/components/LogoutButton';

// Default: redirects to home with confirmation
<LogoutButton />

// Custom styling
<LogoutButton className="bg-red-500 text-white px-4 py-2 rounded" />

// Don't redirect after logout
<LogoutButton redirectHome={false} />
```

### Conditional Rendering Based on Auth

```typescript
'use client';

import { isAuthenticated } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function Header() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, []);

  return (
    <nav>
      {loggedIn ? (
        <a href="/dashboard">Dashboard</a>
      ) : (
        <a href="/login">Login</a>
      )}
    </nav>
  );
}
```

## Testing

### Create Test Officer

Add a test officer to Supabase:

```sql
INSERT INTO officers (username, password_hash, display_name)
VALUES ('admin', 'password123', 'Admin User');
```

### Test Login

1. Visit `/login`
2. Username: `admin`
3. Password: `password123`
4. Should redirect to `/dashboard`

### Test Protection

1. Log out
2. Try to visit `/dashboard`
3. Should redirect to `/login?redirect=/dashboard`
4. After login, should redirect back to `/dashboard`

## Security Notes

⚠️ **MVP Implementation**: This uses plain text password comparison for MVP purposes.

**For Production:**
- Use bcrypt or argon2 for password hashing
- Implement proper session management (database-backed sessions)
- Add CSRF protection
- Use HTTPS only
- Implement rate limiting on login
- Add two-factor authentication
- Use secure, httpOnly cookies
- Implement session expiration and refresh

## Troubleshooting

**"Redirects to login even when logged in"**
- Check browser cookies (look for `officer_session`)
- Ensure cookie is valid JSON
- Check cookie expiration date

**"Session not persisting"**
- Check SameSite cookie settings
- Ensure cookies are enabled in browser
- Verify domain/path settings match

**"Middleware not running"**
- Check `/middleware.ts` is at root level
- Verify matcher pattern includes your route
- Check Next.js version (middleware requires Next.js 12+)
