/**
 * IDM-VTON API Integration
 * 
 * This module provides functions to interact with the IDM-VTON API for virtual try-on.
 * API Endpoint: https://replicate.com/cuuupid/idm-vton
 * Model ID: cuuupid/idm-vton:6d14f9b3d25a9400c4a5e5f0f6842ae7537fefcf68df86dad9533f66204f2bb2
 */

// Check if the API key is defined
const apiKey = process.env.REPLICATE_API_TOKEN;

if (!apiKey) {
  console.warn('Replicate API Token is missing. Please check your .env.local file.');
}

/**
 * Generate a virtual try-on image by superimposing clothing onto a model
 * 
 * @param modelImage - URL or base64 data of the model image
 * @param clothingImage - URL or base64 data of the clothing image
 * @param prompt - Descriptive prompt for the try-on generation
 * @returns Promise with the generated image URL or error
 */
export async function generateTryOn(
  modelImage: string, 
  clothingImage: string, 
  prompt: string = "A person wearing clothing"
) {
  try {
    // Log the request (truncate base64 strings for readability)
    console.log('[IDM-VTON] Sending request', { 
      modelImage: modelImage.startsWith('data:') ? `${modelImage.substring(0, 50)}...` : modelImage,
      clothingImage: clothingImage.startsWith('data:') ? `${clothingImage.substring(0, 50)}...` : clothingImage,
      prompt
    });
    
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '6d14f9b3d25a9400c4a5e5f0f6842ae7537fefcf68df86dad9533f66204f2bb2',
        input: {
          prompt: prompt,
          aspect_ratio: "match_input_image",
          input_image_1: modelImage,
          input_image_2: clothingImage,
          output_format: "png",
          safety_tolerance: 2
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`IDM-VTON API error: ${errorData.detail || response.statusText}`);
    }

    const prediction = await response.json();
    
    console.log('[IDM-VTON] Response received', { predictionId: prediction.id });
    
    // Return the prediction ID for polling
    return { id: prediction.id };
  } catch (error) {
    console.log('[IDM-VTON] Error in generateTryOn', error);
    console.error('Error generating try-on image:', error);
    throw error;
  }
}

/**
 * Check the status of a prediction and get the result when complete
 * 
 * @param predictionId - ID of the prediction to check
 * @returns Promise with the prediction status and result
 */
export async function checkPredictionStatus(predictionId: string) {
  try {
    console.log('[IDM-VTON] Checking prediction status', { predictionId });
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`IDM-VTON API error: ${errorData.detail || response.statusText}`);
    }

    const prediction = await response.json();
    
    console.log('[IDM-VTON] Prediction status received', { 
      predictionId,
      status: prediction.status,
      hasOutput: !!prediction.output,
      error: prediction.error,
      outputType: prediction.output ? typeof prediction.output : 'undefined',
      outputDetails: prediction.output ? JSON.stringify(prediction.output).substring(0, 200) : 'none'
    });
    
    return {
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
    };
  } catch (error) {
    console.log('[IDM-VTON] Error checking prediction status', error);
    console.error('Error checking prediction status:', error);
    throw error;
  }
}
