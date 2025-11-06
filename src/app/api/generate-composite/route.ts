import { NextRequest } from 'next/server';
import { handleCorsPreflightRequest, corsNextResponse } from '@/utils/corsUtils';
import { generateComposite, checkJobStatus } from '@/lib/ai-services/image-combiner';
import { getImageUrl, uploadImage, supabase } from '@/lib/supabase/client';
import { logGeneration, updateGeneration } from '@/lib/langsmith/client';
import { CompositeRequestSchema } from '@/types/schemas';
import { generateId } from '@/utils/helpers';
import { generateUniqueFilename } from '@/utils/image-processing';

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return handleCorsPreflightRequest();
}

/**
 * API route handler for generating composite images
 * 
 * This endpoint accepts a try-on image ID, scene image ID, and prompt, and initiates the composite image generation process.
 * It returns a generation ID that can be used to check the status of the generation.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] [Composite] Request received');
    
    // Parse and validate the request body
    const body = await request.json();
    
    // Validate the request using Zod schema
    const result = CompositeRequestSchema.safeParse(body);
    if (!result.success) {
      return corsNextResponse(
        { error: 'Invalid request data', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { figureImageId, sceneImageId, prompt } = result.data;
    
    console.log('[API] [Composite] Request validated', { figureImageId, sceneImageId, prompt });
    
    // Generate a unique ID for this generation
    const generationId = generateId();
    
    // Log the generation start with LangSmith
    await logGeneration('composite-generation', {
      generationId,
      figureImageId,
      sceneImageId,
      prompt,
    }, {
      status: 'started',
      timestamp: new Date().toISOString(),
    });
    
    // Extract base64 image data from the request
    const { figureImageBase64, sceneImageBase64 } = result.data;
    
    console.log('[API] [Composite] Using base64 image data directly');
    
    // Validate the base64 data
    if (!figureImageBase64 || !sceneImageBase64) {
      return corsNextResponse(
        { error: 'Missing image data. Both figure and scene images are required.' },
        { status: 400 }
      );
    }
    
    try {
      console.log('[API] [Composite] Calling Image Combiner API with base64 image data');
      
      // Call the AI Image Combiner API to generate the composite image using base64 data
      // Use Supabase URLs instead of base64 for better compatibility with the API
      const { jobId } = await generateComposite(figureImageBase64, sceneImageBase64, prompt, true);
      
      console.log('[API] [Composite] Image Combiner API call successful', { jobId });
      
    // Store the job ID in Supabase for status tracking
    console.log('[Supabase] Inserting generation record', { 
      generationId, 
      type: 'composite',
      jobId
    });
    
    await supabase
      .from('generations')
      .insert({
        id: generationId,
        user_id: request.headers.get('x-user-id') || 'anonymous',
        type: 'composite',
        status: 'processing',
        external_id: jobId,
        metadata: {
          figureImageId,
          sceneImageId,
          prompt
        }
      });
    
    console.log('[Supabase] Generation record inserted successfully');
      
      // Update the generation log with the job ID
      await updateGeneration(generationId, {
        status: 'processing',
        jobId
      });
    } catch (error) {
      console.error('Error calling AI Image Combiner API:', error);
      
      // Update the generation log with the error
      await updateGeneration(generationId, undefined, error instanceof Error ? error : new Error('Unknown error'));
      
      return corsNextResponse(
        { error: 'Failed to initiate composite generation', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    // Return the generation ID and initial status with debug info
    const response = {
      id: generationId,
      status: 'processing',
      message: 'Composite generation has been initiated',
      estimatedTimeSeconds: 20,
      debug: {
        figureImageId,
        sceneImageId,
        prompt,
        hasFigureImageBase64: !!figureImageBase64,
        hasSceneImageBase64: !!sceneImageBase64,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('[API] [Composite] Response sent', response);
    
    return corsNextResponse(response);
  } catch (error) {
    console.error('Error generating composite image:', error);
    return corsNextResponse(
      { error: 'Failed to generate composite image', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * API route handler for checking the status of a composite generation
 * 
 * This endpoint accepts a generation ID and returns the current status of the generation.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] [Composite] Status check request received');
    
    // Get the generation ID from the query parameters
    const url = new URL(request.url);
    const generationId = url.searchParams.get('id');
    
    console.log('[API] [Composite] Checking status for generation', { generationId });
    
    if (!generationId) {
      return corsNextResponse(
        { error: 'Missing generation ID' },
        { status: 400 }
      );
    }
    
    // Check the status in Supabase
    console.log('[Supabase] Querying generation record', { generationId });
    
    const { data: generation, error: dbError } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .single();
    
    console.log('[API] [Composite] Database query result', { 
      found: !!generation, 
      error: dbError?.message,
      status: generation?.status
    });
    
    if (dbError || !generation) {
      return corsNextResponse(
        { error: 'Generation not found', message: dbError?.message || 'Unknown error' },
        { status: 404 }
      );
    }
    
    // If the generation is already in a final state, return the stored status with debug info
    if (generation.status === 'completed' || generation.status === 'succeeded' || generation.status === 'failed') {
      console.log('[API] [Composite] Generation already in final state', { 
        status: generation.status,
        hasStoragePath: !!generation.storage_path
      });
      
      const imageUrl = (generation.status === 'completed' || generation.status === 'succeeded') ? 
        await getImageUrl('composite-images', generation.storage_path) : undefined;
      
      return corsNextResponse({
        id: generationId,
        status: generation.status,
        progress: 100,
        imageUrl,
        error: generation.error,
        debug: {
          jobId: generation.external_id,
          storagePath: generation.storage_path,
          bucketName: 'composite-images',
          metadata: generation.metadata,
          updatedAt: generation.updated_at
        }
      });
    }
    
    // If still processing, check the status with the AI Image Combiner API
    try {
      console.log('[API] [Composite] Checking external API status', { externalId: generation.external_id });
      
      const jobStatus = await checkJobStatus(generation.external_id);
      
      console.log('[API] [Composite] External API status received', { 
        status: jobStatus.status,
        hasImageUrl: !!jobStatus.imageUrl,
        error: jobStatus.error
      });
      
      // Update the status in Supabase based on the API response
      let newStatus = generation.status;
      let progress = generation.progress || 0;
      let storagePath = generation.storage_path;
      let error = generation.error;
      
      if (jobStatus.status === 'completed' || jobStatus.status === 'succeeded') {
        console.log('[API] [Composite] Job completed or succeeded, processing output');
        newStatus = 'completed';
        progress = 100;
        
      // If we have an output image URL, download and store it in Supabase
      if (jobStatus.imageUrl) {
        console.log('[API] [Composite] Downloading output image', { imageUrl: jobStatus.imageUrl });
        
        try {
          // Download the image
          const imageResponse = await fetch(jobStatus.imageUrl);
          const imageBlob = await imageResponse.blob();
          const imageFile = new File([imageBlob], `composite-${generationId}.png`, { type: 'image/png' });
          
          // Generate a unique filename and upload to Supabase
          const filename = generateUniqueFilename(imageFile.name, 'composite');
          storagePath = `${generationId}/${filename}`;
          
          console.log('[API] [Composite] Uploading image to storage', { storagePath });
          
          const { error: uploadError } = await uploadImage('composite-images', storagePath, imageFile);
          
          if (uploadError) {
            console.log('[API] [Composite] Upload failed', { error: uploadError.message });
            console.error('Error uploading composite result image:', uploadError);
            
            // Check if it's a bucket-related error
            if (uploadError.message && (
                uploadError.message.includes('bucket') || 
                uploadError.message.includes('does not exist')
              )) {
              newStatus = 'failed';
              error = `Storage configuration issue: ${uploadError.message}. Please ensure the "composite-images" bucket exists in your Supabase project.`;
            } else {
              newStatus = 'failed';
              error = `Failed to store the generated image: ${uploadError.message}`;
            }
          }
        } catch (downloadError) {
          console.error('[API] [Composite] Error downloading or processing image:', downloadError);
          newStatus = 'failed';
          error = 'Failed to download or process the generated image';
        }
        } else {
          newStatus = 'failed';
          error = 'No output image received from the API';
        }
      } else if (jobStatus.status === 'failed') {
        newStatus = 'failed';
        error = jobStatus.error || 'Generation failed';
      } else {
        // Still processing, estimate progress
        progress = jobStatus.status === 'processing' ? 50 : 25;
      }
      
      // Update the generation record in Supabase
      console.log('[Supabase] Updating generation record', { 
        generationId, 
        newStatus, 
        progress,
        hasStoragePath: !!storagePath
      });
      
      await supabase
        .from('generations')
        .update({
          status: newStatus,
          progress,
          storage_path: storagePath,
          error,
          updated_at: new Date().toISOString()
        })
        .eq('id', generationId);
      
      console.log('[Supabase] Generation record updated successfully');
      
      // Update the generation log
      await updateGeneration(generationId, {
        status: newStatus,
        progress,
        imageUrl: (newStatus === 'completed' || newStatus === 'succeeded') ? await getImageUrl('composite-images', storagePath) : undefined,
        error
      });
      
      // Return the current status with debug info
      const status = {
        id: generationId,
        status: newStatus,
        progress,
        imageUrl: (newStatus === 'completed' || newStatus === 'succeeded') ? await getImageUrl('composite-images', storagePath) : undefined,
        error,
        debug: {
          jobId: generation.external_id,
          storagePath,
          bucketName: 'composite-images',
          metadata: generation.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      
      console.log('[API] [Composite] Status response sent', { 
        id: generationId,
        status: newStatus,
        progress,
        hasImageUrl: (newStatus === 'completed' || newStatus === 'succeeded'),
        error
      });
      
      return corsNextResponse(status);
    } catch (error) {
      console.error('Error checking job status:', error);
      
      // Update the generation log with the error
      await updateGeneration(generationId, undefined, error instanceof Error ? error : new Error('Unknown error'));
      
      return corsNextResponse(
        { error: 'Failed to check generation status', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error checking generation status:', error);
    return corsNextResponse(
      { error: 'Failed to check generation status', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
