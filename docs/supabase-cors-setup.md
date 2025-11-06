# CORS Configuration for AI Clothing Visualizer

This document explains how Cross-Origin Resource Sharing (CORS) is configured in the AI Clothing Visualizer application, particularly for API routes and Supabase integration.

## Hybrid CORS Implementation

We've implemented a hybrid approach to CORS handling that provides both centralized configuration and route-specific flexibility:

1. **Centralized CORS handling** via middleware for all API routes
2. **Route-specific CORS customization** when needed
3. **Proper handling of preflight requests** (OPTIONS method)

## Implementation Components

### 1. CORS Utilities (`src/utils/corsUtils.ts`)

This module provides reusable CORS utilities:

- `defaultCorsHeaders`: Default CORS headers used across the application
- `handleCorsPreflightRequest()`: Helper function for handling OPTIONS preflight requests
- `addCorsHeaders()`: Adds CORS headers to a standard Response object
- `addCorsHeadersToNextResponse()`: Adds CORS headers to a NextResponse object
- `corsNextResponse()`: Creates a NextResponse with CORS headers

### 2. Middleware CORS Handling (`src/middleware.ts`)

The middleware:

- Intercepts all API requests (`/api/*` routes)
- Handles OPTIONS preflight requests automatically
- Adds CORS headers to all API responses
- Logs CORS-related actions for debugging

```typescript
// Example from middleware.ts
// Handle CORS preflight requests for API routes
if (req.method === 'OPTIONS' && req.nextUrl.pathname.startsWith('/api/')) {
  return handleCorsPreflightRequest();
}

// Add CORS headers to API responses
if (req.nextUrl.pathname.startsWith('/api/')) {
  addCorsHeadersToNextResponse(res);
  console.log(`Middleware: Added CORS headers to API response for ${pathname}`);
}
```

### 3. Route-Specific CORS Handling (e.g., `src/app/api/generate/route.ts`)

API routes can:

- Handle OPTIONS requests explicitly
- Use the `corsNextResponse` utility for custom CORS headers
- Override default headers when needed

```typescript
// Example from generate/route.ts
// Add OPTIONS handler for preflight requests
export async function OPTIONS() {
  return handleCorsPreflightRequest();
}

// Use corsNextResponse in route handlers
return corsNextResponse(
  { error: 'Authentication required' },
  { status: 401 }
);
```

## Supabase CORS Configuration

In addition to the application-level CORS handling, Supabase also requires its own CORS configuration:

1. **Supabase Dashboard**: Configure allowed origins in the Supabase dashboard under Project Settings > API > CORS Configuration
2. **Environment Variables**: Ensure your frontend URL is included in the allowed origins

For detailed Supabase CORS setup, see the [Supabase documentation](https://supabase.com/docs/guides/auth/cors).

## Testing CORS Configuration

To test if CORS is properly configured:

1. Make a cross-origin request to your API endpoint
2. Check if the preflight request (OPTIONS) is handled correctly
3. Verify that the actual request includes the proper CORS headers
4. Inspect browser console for CORS-related errors

You can use tools like Postman or browser developer tools to test CORS configuration.

## Troubleshooting

Common CORS issues and solutions:

1. **Missing headers**: Ensure all required CORS headers are included
2. **Incorrect origin**: Verify that the allowed origins match your frontend URL
3. **Preflight failure**: Check that OPTIONS requests are handled correctly
4. **Credentials issues**: If using credentials, ensure `Access-Control-Allow-Credentials` is set to `true`
5. **Header mismatch**: Ensure requested headers in `Access-Control-Request-Headers` are included in `Access-Control-Allow-Headers`

## References

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Next.js Middleware](https://nextjs.org/docs/middleware)
- [Supabase CORS Configuration](https://supabase.com/docs/guides/auth/cors)
