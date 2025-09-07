// app/api/process-pdf/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parsePDF } from '@/lib/pdf-parser';
import { PineconeStore } from '@langchain/pinecone';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';  // New import for HF
import { pineconeIndex } from '@/lib/pinecone';

export async function POST(request: Request) {
  console.log('Processing PDF request received');
  
  try {
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { filePath } = requestBody;
    console.log('File path:', filePath);

    if (!filePath) {
      return NextResponse.json({ error: 'Missing filePath' }, { status: 400 });
    }

    // Fetch PDF from Supabase
    console.log('Fetching PDF from Supabase...');
    const { data, error } = await supabase.storage
      .from('bots')
      .download(filePath);

    if (error || !data) {
      console.error('Supabase download error:', error);
      return NextResponse.json({ error: 'Failed to download PDF' }, { status: 500 });
    }

    // Convert Blob to ArrayBuffer
    console.log('Converting Blob to ArrayBuffer...');
    const pdfArrayBuffer = await data.arrayBuffer();
    console.log('ArrayBuffer size:', pdfArrayBuffer.byteLength);

    // Parse PDF to text (unchanged)
    console.log('Parsing PDF...');
    const text = await parsePDF(pdfArrayBuffer);
    console.log('PDF parsed successfully, text length:', text.length);

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text content found in PDF' }, { status: 500 });
    }

    // Split text into chunks (line-based, as before; consider semantic chunking later)
    console.log('Splitting text into chunks...');
    const chunks = text.split('\n').filter(chunk => chunk.trim().length > 0);
    console.log('Number of chunks:', chunks.length);

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No valid chunks extracted' }, { status: 500 });
    }

    // Generate embeddings with Hugging Face (new)
    console.log('Generating embeddings with Hugging Face...');
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,  // From .env.local
      model: 'sentence-transformers/all-mpnet-base-v2',  // 768 dim; swap to 'all-MiniLM-L6-v2' for 384 dim if preferred
      maxRetries: 3,  // Basic retry for any rate limits (HF free tier is generous)
    });

    // Test a single embedding to verify setup (optional debug)
    try {
      const testEmbedding = await embeddings.embedQuery(chunks[0].substring(0, 500));  // First 500 chars
      console.log('Test embedding generated, length:', testEmbedding.length);  // Should log 768 for mpnet
    } catch (testError) {
      console.error('HF embedding test failed:', testError);
      return NextResponse.json({ error: 'HF embedding setup failed - check API key and model' }, { status: 500 });
    }

    // Initialize PineconeStore
    console.log('Initializing PineconeStore...');
    const store = new PineconeStore(embeddings, {
      pineconeIndex,
      namespace: 'pdf-embeddings',  // Per-bot namespace in future; for now, global for testing
    });

    // Store embeddings in Pinecone
    console.log('Storing embeddings in Pinecone...');
    await store.addDocuments(
      chunks.map((chunk, index) => ({
        pageContent: chunk,
        metadata: { 
          filePath, 
          chunkIndex: index,
          source: 'StemBot PDF'  // Optional: Add for filtering
        },
      }))
    );

    console.log('PDF processing completed successfully');
    return NextResponse.json({ 
      message: 'PDF processed and embeddings stored', 
      details: { chunks: chunks.length, embeddingModel: 'all-mpnet-base-v2' } 
    });

  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'PDF processing API is running (HF Embeddings)',
    usage: 'Send a POST request with { "filePath": "your-file.pdf" }',
    note: 'Ensure Pinecone index dimension matches model (768 for all-mpnet-base-v2)'
  });
}