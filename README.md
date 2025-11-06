# AI Clothing Visualizer

A web application that allows users to visualize clothing items on models and place them in different scenes using AI-powered image generation.

## Features

- Virtual try-on of clothing items on model images
- Composite generation to place try-on results in different scenes
- Image storage and management with Supabase
- API integration with IDM-VTON and AI Image Combiner

## Project Structure
/  - `/docs`: Guides and Instructions
/  - `/src`: Source code
    - `/app`: Next.js app router pages
    - `/components`: React components
    - `/lib`: Library code and API clients
    - `/utils`: Utility functions
    - `/types`: TypeScript type definitions

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- IDM-VTON API key (Replicate)
- AI Image Combiner API key


### Environment Setup

1. Clone the repository
2. Navigate to the implementation directory:
   ```bash
   cd implementation
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env.local` file with the following variables:
   ```
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AI Service API Keys
   IDM_VTON_API_KEY=your_idm_vton_api_key
   AI_IMAGE_COMBINER_API_KEY=your_ai_image_combiner_api_key

   # LangSmith Configuration (optional)
   LANGSMITH_API_KEY=your_langsmith_api_key
   LANGSMITH_PROJECT=your_langsmith_project_name
   ```

### Supabase Setup

1. Create a new Supabase project
2. Set up the following storage buckets:
   - `model-images`: For user-uploaded model images
   - `clothing-images`: For user-uploaded clothing items
   - `scene-images`: For background scenes
   - `try-on-images`: For generated try-on results
   - `composite-images`: For final composite images
3. Create the database schema using the SQL commands in the [Database Schema](#database-schema) section

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Testing the API

You can test the API endpoints using the built-in test page:

1. Navigate to [http://localhost:3000/api-test](http://localhost:3000/api-test)
2. Upload model and clothing images using the main application
3. Use the image IDs to test the try-on generation
4. Use the try-on image ID and a scene image ID to test the composite generation

## Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model images table
CREATE TABLE model_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clothing types enum
CREATE TYPE clothing_type AS ENUM ('top', 'bottom', 'dress', 'outerwear', 'accessory');

-- Clothing images table
CREATE TABLE clothing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  type clothing_type NOT NULL,
  storage_path TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scene images table
CREATE TABLE scene_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generation status enum
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Generation type enum
CREATE TYPE generation_type AS ENUM ('try-on', 'composite');

-- Generations table (for both try-on and composite)
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type generation_type NOT NULL,
  status generation_status NOT NULL DEFAULT 'pending',
  external_id TEXT, -- API provider's job/prediction ID
  storage_path TEXT, -- Path to the result image (when completed)
  error TEXT, -- Error message if failed
  progress INTEGER, -- Progress percentage (0-100)
  metadata JSONB NOT NULL DEFAULT '{}', -- Additional metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Try-on generations table (extends generations)
CREATE TABLE try_on_generations (
  id UUID PRIMARY KEY REFERENCES generations(id),
  model_image_id UUID REFERENCES model_images(id) NOT NULL,
  clothing_image_id UUID REFERENCES clothing_images(id) NOT NULL
);

-- Composite generations table (extends generations)
CREATE TABLE composite_generations (
  id UUID PRIMARY KEY REFERENCES generations(id),
  try_on_image_id UUID REFERENCES generations(id) NOT NULL,
  scene_image_id UUID REFERENCES scene_images(id) NOT NULL,
  prompt TEXT NOT NULL
);
```

## API Endpoints

### Try-On Generation

- **POST /api/generate-try-on**
  - Request body:
    ```json
    {
      "modelImageId": "uuid",
      "clothingImageId": "uuid"
    }
    ```
  - Response:
    ```json
    {
      "id": "generation-id",
      "status": "processing",
      "message": "Try-on generation has been initiated",
      "estimatedTimeSeconds": 15
    }
    ```

- **GET /api/generate-try-on?id={generationId}**
  - Response:
    ```json
    {
      "id": "generation-id",
      "status": "completed",
      "progress": 100,
      "imageUrl": "https://example.com/image.jpg"
    }
    ```

### Composite Generation

- **POST /api/generate-composite**
  - Request body:
    ```json
    {
      "tryOnImageId": "uuid",
      "sceneImageId": "uuid",
      "prompt": "A detailed description for the composition"
    }
    ```
  - Response:
    ```json
    {
      "id": "generation-id",
      "status": "processing",
      "message": "Composite generation has been initiated",
      "estimatedTimeSeconds": 20
    }
    ```

- **GET /api/generate-composite?id={generationId}**
  - Response:
    ```json
    {
      "id": "generation-id",
      "status": "completed",
      "progress": 100,
      "imageUrl": "https://example.com/image.jpg"
    }
    ```

## License

MIT
