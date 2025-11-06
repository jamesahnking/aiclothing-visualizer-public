/**
 * CORS Utilities
 * 
 * This module provides utility functions and constants for handling CORS (Cross-Origin Resource Sharing)
 * in the application. It includes default headers, helper functions for handling preflight requests,
 * and utilities for adding CORS headers to responses.
 */

import { NextResponse } from 'next/server';

/**
 * Default CORS headers to be used across the application
 */
export const defaultCorsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or specific domains like 'http://localhost:3000,https://your-app.vercel.app'
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400', // 24 hours (in seconds)
};

/**
 * Helper function to handle OPTIONS preflight requests
 * 
 * @returns Response with appropriate CORS headers and 204 status code
 */
export function handleCorsPreflightRequest() {
  return new Response(null, {
    status: 204,
    headers: defaultCorsHeaders,
  });
}

/**
 * Helper function to add CORS headers to a Response object
 * 
 * @param response The original Response object
 * @param customHeaders Optional custom headers to override defaults
 * @returns A new Response with CORS headers added
 */
export function addCorsHeaders(response: Response, customHeaders?: Record<string, string>) {
  const newHeaders = new Headers(response.headers);
  
  // Add default CORS headers
  Object.entries(defaultCorsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  // Add custom headers if provided (overriding defaults)
  if (customHeaders) {
    Object.entries(customHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Helper function to add CORS headers to a NextResponse object
 * 
 * @param response The original NextResponse object
 * @param customHeaders Optional custom headers to override defaults
 * @returns The modified NextResponse with CORS headers added
 */
export function addCorsHeadersToNextResponse(response: NextResponse, customHeaders?: Record<string, string>) {
  // Add default CORS headers
  Object.entries(defaultCorsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add custom headers if provided (overriding defaults)
  if (customHeaders) {
    Object.entries(customHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  return response;
}

/**
 * Helper function to create a NextResponse with CORS headers
 * 
 * @param body The response body
 * @param init Optional initialization options
 * @param customHeaders Optional custom headers to override defaults
 * @returns A NextResponse with CORS headers
 */
export function corsNextResponse<T>(body: T, init?: ResponseInit, customHeaders?: Record<string, string>) {
  const headers = { ...defaultCorsHeaders, ...(init?.headers || {}), ...(customHeaders || {}) };
  return NextResponse.json(body, { ...init, headers });
}
