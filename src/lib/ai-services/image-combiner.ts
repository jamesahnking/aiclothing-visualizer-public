/**
 * AI Image Combiner API Integration
 * 
 * This module provides functions to interact with the AI Image Combiner API for compositing images.
 * API Endpoint: https://prod.api.market/api/v1/magicapi/ai-image-combiner-api
 * Documentation: https://api.market/store/magicapi/ai-image-combiner-api
 */

import { generateId } from '@/utils/helpers';
import { uploadImage, getImageUrl, deleteImage } from '@/lib/supabase/client';

// Check if the API key is defined
const apiKey = process.env.NEXT_PUBLIC_API_MARKET_KEY;
const baseUrl = "https://prod.api.market/api/v1/magicapi/ai-image-combiner-api";
const API_VERSION = "6d14f9b3d25a9400c4a5e5f0f6842ae7537fefcf68df86dad9533f66204f2bb2";

// Constants for polling
const MAX_TIMEOUT = 600000; // 600 seconds (10 minutes)
const POLL_INTERVAL = 2000; // 2 seconds

if (!apiKey) {
  console.warn('API Market Key is missing. Please check your .env.local file for NEXT_PUBLIC_API_MARKET_KEY.');
}

/**
 * Helper function to create a delay
 * @param ms - Milliseconds to delay
 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert base64 string to a File object
 * @param base64String - Base64 encoded image data
 * @param filename - Name for the file
 * @returns Promise with the File object
 */
async function base64ToFile(base64String: string, filename: string): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      // Extract the base64 data
      const base64Data = base64String.split(',')[1] || base64String;
      
      // Determine MIME type from the data URL
      let mimeType = 'image/jpeg';
      if (base64String.startsWith('data:')) {
        mimeType = base64String.split(';')[0].split(':')[1];
      }
      
      // Convert base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create Blob and File
      const blob = new Blob([bytes], { type: mimeType });
      const file = new File([blob], filename, { type: mimeType });
      
      resolve(file);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Upload images to Supabase and get public URLs
 * @param modelImage - Base64 encoded model image
 * @param sceneImage - Base64 encoded scene image
 * @returns Promise with the public URLs
 */
async function uploadImagesToSupabase(modelImage: string, sceneImage: string) {
  console.log('[Image-Combiner] Uploading images to Supabase');
  
  const tempId = generateId();
  const modelPath = `temp/${tempId}-model.jpg`;
  const scenePath = `temp/${tempId}-scene.jpg`;
  
  try {
    // Convert base64 to File objects
    const modelFile = await base64ToFile(modelImage, 'model-image.jpg');
    const sceneFile = await base64ToFile(sceneImage, 'scene-image.jpg');
    
    // Upload to Supabase
    const modelUpload = await uploadImage('temp-bucket', modelPath, modelFile);
    const sceneUpload = await uploadImage('temp-bucket', scenePath, sceneFile);
    
    if (modelUpload.error) {
      throw new Error(`Failed to upload model image: ${modelUpload.error.message}`);
    }
    
    if (sceneUpload.error) {
      throw new Error(`Failed to upload scene image: ${sceneUpload.error.message}`);
    }
    
    // Get public URLs
    const modelUrl = await getImageUrl('temp-bucket', modelPath);
    const sceneUrl = await getImageUrl('temp-bucket', scenePath);
    
    console.log('[Image-Combiner] Images uploaded successfully', { 
      modelPath, 
      scenePath,
      hasModelUrl: !!modelUrl,
      hasSceneUrl: !!sceneUrl
    });
    
    return { 
      modelUrl, 
      sceneUrl,
      paths: { modelPath, scenePath }
    };
  } catch (error) {
    console.error('[Image-Combiner] Error uploading images to Supabase:', error);
    throw error;
  }
}

/**
 * Clean up temporary images from Supabase
 * @param paths - Paths of images to delete
 */
async function cleanupTempImages(paths: { modelPath?: string, scenePath?: string }) {
  try {
    if (paths.modelPath) {
      await deleteImage('temp-bucket', paths.modelPath);
    }
    
    if (paths.scenePath) {
      await deleteImage('temp-bucket', paths.scenePath);
    }
    
    console.log('[Image-Combiner] Temporary images cleaned up');
  } catch (error) {
    console.error('[Image-Combiner] Error cleaning up temporary images:', error);
    // Don't throw here, just log the error
  }
}

/**
 * Generate a composite image by combining a figure image with a scene image
 * 
 * @param figureImage - URL or base64 data of the figure image (can be output from IDM-VTON or any other image)
 * @param sceneImage - URL or base64 data of the scene image
 * @param prompt - Descriptive prompt for the composition
 * @param useSupabaseUrls - Whether to upload base64 images to Supabase and use URLs
 * @returns Promise with the generated image URL or error
 */
export async function generateComposite(
  figureImage: string, 
  sceneImage: string, 
  prompt: string,
  useSupabaseUrls: boolean = true
) {
  let tempImagePaths = {};
  
  try {
    // Log the request (truncate base64 strings for readability)
    console.log('[Image-Combiner] Sending request', { 
      figureImage: figureImage.startsWith('data:') ? `${figureImage.substring(0, 50)}...` : figureImage,
      sceneImage: sceneImage.startsWith('data:') ? `${sceneImage.substring(0, 50)}...` : sceneImage,
      prompt,
      hasApiKey: !!apiKey,
      useSupabaseUrls,
      apiEndpoint: `${baseUrl}/predictions`
    });
    
    if (!apiKey) {
      throw new Error('API Market Key is missing. Please check your .env.local file for NEXT_PUBLIC_API_MARKET_KEY.');
    }
    
    // If useSupabaseUrls is true and we have base64 data, upload to Supabase
    let figureImageUrl = figureImage;
    let sceneImageUrl = sceneImage;
    
    if (useSupabaseUrls && (figureImage.startsWith('data:') || sceneImage.startsWith('data:'))) {
      console.log('[Image-Combiner] Converting base64 images to Supabase URLs');
      const { modelUrl, sceneUrl, paths } = await uploadImagesToSupabase(figureImage, sceneImage);
      figureImageUrl = modelUrl;
      sceneImageUrl = sceneUrl;
      tempImagePaths = paths;
      
      console.log('[Image-Combiner] Using Supabase URLs', { 
        figureUrl: figureImageUrl.substring(0, 50) + '...',
        sceneUrl: sceneUrl.substring(0, 50) + '...'
      });
    }
    
    // Prepare input data according to API requirements - using correct parameter names
    const inputData = {
      input_image_1: figureImageUrl,
      input_image_2: sceneImageUrl,
      prompt: prompt,
      negative_prompt: "distorted, blurry, low quality, unrealistic positioning",
      guidance_scale: 7.5,
      num_inference_steps: 30,
    };
    
    console.log('[Image-Combiner] Request body structure', {
      version: API_VERSION,
      inputKeys: Object.keys(inputData)
    });
    
    // Step 1: Create the prediction
    const response = await fetch(`${baseUrl}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-magicapi-key": apiKey
      },
      body: JSON.stringify({
        version: API_VERSION,
        input: inputData
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        // Try to parse as JSON
        errorData = JSON.parse(errorText);
        console.error('[Image-Combiner] API error response:', errorData);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // If not JSON, use the raw text
        console.error('[Image-Combiner] API error response (raw):', errorText);
        throw new Error(`AI Image Combiner API error: ${response.statusText} - ${errorText}`);
      }
      
      throw new Error(`AI Image Combiner API error: ${errorData.message || errorData.error || errorData.title || response.statusText}`);
    }

    const prediction = await response.json();
    const predictionId = prediction.id;
    
    console.log('[Image-Combiner] Prediction created successfully', { 
      predictionId,
      status: prediction.status,
      responseKeys: Object.keys(prediction)
    });
    
    // Step 2: Poll for results
    const result = await pollForResults(predictionId);
    
    // Clean up temporary images
    if (Object.keys(tempImagePaths).length > 0) {
      await cleanupTempImages(tempImagePaths);
    }
    
    return { 
      imageUrl: result,
      jobId: predictionId
    };
  } catch (error) {
    console.log('[Image-Combiner] Error in generateComposite', error);
    console.error('Error generating composite image:', error);
    
    // Clean up temporary images on error
    if (Object.keys(tempImagePaths).length > 0) {
      await cleanupTempImages(tempImagePaths);
    }
    
    throw error;
  }
}

/**
 * Poll for prediction results with timeout
 * 
 * @param predictionId - ID of the prediction to check
 * @returns Promise with the output URL when complete
 */
async function pollForResults(predictionId: string) {
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_TIMEOUT) {
    try {
      console.log('[Image-Combiner] Polling for results', { 
        predictionId, 
        elapsedTime: `${Math.round((Date.now() - startTime) / 1000)}s`,
        endpoint: `${baseUrl}/predictions/${predictionId}`
      });
      
      const response = await fetch(`${baseUrl}/predictions/${predictionId}`, {
        headers: {
          "x-magicapi-key": apiKey as string
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Image-Combiner] Error checking prediction status:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const prediction = await response.json();
      
      console.log('[Image-Combiner] Poll response received', { 
        predictionId,
        status: prediction.status,
        hasOutput: !!prediction.output,
        responseKeys: Object.keys(prediction)
      });

      if (prediction.status === "succeeded") {
        console.log('[Image-Combiner] Prediction succeeded', { 
          output: prediction.output,
          outputType: typeof prediction.output
        });
        return prediction.output;
      }

      if (prediction.status === "failed") {
        throw new Error(`Prediction failed: ${prediction.error || "Unknown error"}`);
      }

      await delay(POLL_INTERVAL);
    } catch (error) {
      console.error('[Image-Combiner] Error during polling:', error);
      throw error;
    }
  }

  throw new Error("Prediction timed out after 10 minutes");
}

/**
 * Check the status of a job and get the result when complete
 * This is a legacy method maintained for backward compatibility
 * 
 * @param jobId - ID of the job to check
 * @returns Promise with the job status and result
 */
export async function checkJobStatus(jobId: string) {
  try {
    console.log('[Image-Combiner] Checking job status', { jobId });
    
    if (!apiKey) {
      throw new Error('API Market Key is missing. Please check your .env.local file for NEXT_PUBLIC_API_MARKET_KEY.');
    }
    
    // API request for status check
    const response = await fetch(`${baseUrl}/predictions/${jobId}`, {
      method: 'GET',
      headers: {
        "x-magicapi-key": apiKey
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        // Try to parse as JSON
        errorData = JSON.parse(errorText);
        console.error('[Image-Combiner] API error response:', errorData);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // If not JSON, use the raw text
        console.error('[Image-Combiner] API error response (raw):', errorText);
        throw new Error(`AI Image Combiner API error: ${response.statusText} - ${errorText}`);
      }
      
      throw new Error(`AI Image Combiner API error: ${errorData.message || errorData.error || response.statusText}`);
    }

    const prediction = await response.json();
    
    console.log('[Image-Combiner] Job status received', { 
      jobId,
      status: prediction.status,
      hasOutput: !!prediction.output,
      error: prediction.error,
      jobKeys: Object.keys(prediction)
    });
    
    return {
      status: prediction.status,
      imageUrl: prediction.output,
      error: prediction.error,
    };
  } catch (error) {
    console.log('[Image-Combiner] Error checking job status', error);
    console.error('Error checking job status:', error);
    throw error;
  }
}
