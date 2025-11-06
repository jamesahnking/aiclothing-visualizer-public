# Supabase Setup Guide for AI Clothing Visualizer

This guide will walk you through setting up Supabase for the AI Clothing Visualizer project, including authentication, database, and storage configuration.

## Table of Contents

1. [Creating a Supabase Project](#1-creating-a-supabase-project)
2. [Configuring Environment Variables](#2-configuring-environment-variables)
3. [Setting Up Authentication](#3-setting-up-authentication)
4. [Creating Database Tables](#4-creating-database-tables)
5. [Setting Up Storage Buckets](#5-setting-up-storage-buckets)
6. [Implementing Security Rules](#6-implementing-security-rules)
7. [Updating Client Code](#7-updating-client-code)
8. [Testing Your Setup](#8-testing-your-setup)

## 1. Creating a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account.
2. Click on "New Project" to create a new project.
3. Enter a name for your project (e.g., "ai-clothing-visualizer").
4. Choose a database password (make sure to save this securely).
5. Select a region closest to your users.
6. Click "Create new project" and wait for the project to be created.

## 2. Configuring Environment Variables

1. Once your project is created, go to the project dashboard.
2. Navigate to "Settings" > "API" in the sidebar.
3. Copy the following values:
   - Project URL
   - anon/public key
   - service_role key (keep this secure, it has full access to your database)

4. Update your `.env.local` file with these values:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 3. Setting Up Authentication

### Enable Email Authentication

1. In your Supabase dashboard, go to "Authentication" > "Providers".
2. Ensure "Email" is enabled.
3. Configure email templates under "Authentication" > "Email Templates" if desired.

### Update Auth Component

Update the `implementation/src/app/auth/page.tsx` file to use Supabase authentication:

```tsx
'use client';

import { useState } from 'react';
import { Row, Col, Card, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabase/client';

export default function Auth() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      setSuccess('Sign in successful! Redirecting...');
      
      // Redirect to home page after successful sign-in
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      // Create user account
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (signUpError) throw signUpError;
      
      setSuccess('Account created successfully! Please check your email for verification.');
      
      // Reset form and switch to sign in tab
      setPassword('');
      setConfirmPassword('');
      setName('');
      setTimeout(() => {
        setActiveTab('signin');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => k && setActiveTab(k)}
                className="mb-4"
              >
                <Tab eventKey="signin" title="Sign In">
                  {error && (
                    <Alert variant="danger" onClose={() => setError(null)} dismissible>
                      {error}
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
                      {success}
                    </Alert>
                  )}
                  
                  <Form onSubmit={handleSignIn}>
                    <Form.Group className="mb-3" controlId="signInEmail">
                      <Form.Label>Email address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="signInPassword">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Check
                        type="checkbox"
                        label="Remember me"
                        id="rememberMe"
                      />
                      <Button 
                        variant="link" 
                        className="p-0 text-decoration-none"
                        onClick={async () => {
                          if (!email) {
                            setError('Please enter your email address to reset password.');
                            return;
                          }
                          try {
                            const { error } = await supabase.auth.resetPasswordForEmail(email);
                            if (error) throw error;
                            setSuccess('Password reset email sent. Please check your inbox.');
                          } catch (err: any) {
                            setError(err.message || 'Failed to send reset email.');
                          }
                        }}
                      >
                        Forgot password?
                      </Button>
                    </div>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 mt-4"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </Form>
                </Tab>
                
                <Tab eventKey="signup" title="Sign Up">
                  {error && (
                    <Alert variant="danger" onClose={() => setError(null)} dismissible>
                      {error}
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
                      {success}
                    </Alert>
                  )}
                  
                  <Form onSubmit={handleSignUp}>
                    <Form.Group className="mb-3" controlId="signUpName">
                      <Form.Label>Name (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="signUpEmail">
                      <Form.Label>Email address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">
                        We&apos;ll never share your email with anyone else.
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="signUpPassword">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="signUpConfirmPassword">
                      <Form.Label>Confirm Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Check
                      type="checkbox"
                      label="I agree to the Terms of Service and Privacy Policy"
                      id="termsAgreement"
                      className="mb-3"
                      required
                    />

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </Form>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
}
```

### Create Auth Context Provider

Create a new file `implementation/src/lib/auth/AuthProvider.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

Update `implementation/src/app/layout.tsx` to include the AuthProvider:

```tsx
import AuthProvider from '@/lib/auth/AuthProvider';

// ... other imports

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## 4. Creating Database Tables

Run the following SQL in the Supabase SQL Editor to create the necessary tables:

```sql
-- Create users_profiles table to store additional user information
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create model_images table
CREATE TABLE public.model_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create clothing_images table
CREATE TABLE public.clothing_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('top', 'bottom', 'dress', 'outerwear', 'accessory')),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create scene_images table
CREATE TABLE public.scene_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create generation_results table
CREATE TABLE public.generation_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('try-on', 'composite')),
  storage_path TEXT NOT NULL,
  inputs JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create try_on_generations table
CREATE TABLE public.try_on_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  model_image_id UUID REFERENCES public.model_images(id) NOT NULL,
  clothing_image_id UUID REFERENCES public.clothing_images(id) NOT NULL,
  result_id UUID REFERENCES public.generation_results(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create composite_generations table
CREATE TABLE public.composite_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  try_on_image_id UUID REFERENCES public.generation_results(id) NOT NULL,
  scene_image_id UUID REFERENCES public.scene_images(id) NOT NULL,
  prompt TEXT NOT NULL,
  result_id UUID REFERENCES public.generation_results(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### Create Row-Level Security Policies

Set up Row-Level Security (RLS) to ensure users can only access their own data:

```sql
-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.try_on_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.composite_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for model_images
CREATE POLICY "Users can view their own model images"
  ON public.model_images
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own model images"
  ON public.model_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own model images"
  ON public.model_images
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own model images"
  ON public.model_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create similar policies for other tables
-- clothing_images
CREATE POLICY "Users can view their own clothing images"
  ON public.clothing_images
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clothing images"
  ON public.clothing_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clothing images"
  ON public.clothing_images
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clothing images"
  ON public.clothing_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- scene_images
CREATE POLICY "Users can view their own scene images"
  ON public.scene_images
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scene images"
  ON public.scene_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scene images"
  ON public.scene_images
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scene images"
  ON public.scene_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- generation_results
CREATE POLICY "Users can view their own generation results"
  ON public.generation_results
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generation results"
  ON public.generation_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generation results"
  ON public.generation_results
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generation results"
  ON public.generation_results
  FOR DELETE
  USING (auth.uid() = user_id);

-- try_on_generations
CREATE POLICY "Users can view their own try-on generations"
  ON public.try_on_generations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own try-on generations"
  ON public.try_on_generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own try-on generations"
  ON public.try_on_generations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own try-on generations"
  ON public.try_on_generations
  FOR DELETE
  USING (auth.uid() = user_id);

-- composite_generations
CREATE POLICY "Users can view their own composite generations"
  ON public.composite_generations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own composite generations"
  ON public.composite_generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own composite generations"
  ON public.composite_generations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own composite generations"
  ON public.composite_generations
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Create Triggers for User Profile Creation

Create a trigger to automatically create a user profile when a new user signs up:

```sql
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 5. Setting Up Storage Buckets

### Required Storage Buckets

The AI Clothing Visualizer application requires exactly 5 storage buckets:

1. In your Supabase dashboard, go to "Storage" > "Buckets".
2. Create the following buckets:
   - `model-images`: For storing uploaded model/person images
   - `clothing-images`: For storing uploaded clothing items
   - `scene-images`: For storing uploaded background scenes
   - `try-on-images`: For storing generated try-on results (person wearing clothing)
   - `composite-images`: For storing final composite images (person in scene)

### Bucket Usage in the Application

- **model-images**: Used when users upload model photos in the first step
- **clothing-images**: Used when users upload clothing items in the second step
- **scene-images**: Used when users upload scene backgrounds in the third step
- **try-on-images**: Used by the API to store the results of the virtual try-on process
- **composite-images**: Used by the API to store the final composite images

### Configure Storage Permissions

For each bucket, set up the following permissions:

1. Click on the bucket name to access its settings.
2. Go to the "Policies" tab.
3. Create the following policies for each bucket:

#### For all buckets (model-images, clothing-images, scene-images, try-on-images, composite-images):

**Read Policy:**
- Policy name: "Users can view their own images"
- Allowed operation: SELECT
- Policy definition: `(bucket_id = 'bucket-name' AND auth.uid() = owner)`

**Insert Policy:**
- Policy name: "Users can upload their own images"
- Allowed operation: INSERT
- Policy definition: `(bucket_id = 'bucket-name' AND auth.uid() = owner)`

**Update Policy:**
- Policy name: "Users can update their own images"
- Allowed operation: UPDATE
- Policy definition: `(bucket_id = 'bucket-name' AND auth.uid() = owner)`

**Delete Policy:**
- Policy name: "Users can delete their own images"
- Allowed operation: DELETE
- Policy definition: `(bucket_id = 'bucket-name' AND auth.uid() = owner)`

Replace 'bucket-name' with the actual bucket name in each policy definition.

## 6. Implementing Security Rules

### Create a Server-Side API Route for Secure Operations

For operations that require the service role key, create a server-side API route:

Create `implementation/src/app/api/supabase-admin/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    // Get the user from the session to verify they're authenticated
    const { data: { session } } = await supabaseAdmin.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Handle different admin actions
    switch (action) {
      case 'updateGenerationStatus':
        const { generationId, status, error } = data;
        
        // Verify the generation belongs to the user
        const { data: generation, error: fetchError } = await supabaseAdmin
          .from('generation_results')
          .select('user_id')
          .eq('id', generationId)
          .single();
        
        if (fetchError || !generation) {
          return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
        }
        
        if (generation.user_id !== userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        // Update the generation status
        const { error: updateError } = await supabaseAdmin
          .from('generation_results')
          .update({ status, error: error || null })
          .eq('id', generationId);
        
        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        
        return NextResponse.json({ success: true });
      
      // Add more admin actions as needed
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## 7. Updating Client Code

### Update Supabase Client

Update `implementation/src/lib/supabase/client.ts` with additional helper functions:

```typescript
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { ModelImage, ClothingImage, SceneImage, GenerationResult } from '@/types/schemas';

// Check if the required environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anonymous Key is missing. Please check your .env.local file.'
  );
}

// Create a Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Helper function to get a signed URL for an image
export async function getImageUrl(bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60); // 1 hour expiry
  
  if (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
  
  return data.signedUrl;
}

// Helper function to upload an image
export async function uploadImage(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  
  if (error) {
    console.error('Error uploading image:', error);
    return { data: null, error };
  }
  
  return { data, error: null };
}

// Helper function to upload a model image and save to database
export async function uploadModelImage(modelImage: ModelImage) {
  try {
    const user = supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const fileExt = modelImage.file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const storagePath = `${(await user).data.user?.id}/${fileName}`;
    
    // Upload to storage
    const { data, error } = await uploadImage('model-images', storagePath, modelImage.file);
    if (error) throw error;
    
    // Save to database
    const { error: dbError } = await supabase.from('model_images').insert({
      name: modelImage.name,
      storage_path: storagePath,
    });
    
    if (dbError) throw dbError;
    
    return { success: true, path: storagePath };
  } catch (error: any) {
    console.error('Error uploading model image:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to upload a clothing image and save to database
export async function uploadClothingImage(clothingImage: ClothingImage) {
  try {
    const user = supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const fileExt = clothingImage.file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const storagePath = `${(await user).data.user?.id}/${fileName}`;
    
    // Upload to storage
    const { data, error } = await uploadImage('clothing-images', storagePath, clothingImage.file);
    if (error) throw error;
    
    // Save to database
    const { error: dbError } = await supabase.from('clothing_images').insert({
      name: clothingImage.name,
      type: clothingImage.type,
      storage_path: storagePath,
    });
    
    if (dbError) throw dbError;
    
    return { success: true, path: storagePath };
  } catch (error: any) {
    console.error('Error uploading clothing image:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to upload a scene image and save to database
export async function uploadSceneImage(sceneImage: SceneImage) {
  try {
    const user = supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const fileExt = sceneImage.file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const storagePath = `${(await user).data.user?.id}/${fileName}`;
    
    // Upload to storage
    const { data, error } = await uploadImage('scene-images', storagePath, sceneImage.file);
    if (error) throw error;
    
    // Save to database
    const { error: db
