import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { User } from '@supabase/supabase-js';

export interface UploadResult {
  success: boolean;
  data?: { path: string };
  error?: string;
  publicUrl?: string;
}

export interface SaveResult {
  success: boolean;
  data?: { id: string };
  error?: string;
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
  filePath: string,
  fileUrl: string,
  userId: string,
  pdfInfo: {
    pageCount: number;
    firstPageText: string;
    metadata?: any;
    fileSize?: number;
  },
  botId: string // Initial botId (can be empty)
): Promise<SaveResult> => {
  try {
    const supabaseClient = createSupabaseBrowserClient();
    
    // Perform initial insert without setting id explicitly
    const { data, error } = await supabaseClient
      .from('bots')
      .insert({
        name: botName,
        file_name: filePath,
        file_url: fileUrl,
        user_id: userId,
        page_count: pdfInfo.pageCount,
        file_size: pdfInfo.fileSize || null,
        first_page_text: pdfInfo.firstPageText.substring(0, 500),
        parsed_at: new Date().toISOString(),
        // Use botId if provided, otherwise rely on returned data.id
        pinecone_namespace: botId ? `bot-${botId}` : undefined,
        metadata: {
          originalFileName: pdfInfo.metadata?.fileName || '',
          uploadDate: new Date().toISOString(),
          ...(pdfInfo.metadata && {
            pdfTitle: pdfInfo.metadata.title,
            pdfAuthor: pdfInfo.metadata.author,
            pdfSubject: pdfInfo.metadata.subject,
          })
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving bot to database:', error);
      return { success: false, error: error.message };
    }

    // Update with correct botId-based namespace if not provided initially
    if (!botId && data.id) {
      const { error: updateError } = await supabaseClient
        .from('bots')
        .update({ pinecone_namespace: `bot-${data.id}` })
        .eq('id', data.id);
      if (updateError) {
        console.warn('Failed to update pinecone_namespace:', updateError);
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception saving bot to database:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};