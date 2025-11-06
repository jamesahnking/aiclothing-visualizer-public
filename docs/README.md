# AI Clothing Visualizer Documentation

This directory contains documentation for the AI Clothing Visualizer project.

## Available Guides

- [Supabase Setup Guide](./supabase-setup-guide.md) - Comprehensive guide for setting up Supabase authentication, database, and storage for the project.
- [Supabase Email Authentication Setup](./supabase-email-auth-setup.md) - Detailed instructions for configuring email authentication in Supabase.
- [Protected Routes Example](./protected-routes-example.md) - Guide for implementing and using protected routes with Supabase authentication.

## Project Structure

The AI Clothing Visualizer is a Next.js application that allows users to:

1. Upload model images (photos of themselves)
2. Upload clothing images
3. Generate virtual try-on images using AI
4. Place these try-on images in different scenes

## Key Technologies

- **Frontend**: Next.js, React, React Bootstrap
- **Backend**: Next.js API Routes
- **Database & Auth**: Supabase
- **Storage**: Supabase Storage
- **AI Services**: 
  - IDM-VTON (via Replicate) for virtual try-on
  - AI Image Combiner for composite image generation
- **Monitoring**: LangSmith (optional)

## Authentication Implementation

The project uses Supabase for authentication with the following features:

- Email and password authentication
- Password reset functionality
- Protected routes for authenticated users
- User profile information in the navigation bar
- Sign-out functionality

## Database Schema

The database schema includes tables for:

- User profiles
- Model images
- Clothing images
- Scene images
- Generation results (try-on and composite)

## Storage Buckets

The project uses the following Supabase storage buckets:

- `model-images`: For storing user model images
- `clothing-images`: For storing clothing images
- `scene-images`: For storing scene images
- `generation-results`: For storing generated images
