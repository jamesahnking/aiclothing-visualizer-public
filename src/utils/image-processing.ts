/**
 * Image processing utilities for the AI Clothing Visualizer
 */

/**
 * Validate image dimensions
 * 
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param minWidth - Minimum allowed width
 * @param minHeight - Minimum allowed height
 * @param maxWidth - Maximum allowed width
 * @param maxHeight - Maximum allowed height
 * @returns Object with validation result and error message if invalid
 */
export function validateImageDimensions(
  width: number,
  height: number,
  minWidth = 256,
  minHeight = 256,
  maxWidth = 4096,
  maxHeight = 4096
): { valid: boolean; error?: string } {
  if (width < minWidth || height < minHeight) {
    return {
      valid: false,
      error: `Image dimensions too small. Minimum size is ${minWidth}x${minHeight} pixels.`
    };
  }
  
  if (width > maxWidth || height > maxHeight) {
    return {
      valid: false,
      error: `Image dimensions too large. Maximum size is ${maxWidth}x${maxHeight} pixels.`
    };
  }
  
  return { valid: true };
}

/**
 * Validate image file size
 * 
 * @param fileSize - File size in bytes
 * @param maxSizeInMB - Maximum allowed size in MB
 * @returns Object with validation result and error message if invalid
 */
export function validateImageFileSize(
  fileSize: number,
  maxSizeInMB = 10
): { valid: boolean; error?: string } {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
  if (fileSize > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${maxSizeInMB}MB.`
    };
  }
  
  return { valid: true };
}

/**
 * Get image dimensions from a File object
 * 
 * @param file - Image file
 * @returns Promise with image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a unique filename for an uploaded image
 * 
 * @param originalFilename - Original filename
 * @param _prefix - Prefix parameter kept for backward compatibility (no longer used)
 * @returns Unique filename
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateUniqueFilename(originalFilename: string, _prefix = ''): string {
  const extension = originalFilename.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  
  // Removed prefix to avoid path inconsistencies
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Extract metadata from an image file
 * 
 * @param file - Image file
 * @returns Promise with image metadata
 */
export async function extractImageMetadata(file: File): Promise<{
  dimensions: { width: number; height: number };
  size: number;
  type: string;
  lastModified: number;
}> {
  const dimensions = await getImageDimensions(file);
  
  return {
    dimensions,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  };
}

/**
 * Validate an image file for use with the AI services
 * 
 * @param file - Image file to validate
 * @param options - Validation options
 * @returns Promise with validation result and error message if invalid
 */
export async function validateImageForAI(
  file: File,
  options = {
    minWidth: 256,
    minHeight: 256,
    maxWidth: 4096,
    maxHeight: 4096,
    maxSizeInMB: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/svg+xml']
  }
): Promise<{ valid: boolean; error?: string }> {
  // Check file type
  if (!options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${options.allowedTypes.join(', ')}`
    };
  }
  
  // Check file size
  const sizeValidation = validateImageFileSize(file.size, options.maxSizeInMB);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }
  
  // Check dimensions
  try {
    const dimensions = await getImageDimensions(file);
    const dimensionValidation = validateImageDimensions(
      dimensions.width,
      dimensions.height,
      options.minWidth,
      options.minHeight,
      options.maxWidth,
      options.maxHeight
    );
    
    if (!dimensionValidation.valid) {
      return dimensionValidation;
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Error validating image dimensions:', error);
    return {
      valid: false,
      error: 'Failed to validate image dimensions'
    };
  }
}
