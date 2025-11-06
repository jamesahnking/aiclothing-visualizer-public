/**
 * API Test Script
 * 
 * This script provides functions to test the API endpoints for try-on and composite generation.
 * It can be used to verify that the API clients are working correctly with the actual API services.
 */

/**
 * Test the try-on generation API
 * 
 * @param modelImageId - ID of the model image
 * @param clothingImageId - ID of the clothing image
 * @returns Promise with the generation ID and status
 */
export async function testTryOnGeneration(
  modelImageId: string,
  clothingImageId: string
): Promise<{ id: string; status: string }> {
  try {
    console.log('Testing try-on generation API...');
    console.log(`Model Image ID: ${modelImageId}`);
    console.log(`Clothing Image ID: ${clothingImageId}`);
    
    // Call the API
    const response = await fetch('/api/generate-try-on', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelImageId,
        clothingImageId,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Try-on generation initiated:', data);
    
    return {
      id: data.id,
      status: data.status,
    };
  } catch (error) {
    console.error('Error testing try-on generation:', error);
    throw error;
  }
}

/**
 * Check the status of a try-on generation
 * 
 * @param generationId - ID of the generation to check
 * @returns Promise with the generation status
 */
export async function checkTryOnStatus(
  generationId: string
): Promise<{
  id: string;
  status: string;
  progress?: number;
  imageUrl?: string;
  error?: string;
}> {
  try {
    console.log(`Checking try-on generation status for ID: ${generationId}`);
    
    // Call the API
    const response = await fetch(`/api/generate-try-on?id=${generationId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Try-on generation status:', data);
    
    return data;
  } catch (error) {
    console.error('Error checking try-on status:', error);
    throw error;
  }
}

/**
 * Test the composite generation API
 * 
 * @param tryOnImageId - ID of the try-on image
 * @param sceneImageId - ID of the scene image
 * @param prompt - Descriptive prompt for the composition
 * @returns Promise with the generation ID and status
 */
export async function testCompositeGeneration(
  tryOnImageId: string,
  sceneImageId: string,
  prompt: string
): Promise<{ id: string; status: string }> {
  try {
    console.log('Testing composite generation API...');
    console.log(`Try-On Image ID: ${tryOnImageId}`);
    console.log(`Scene Image ID: ${sceneImageId}`);
    console.log(`Prompt: ${prompt}`);
    
    // Call the API
    const response = await fetch('/api/generate-composite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tryOnImageId,
        sceneImageId,
        prompt,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Composite generation initiated:', data);
    
    return {
      id: data.id,
      status: data.status,
    };
  } catch (error) {
    console.error('Error testing composite generation:', error);
    throw error;
  }
}

/**
 * Check the status of a composite generation
 * 
 * @param generationId - ID of the generation to check
 * @returns Promise with the generation status
 */
export async function checkCompositeStatus(
  generationId: string
): Promise<{
  id: string;
  status: string;
  progress?: number;
  imageUrl?: string;
  error?: string;
}> {
  try {
    console.log(`Checking composite generation status for ID: ${generationId}`);
    
    // Call the API
    const response = await fetch(`/api/generate-composite?id=${generationId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Composite generation status:', data);
    
    return data;
  } catch (error) {
    console.error('Error checking composite status:', error);
    throw error;
  }
}

/**
 * Poll for generation status until completed or failed
 * 
 * @param generationId - ID of the generation to poll
 * @param checkStatusFn - Function to check the status
 * @param maxAttempts - Maximum number of polling attempts
 * @param interval - Polling interval in milliseconds
 * @returns Promise with the final generation status
 */
export async function pollGenerationStatus<T extends { status: string }>(
  generationId: string,
  checkStatusFn: (id: string) => Promise<T>,
  maxAttempts = 30,
  interval = 2000
): Promise<T> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const status = await checkStatusFn(generationId);
    
    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }
    
    attempts++;
    console.log(`Polling attempt ${attempts}/${maxAttempts}. Status: ${status.status}`);
    
    // Wait for the specified interval
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Generation did not complete after ${maxAttempts} polling attempts`);
}

/**
 * Run a complete try-on and composite generation test
 * 
 * @param modelImageId - ID of the model image
 * @param clothingImageId - ID of the clothing image
 * @param sceneImageId - ID of the scene image
 * @param prompt - Descriptive prompt for the composition
 * @returns Promise with the final composite generation status
 */
export async function runCompleteTest(
  modelImageId: string,
  clothingImageId: string,
  sceneImageId: string,
  prompt: string
): Promise<{
  tryOnResult: {
    id: string;
    status: string;
    progress?: number;
    imageUrl?: string;
    error?: string;
  };
  compositeResult?: {
    id: string;
    status: string;
    progress?: number;
    imageUrl?: string;
    error?: string;
  };
}> {
  try {
    console.log('Starting complete test...');
    
    // Step 1: Generate try-on image
    const tryOnGeneration = await testTryOnGeneration(modelImageId, clothingImageId);
    
    // Step 2: Poll for try-on completion
    const tryOnResult = await pollGenerationStatus(
      tryOnGeneration.id,
      checkTryOnStatus
    );
    
    // If try-on failed, return the result
    if (tryOnResult.status === 'failed') {
      return { tryOnResult };
    }
    
    // Step 3: Generate composite image
    const compositeGeneration = await testCompositeGeneration(
      tryOnGeneration.id,
      sceneImageId,
      prompt
    );
    
    // Step 4: Poll for composite completion
    const compositeResult = await pollGenerationStatus(
      compositeGeneration.id,
      checkCompositeStatus
    );
    
    return {
      tryOnResult,
      compositeResult,
    };
  } catch (error) {
    console.error('Error running complete test:', error);
    throw error;
  }
}
