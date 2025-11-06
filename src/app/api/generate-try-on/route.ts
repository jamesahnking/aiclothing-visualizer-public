import { NextRequest } from 'next/server';
import { handleCorsPreflightRequest, corsNextResponse } from '@/utils/corsUtils';
import { generateTryOn, checkPredictionStatus } from '@/lib/ai-services/idm-vton';
import { getImageUrl, uploadImage, supabase } from '@/lib/supabase/client';
import { logGeneration, updateGeneration } from '@/lib/langsmith/client';
import { TryOnRequestSchema } from '@/types/schemas';
import { generateId } from '@/utils/helpers';
import { generateUniqueFilename } from '@/utils/image-processing';

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return handleCorsPreflightRequest();
}

/**
 * API route handler for generating try-on images
 * 
 * This endpoint accepts model and clothing image IDs and initiates the virtual try-on process.
 * It returns a generation ID that can be used to check the status of the generation.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] [Try-On] Request received');
    
    // Parse and validate the request body
    const body = await request.json();
    
    // Validate the request using Zod schema
    const result = TryOnRequestSchema.safeParse(body);
    if (!result.success) {
      return corsNextResponse(
        { error: 'Invalid request data', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { modelImageId, clothingImageId, prompt } = result.data;
    
    console.log('[API] [Try-On] Request validated', { modelImageId, clothingImageId, prompt });
    
    // Generate a unique ID for this generation
    const generationId = generateId();
    
    // Log the generation start with LangSmith
    await logGeneration('try-on-generation', {
      generationId,
      modelImageId,
      clothingImageId,
    }, {
      status: 'started',
      timestamp: new Date().toISOString(),
    });
    
    // Extract base64 image data from the request
    const { modelImageBase64, clothingImageBase64 } = result.data;
    
    console.log('[API] [Try-On] Using base64 image data directly');
    
    // Validate the base64 data
    if (!modelImageBase64 || !clothingImageBase64) {
      return corsNextResponse(
        { error: 'Missing image data. Both model and clothing images are required.' },
        { status: 400 }
      );
    }
    
    try {
      console.log('[API] [Try-On] Calling IDM-VTON API with base64 image data');
      
      // Call the IDM-VTON API to generate the try-on image using base64 data
      const { id: predictionId } = await generateTryOn(modelImageBase64, clothingImageBase64, prompt);
      
      console.log('[API] [Try-On] IDM-VTON API call successful', { predictionId });
      
    // Store the prediction ID in Supabase for status tracking
    console.log('[Supabase] Inserting generation record', { 
      generationId, 
      type: 'try-on',
      predictionId
    });
    
    await supabase
      .from('generations')
      .insert({
        id: generationId,
        user_id: request.headers.get('x-user-id') || 'anonymous',
        type: 'try-on',
        status: 'processing',
        external_id: predictionId,
        metadata: {
          modelImageId,
          clothingImageId,
          prompt
        }
      });
    
    console.log('[Supabase] Generation record inserted successfully');
      
      // Update the generation log with the prediction ID
      await updateGeneration(generationId, {
        status: 'processing',
        predictionId
      });
    } catch (error) {
      console.error('Error calling IDM-VTON API:', error);
      
      // Update the generation log with the error
      await updateGeneration(generationId, undefined, error instanceof Error ? error : new Error('Unknown error'));
      
      return corsNextResponse(
        { error: 'Failed to initiate try-on generation', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    // Return the generation ID and initial status with debug info
    const response = {
      id: generationId,
      status: 'processing',
      message: 'Try-on generation has been initiated',
      estimatedTimeSeconds: 15,
      debug: {
        modelImageId,
        clothingImageId,
        hasModelImageBase64: !!modelImageBase64,
        hasClothingImageBase64: !!clothingImageBase64,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('[API] [Try-On] Response sent', response);
    
    return corsNextResponse(response);
  } catch (error) {
    console.error('Error generating try-on image:', error);
    return corsNextResponse(
      { error: 'Failed to generate try-on image', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * API route handler for checking the status of a try-on generation
 * 
 * This endpoint accepts a generation ID and returns the current status of the generation.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] [Try-On] Status check request received');
    
    // Get the generation ID from the query parameters
    const url = new URL(request.url);
    const generationId = url.searchParams.get('id');
    
    console.log('[API] [Try-On] Checking status for generation', { generationId });
    
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
    
    console.log('[API] [Try-On] Database query result', { 
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
    
    // If the generation is already completed or failed, return the stored status with debug info
    if (generation.status === 'completed' || generation.status === 'failed') {
      console.log('[API] [Try-On] Generation already in final state', { 
        status: generation.status,
        hasStoragePath: !!generation.storage_path
      });
      
      // Get the image URL if the generation is completed
      let imageUrl = undefined;
      if (generation.status === 'completed' && generation.storage_path) {
        imageUrl = await getImageUrl('try-on-images', generation.storage_path);
        
        // Log whether we got a URL
        console.log('[API] [Try-On] Image URL retrieval for completed generation', { 
          hasImageUrl: !!imageUrl,
          storagePath: generation.storage_path
        });
        
        // If we couldn't get an image URL but the generation is completed, add a warning
        if (!imageUrl) {
          console.warn('[API] [Try-On] Could not retrieve image URL for completed generation', {
            generationId,
            storagePath: generation.storage_path
          });
          
          // Create a direct public URL as a last resort
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (supabaseUrl) {
            imageUrl = `${supabaseUrl}/storage/v1/object/public/try-on-images/${generation.storage_path}`;
            console.log('[API] [Try-On] Created direct public URL as fallback', { imageUrl });
          }
        }
      }
      
      return corsNextResponse({
        id: generationId,
        status: generation.status,
        progress: 100,
        imageUrl,
        error: generation.error,
        debug: {
          predictionId: generation.external_id,
          storagePath: generation.storage_path,
          bucketName: 'try-on-images',
          metadata: generation.metadata,
          updatedAt: generation.updated_at
        }
      });
    }
    
    // If still processing, check the status with the IDM-VTON API
    try {
      console.log('[API] [Try-On] Checking external API status', { externalId: generation.external_id });
      
      const predictionStatus = await checkPredictionStatus(generation.external_id);
      
      console.log('[API] [Try-On] External API status received', { 
        status: predictionStatus.status,
        hasOutput: !!predictionStatus.output,
        error: predictionStatus.error
      });
      
      // Update the status in Supabase based on the API response
      let newStatus = generation.status;
      let progress = generation.progress || 0;
      let storagePath = generation.storage_path;
      let error = generation.error;
      
      if (predictionStatus.status === 'succeeded') {
        console.log('[API] [Try-On] Prediction succeeded, processing output');
        newStatus = 'completed';
        progress = 100;
        
      // Log the complete output structure for debugging
      console.log('[API] [Try-On] Processing prediction output', {
        outputType: typeof predictionStatus.output,
        outputValue: JSON.stringify(predictionStatus.output).substring(0, 200)
      });
      
      // Extract the image URL from the output, handling different possible formats
      let imageUrl = null;
      
      if (predictionStatus.output) {
        // Case 1: Output is a string URL
        if (typeof predictionStatus.output === 'string') {
          imageUrl = predictionStatus.output;
        }
        // Case 2: Output is an array of URLs
        else if (Array.isArray(predictionStatus.output) && predictionStatus.output.length > 0) {
          imageUrl = predictionStatus.output[0];
        }
        // Case 3: Output is an object with a specific property
        else if (typeof predictionStatus.output === 'object') {
          // Try common property names that might contain the URL
          const possibleProps = ['image', 'url', 'output', 'result', 'generated_image'];
          for (const prop of possibleProps) {
            if (predictionStatus.output[prop]) {
              if (typeof predictionStatus.output[prop] === 'string') {
                imageUrl = predictionStatus.output[prop];
                break;
              } else if (Array.isArray(predictionStatus.output[prop]) && predictionStatus.output[prop].length > 0) {
                imageUrl = predictionStatus.output[prop][0];
                break;
              }
            }
          }
        }
      }
      
      if (imageUrl) {
        console.log('[API] [Try-On] Found image URL in output', { imageUrl });
        
        console.log('[API] [Try-On] Downloading output image', { imageUrl });
        
        try {
          // Download the image
          const imageResponse = await fetch(imageUrl);
          const imageBlob = await imageResponse.blob();
          const imageFile = new File([imageBlob], `try-on-${generationId}.png`, { type: 'image/png' });
          
          // Generate a unique filename and upload to Supabase
          const filename = generateUniqueFilename(imageFile.name, 'try-on');
          storagePath = `${generationId}/${filename}`;
          
          console.log('[API] [Try-On] Uploading image to storage', { storagePath });
          
          const { error: uploadError } = await uploadImage('try-on-images', storagePath, imageFile);
          
          if (uploadError) {
            console.log('[API] [Try-On] Upload failed', { error: uploadError.message });
            console.error('Error uploading try-on result image:', uploadError);
            
            // Check if it's a bucket-related error
            if (uploadError.message && (
                uploadError.message.includes('bucket') || 
                uploadError.message.includes('does not exist')
              )) {
              newStatus = 'failed';
              error = `Storage configuration issue: ${uploadError.message}. Please ensure the "try-on-images" bucket exists in your Supabase project.`;
            } else {
              newStatus = 'failed';
              error = `Failed to store the generated image: ${uploadError.message}`;
            }
          }
        } catch (downloadError) {
          console.error('[API] [Try-On] Error downloading or processing image:', downloadError);
          newStatus = 'failed';
          error = 'Failed to download or process the generated image';
        }
        } else {
          newStatus = 'failed';
          error = `No output image received from the API. Output format: ${typeof predictionStatus.output}`;
        }
      } else if (predictionStatus.status === 'failed') {
        newStatus = 'failed';
        error = predictionStatus.error || 'Generation failed';
      } else {
        // Still processing, estimate progress
        progress = predictionStatus.status === 'processing' ? 50 : 25;
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
        imageUrl: newStatus === 'completed' ? await getImageUrl('try-on-images', storagePath) : undefined,
        error
      });
      
      // Get the image URL if the generation is completed
      let imageUrl = undefined;
      if (newStatus === 'completed' && storagePath) {
        imageUrl = await getImageUrl('try-on-images', storagePath);
        
        // Log whether we got a URL
        console.log('[API] [Try-On] Image URL retrieval', { 
          hasImageUrl: !!imageUrl,
          storagePath
        });
        
        // If we couldn't get an image URL but the generation is completed, add a warning
        if (!imageUrl) {
          console.warn('[API] [Try-On] Could not retrieve image URL for completed generation', {
            generationId,
            storagePath
          });
          
          // Create a direct public URL as a last resort
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (supabaseUrl) {
            imageUrl = `${supabaseUrl}/storage/v1/object/public/try-on-images/${storagePath}`;
            console.log('[API] [Try-On] Created direct public URL as fallback', { imageUrl });
          }
        }
      }
      
      // Return the current status with debug info
      const status = {
        id: generationId,
        status: newStatus,
        progress,
        imageUrl,
        error,
        debug: {
          predictionId: generation.external_id,
          storagePath,
          bucketName: 'try-on-images',
          metadata: generation.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      
      console.log('[API] [Try-On] Status response sent', { 
        id: generationId,
        status: newStatus,
        progress,
        hasImageUrl: newStatus === 'completed',
        error
      });
      
      return corsNextResponse(status);
    } catch (error) {
      console.error('Error checking prediction status:', error);
      
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
