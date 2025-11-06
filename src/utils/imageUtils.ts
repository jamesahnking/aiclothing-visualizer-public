import { v4 as uuidv4 } from "uuid";
import { ImageFile, ImageType } from "../types/schemas";

export const validateImageFile = (file: File): boolean => {
  // Check if file is an image
  const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('File must be an image (JPEG, PNG, SVG, WEBP, or GIF)');
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 10MB');
  }
  
  return true;
};

export const createImageObject = async (file: File, type: ImageType): Promise<ImageFile> => {
  const id = uuidv4();
  const url = URL.createObjectURL(file);
  
  return {
    id,
    file,
    url,
    type,
    name: file.name,
  };
};

export const getImageTypeLabel = (type: ImageType): string => {
  switch (type) {
    case 'scene':
      return 'Background Scene';
    case 'model':
      return 'Person/Model';
    case 'clothing':
      return 'Clothing Item';
    case 'generated':
      return 'Generated Result';
    default:
      return 'Image';
  }
};

export const downloadImage = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Check if code is running in a browser environment
 * This is useful for functions that should behave differently on client vs server
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Convert a blob URL to a base64 string
 * 
 * This is useful when we need to send an image to an API that can't access blob URLs directly.
 * IMPORTANT: This function can only convert blob URLs in a browser context. Server-side code
 * should never receive blob URLs - they should be converted to base64 on the client before sending.
 * 
 * @param blobUrl The blob URL or base64 string to process
 * @returns Promise resolving to the base64 string representation of the image
 */
export const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
  try {
    // Skip conversion if it's already a data URL
    if (blobUrl.startsWith('data:')) {
      return blobUrl;
    }
    
    // Check if we're in a browser context
    if (!isBrowser()) {
      throw new Error('Cannot convert blob URLs in a server context. Convert to base64 on the client before sending to the server.');
    }
    
    // Check if it's a blob URL
    if (!blobUrl.startsWith('blob:')) {
      // If it's not a blob URL or data URL, it might be a base64 string without the data: prefix
      // Try to return it as is
      return blobUrl;
    }
    
    // Fetch the blob from the URL (only works in browser context)
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    // Convert the blob to a base64 string
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting blob URL to base64:', error);
    throw new Error(`Failed to convert image: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Client-side utility to ensure an image URL is in base64 format before sending to the server
 * 
 * @param imageUrl The image URL (blob URL, data URL, or base64 string)
 * @returns Promise resolving to a base64 string that's safe to send to the server
 */
export const ensureBase64ForServer = async (imageUrl: string): Promise<string> => {
  // Skip if already in data URL format
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // Convert blob URLs to base64
  if (imageUrl.startsWith('blob:')) {
    return await blobUrlToBase64(imageUrl);
  }
  
  // Return as is (might be a base64 string without the data: prefix)
  return imageUrl;
};
