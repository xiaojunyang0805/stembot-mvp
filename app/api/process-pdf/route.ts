// app/api/process-pdf/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parsePDF } from '@/lib/pdf-parser';
import { PineconeStore } from '@langchain/pinecone';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { pineconeIndex } from '@/lib/pinecone';

export async function POST(request: Request) {
  console.log('Processing PDF request received');
  
  try {
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('Request body:', requestBody);
    } catch (e) {
      console.error('JSON parsing error:', e);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { filePath, botId } = requestBody;
    console.log('File path:', filePath, 'Bot ID:', botId);

    if (!filePath || !botId) {
      console.error('Missing filePath or botId');
      return NextResponse.json({ 
        error: 'Missing filePath or botId' 
      }, { status: 400 });
    }

    // Fetch PDF from Supabase
    console.log('Fetching PDF from Supabase...');
    const { data, error } = await supabase.storage
      .from('bots')
      .download(filePath);

    if (error || !data) {
      console.error('Supabase download error:', error);
      return NextResponse.json({ 
        error: 'Failed to download PDF',
        details: error?.message 
      }, { status: 500 });
    }

    // Convert Blob to ArrayBuffer
    console.log('Converting Blob to ArrayBuffer...');
    const pdfArrayBuffer = await data.arrayBuffer();
    console.log('ArrayBuffer size:', pdfArrayBuffer.byteLength);

    // Parse PDF to text
    console.log('Parsing PDF...');
    let text;
    try {
      text = await parsePDF(pdfArrayBuffer);
      console.log('PDF parsed successfully, text length:', text.length);
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse PDF',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }, { status: 500 });
    }

    if (!text || text.trim().length === 0) {
      console.error('No text content found in PDF');
      return NextResponse.json({ 
        error: 'No text content found in PDF' 
      }, { status: 500 });
    }

    // Split text into chunks
    console.log('Splitting text into chunks...');
    const chunks = text.split('\n').filter(chunk => chunk.trim().length > 0);
    console.log('Number of chunks:', chunks.length);

    if (chunks.length === 0) {
      console.error('No valid chunks extracted');
      return NextResponse.json({ 
        error: 'No valid chunks extracted' 
      }, { status: 500 });
    }

    // Check if HuggingFace API key is available
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.error('HUGGINGFACE_API_KEY is not set');
      return NextResponse.json({ 
        error: 'Hugging Face API key not configured' 
      }, { status: 500 });
    }

    // Generate embeddings with Hugging Face
    console.log('Generating embeddings with Hugging Face...');
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: 'sentence-transformers/all-mpnet-base-v2',
      maxRetries: 3,
    });

    // Test a single embedding to verify setup
    try {
      const testEmbedding = await embeddings.embedQuery(chunks[0].substring(0, 500));
      console.log('Test embedding generated, length:', testEmbedding.length);
    } catch (testError) {
      console.error('HF embedding test failed:', testError);
      return NextResponse.json({ 
        error: 'HF embedding setup failed',
        details: testError instanceof Error ? testError.message : 'Check API key and model'
      }, { status: 500 });
    }

    // Create bot-specific namespace
    const namespace = `bot-${botId}`;
    console.log('Using Pinecone namespace:', namespace);

    // Initialize PineconeStore with bot-specific namespace
    console.log('Initializing PineconeStore...');
    let store;
    try {
      store = new PineconeStore(embeddings, {
        pineconeIndex,
        namespace: namespace,
      });
    } catch (storeError) {
      console.error('PineconeStore initialization error:', storeError);
      return NextResponse.json({ 
        error: 'Failed to initialize Pinecone store',
        details: storeError instanceof Error ? storeError.message : 'Unknown store error'
      }, { status: 500 });
    }

    // Store embeddings in Pinecone
    console.log('Storing embeddings in Pinecone...');
    try {
      await store.addDocuments(
        chunks.map((chunk, index) => ({
          pageContent: chunk,
          metadata: { 
            filePath, 
            chunkIndex: index,
            source: 'StemBot PDF',
            botId: botId
          },
        }))
      );
      console.log('Embeddings stored successfully');
    } catch (addDocumentsError) {
      console.error('Error adding documents to Pinecone:', addDocumentsError);
      return NextResponse.json({ 
        error: 'Failed to store embeddings in Pinecone',
        details: addDocumentsError instanceof Error ? addDocumentsError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Just update the parsed_at timestamp to confirm processing completed
    const { error: updateError } = await supabase
     .from('bots')
     .update({ 
       parsed_at: new Date().toISOString()
      })
      .eq('id', botId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
     // Don't fail the whole process for this non-critical update
    }

    console.log('PDF processing and metadata update completed successfully');
    return NextResponse.json({ 
      message: 'PDF processed and embeddings stored', 
      details: { 
        chunks: chunks.length, 
        embeddingModel: 'all-mpnet-base-v2',
        namespace: namespace,
        botId: botId
      } 
    });

  } catch (error) {
    console.error('Unhandled error in process-pdf:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'PDF processing API is running (HF Embeddings)',
    usage: 'Send a POST request with { "filePath": "your-file.pdf", "botId": "bot-uuid" }',
    note: 'Ensure Pinecone index dimension matches model (768 for all-mpnet-base-v2)'
  });
}