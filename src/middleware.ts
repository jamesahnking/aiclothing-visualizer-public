import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleCorsPreflightRequest, addCorsHeadersToNextResponse } from './utils/corsUtils';

export async function middleware(req: NextRequest) {
  // Handle CORS preflight requests for API routes
  if (req.method === 'OPTIONS' && req.nextUrl.pathname.startsWith('/api/')) {
    return handleCorsPreflightRequest();
  }
  
  const res = NextResponse.next();
  
  // Get the pathname from the URL
  const { pathname } = req.nextUrl;
  
  // Enhanced debug logging
  console.log(`Middleware: Path ${pathname}`);
  console.log(`Middleware: Request URL: ${req.url}, Origin: ${req.headers.get('origin') || 'none'}`);
  
// We're using client-side ProtectedRoute component for page protection
// No need to check for protected routes in middleware
  
  // Add CORS headers to API responses
  if (req.nextUrl.pathname.startsWith('/api/')) {
    addCorsHeadersToNextResponse(res);
    console.log(`Middleware: Added CORS headers to API response for ${pathname}`);
  }
  
  // User is authenticated or accessing a non-protected route
  return res;
}

// Configure the middleware to run only on specific routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
