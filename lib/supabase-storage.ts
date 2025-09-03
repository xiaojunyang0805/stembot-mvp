import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { User } from '@supabase/supabase-js';

export interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
  publicUrl?: string;
}

export const uploadPDFToStorage = async (
  file: File, 
  user: User, 
  botName: string
): Promise<UploadResult> => {
  try {
    const supabaseClient = createSupabaseBrowserClient();
    
    // Generate unique file name
    const timestamp = Date.now();
    const safeBotName = botName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${user.id}/${safeBotName}_${timestamp}.pdf`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('bots')
      .upload(fileName, file, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      return { 
        success: false, 
        error: `Upload failed: ${uploadError.message}` 
      };
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('bots')
      .getPublicUrl(fileName);

    return {
      success: true,
      data: uploadData,
      publicUrl: urlData.publicUrl
    };
    
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

export const saveBotToDatabase = async (
  botName: string,
  fileName: string,
  fileUrl: string,
  userId: string,
  pdfInfo?: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabaseClient = createSupabaseBrowserClient();
    
    const { error } = await supabaseClient
      .from('bots')
      .insert({
        name: botName,
        file_name: fileName,
        file_url: fileUrl,
        user_id: userId,
        page_count: pdfInfo?.pageCount,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Database error:', error);
      return { 
        success: false, 
        error: `Database error: ${error.message}` 
      };
    }

    return { success: true };
    
  } catch (error) {
    console.error('Database save error:', error);
    return { 
      success: false, 
      error: `Database save failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};