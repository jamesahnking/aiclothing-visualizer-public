import { z } from 'zod';

/**
 * Schema for model image upload
 */
export const ModelImageSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => ['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type),
    { message: 'File must be a JPEG, PNG, or SVG image' }
  ),
  name: z.string().min(1, { message: 'Name is required' }),
});

export type ModelImage = z.infer<typeof ModelImageSchema>;

/**
 * Schema for clothing image upload
 */
export const ClothingImageSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => ['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type),
    { message: 'File must be a JPEG, PNG, or SVG image' }
  ),
  name: z.string().min(1, { message: 'Name is required' }),
  type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'accessory'], {
    errorMap: () => ({ message: 'Please select a valid clothing type' }),
  }),
});

export type ClothingImage = z.infer<typeof ClothingImageSchema>;

/**
 * Schema for scene image upload
 */
export const SceneImageSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => ['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type),
    { message: 'File must be a JPEG, PNG, or SVG image' }
  ),
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
});

export type SceneImage = z.infer<typeof SceneImageSchema>;

/**
 * Schema for try-on generation request
 */
export const TryOnRequestSchema = z.object({
  // Base64 image data (required)
  modelImageBase64: z.string().min(1, { message: 'Model image data is required' }),
  clothingImageBase64: z.string().min(1, { message: 'Clothing image data is required' }),
  
  // Original image IDs (optional, for reference and storage)
  modelImageId: z.string().optional(),
  clothingImageId: z.string().optional(),
  
  // Prompt for the try-on generation (required)
  prompt: z.string().min(5, { message: 'Please provide a descriptive prompt (at least 5 characters)' })
    .max(1000, { message: 'Prompt is too long (maximum 1000 characters)' })
    .default("A person wearing clothing"),
});

export type TryOnRequest = z.infer<typeof TryOnRequestSchema>;

/**
 * Schema for composite generation request
 */
export const CompositeRequestSchema = z.object({
  // Base64 image data (required)
  // Renamed from tryOnImageBase64 to figureImageBase64 to reflect that any image can be used
  figureImageBase64: z.string().min(1, { message: 'Figure image data is required' }),
  sceneImageBase64: z.string().min(1, { message: 'Scene image data is required' }),
  
  // Original image IDs (optional, for reference and storage)
  figureImageId: z.string().optional(),
  sceneImageId: z.string().optional(),
  
  prompt: z.string().min(10, { message: 'Please provide a detailed prompt (at least 10 characters)' })
    .max(1000, { message: 'Prompt is too long (maximum 1000 characters)' }),
});

export type CompositeRequest = z.infer<typeof CompositeRequestSchema>;

/**
 * Schema for generation result
 */
export const GenerationResultSchema = z.object({
  id: z.string(),
  type: z.enum(['try-on', 'composite']),
  imageUrl: z.string().url(),
  createdAt: z.date(),
  inputs: z.record(z.unknown()),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  error: z.string().optional(),
});

export type GenerationResult = z.infer<typeof GenerationResultSchema>;

/**
 * Schema for user profile
 */
export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.date(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;


/**
 * Fashion Types
 * 
 * Fashion-related data structures.
 */

/**
 * Image type enum
 */
export type ImageType = 'model' | 'scene' | 'clothing' | 'figure' | 'result' | 'generated';

/**
 * Generation prompt status
 */
export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';

/**
 * Image file interface
 */
export interface ImageFile {
  id: string;
  file: File;
  url: string;
  type: ImageType;
  name: string;
}
