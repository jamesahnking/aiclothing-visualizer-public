import { createClient } from '@supabase/supabase-js';

// Check if the required environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anonymous Key is missing. Please check your .env.local file.'
  );
}

// Add initialization logging
console.log('[Supabase] Initializing client', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseAnonKey 
});

// Create a Supabase client with authentication configuration
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);

// Generate a public URL for an object
function getPublicUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

// Helper function to get a signed URL for an image
export async function getImageUrl(bucket: string, path: string) {
  console.log('[Supabase] Getting image URL', { bucket, path });
  
  try {
    // First try to get a signed URL
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60); // 1 hour expiry
    
    if (error) {
      console.error('[Supabase] Error getting signed URL:', error);
      
      // Check if it's a CORS-related error
      if (error.message && (
          error.message.includes('CORS') || 
          error.message.includes('cross-origin') ||
          error.message.includes('access-control')
        )) {
        console.error('[Supabase] Possible CORS issue. Check Supabase CORS configuration.');
      }
      
      // Check if it's an authentication-related error
      if (error.message && (
          error.message.includes('auth') || 
          error.message.includes('permission') ||
          error.message.includes('not allowed')
        )) {
        console.error('[Supabase] Possible authentication issue. Make sure the user is authenticated and has permission to access this bucket.');
      }
      
      // Fall back to public URL
      console.log('[Supabase] Signed URL failed, falling back to public URL', { error: error.message });
      const publicUrl = getPublicUrl(bucket, path);
      console.log('[Supabase] Generated public URL', { 
        bucket, 
        path,
        publicUrl: publicUrl.substring(0, 50) + '...' // Log partial URL for debugging
      });
      return publicUrl;
    }
    
    console.log('[Supabase] Signed URL created successfully', { 
      bucket, 
      path, 
      hasUrl: !!data.signedUrl,
      signedUrl: data.signedUrl.substring(0, 50) + '...' // Log partial URL for debugging
    });
    
    return data.signedUrl;
  } catch (e) {
    console.error('[Supabase] Exception in getImageUrl:', e);
    
    // Fall back to public URL in case of exception
    const publicUrl = getPublicUrl(bucket, path);
    console.log('[Supabase] Generated public URL after exception', { 
      bucket, 
      path,
      publicUrl: publicUrl.substring(0, 50) + '...' // Log partial URL for debugging
    });
    return publicUrl;
  }
}

// Helper function to upload an image
export async function uploadImage(bucket: string, path: string, file: File) {
  console.log('[Supabase] Uploading image', { 
    bucket, 
    path, 
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });
  
  try {
    // Skip bucket existence check as it may not work correctly with certain permission setups
    // Directly attempt the upload and handle any errors that occur
    console.log('[Supabase] Attempting to upload file to bucket:', bucket);
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    
    if (error) {
      // Check if the error is related to bucket not existing
      if (error.message && (
          error.message.includes('bucket') || 
          error.message.includes('not found') || 
          error.message.includes('does not exist')
        )) {
        console.error('[Supabase] Possible bucket issue:', error);
        console.log('[Supabase] Checking if bucket exists:', bucket);
        
        // Try to list buckets for diagnostic purposes only
        try {
          const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
          if (!bucketsError && buckets) {
            console.log('[Supabase] Available buckets:', buckets.map(b => b.name).join(', '));
          } else {
            console.log('[Supabase] Could not list buckets:', bucketsError);
          }
        } catch (listError) {
          console.log('[Supabase] Error listing buckets:', listError);
        }
        
        return { 
          data: null, 
          error: new Error(`Upload failed. Please ensure the "${bucket}" bucket exists in your Supabase project and has proper permissions.`)
        };
      }
      
      console.error('[Supabase] Error uploading image:', error);
      return { data: null, error };
    }
    
    console.log('[Supabase] Image uploaded successfully', { 
      bucket, 
      path,
      data
    });
    
    return { data, error: null };
  } catch (error) {
    console.error('[Supabase] Unexpected error during upload:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error during upload') };
  }
}

// Helper function to delete an image
export async function deleteImage(bucket: string, path: string) {
  console.log('[Supabase] Deleting image', { bucket, path });
  
  const { data, error } = await supabase.storage.from(bucket).remove([path]);
  
  if (error) {
    console.error('[Supabase] Error deleting image:', error);
    return { data: null, error };
  }
  
  console.log('[Supabase] Image deleted successfully', { bucket, path });
  
  return { data, error: null };
}

// Helper function to list images in a bucket/folder
export async function listImages(bucket: string, folder: string = '') {
  console.log('[Supabase] Listing images', { bucket, folder });
  
  const { data, error } = await supabase.storage.from(bucket).list(folder);
  
  if (error) {
    console.error('[Supabase] Error listing images:', error);
    return { data: null, error };
  }
  
  console.log('[Supabase] Images listed successfully', { 
    bucket, 
    folder, 
    count: data.length 
  });
  
  return { data, error: null };
}
