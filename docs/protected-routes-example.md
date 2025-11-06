# Using Protected Routes with Supabase Authentication

This guide demonstrates how to use the `ProtectedRoute` component to secure pages that require authentication.

## Overview

The `ProtectedRoute` component is a wrapper that:

1. Checks if a user is authenticated
2. Redirects to the login page if not authenticated
3. Shows a loading state while checking authentication
4. Renders the protected content only when authenticated

## Basic Usage

To protect a page, wrap its content with the `ProtectedRoute` component:

```tsx
'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Container } from 'react-bootstrap';

export default function SecurePage() {
  return (
    <ProtectedRoute>
      <Container>
        <h1>Secure Content</h1>
        <p>This content is only visible to authenticated users.</p>
      </Container>
    </ProtectedRoute>
  );
}
```

## Protecting the Gallery Page

Here's an example of how to protect the gallery page:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getUserGenerations } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { GenerationResult } from '@/types/schemas';

export default function Gallery() {
  // Component state and logic...

  return (
    <ProtectedRoute>
      <MainLayout>
        {/* Gallery content */}
      </MainLayout>
    </ProtectedRoute>
  );
}
```

## Protecting API Routes

For API routes that need authentication, you can check for a valid session:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Proceed with authenticated request
  const userId = session.user.id;
  
  // Your API logic here...
  
  return NextResponse.json({ data: 'Protected data' });
}
```

## Conditional UI Elements

You can also use the `useAuth` hook to conditionally render UI elements based on authentication status:

```tsx
import { useAuth } from '@/lib/auth/AuthProvider';

function MyComponent() {
  const { user, isLoading } = useAuth();
  
  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : user ? (
        <div>
          <p>Welcome, {user.email}</p>
          <button>Perform Action</button>
        </div>
      ) : (
        <p>Please sign in to access this feature</p>
      )}
    </div>
  );
}
```

## Best Practices

1. **Always use client components**: Protected routes must be client components (`'use client'`) since they use hooks and browser APIs.

2. **Handle loading states**: Always show a loading indicator while authentication status is being checked.

3. **Provide feedback**: Let users know why they're being redirected if they try to access protected content.

4. **Combine with server-side checks**: Client-side protection should be combined with server-side validation for sensitive operations.

5. **Consider role-based protection**: Extend the `ProtectedRoute` component to support role-based access control if needed.

## Example: Role-Based Protected Route

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { useAuth } from '@/lib/auth/AuthProvider';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: string;
}

export default function RoleProtectedRoute({ 
  children, 
  requiredRole 
}: RoleProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth');
      } else if (user.user_metadata.role !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, router, requiredRole]);
  
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  
  if (!user || user.user_metadata.role !== requiredRole) {
    return null;
  }
  
  return <>{children}</>;
}
```

Usage:

```tsx
<RoleProtectedRoute requiredRole="admin">
  <AdminDashboard />
</RoleProtectedRoute>
