import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { User } from '@supabase/supabase-js';

export interface UploadResult {
  success: boolean;
  data?: { path: string };
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
  pdfInfo?: PDFInfo // Use the proper type from pdf-utils
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabaseClient = createSupabaseBrowserClient();
    
    // Use a proper interface for the insert data
    interface InsertData {
      name: string;
      file_name: string;
      file_url: string;
      user_id: string;
      created_at: string;
      page_count?: number;
    }
    
    const insertData: InsertData = {
      name: botName,
      file_name: fileName,
      file_url: fileUrl,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    
    // Only add page_count if it exists in your database schema
    if (pdfInfo?.pageCount) {
      insertData.page_count = pdfInfo.pageCount;
    }

    const { error } = await supabaseClient
      .from('bots')
      .insert(insertData);

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

// Add the PDFInfo interface if needed (or import from pdf-utils)
interface PDFInfo {
  pageCount: number;
  firstPageText: string;
  metadata?: Record<string, unknown>;
}