// app/api/process-pdf/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parsePDF } from '@/lib/pdf-parser';
import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
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

    // Parse PDF to text
    console.log('Parsing PDF...');
    const text = await parsePDF(pdfArrayBuffer);
    console.log('PDF parsed successfully, text length:', text.length);

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text content found in PDF' }, { status: 500 });
    }

    // Split text into chunks
    console.log('Splitting text into chunks...');
    const chunks = text.split('\n').filter(chunk => chunk.trim().length > 0);
    console.log('Number of chunks:', chunks.length);

    // Generate embeddings
    console.log('Generating embeddings...');
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'text-embedding-ada-002',
    });

    // Initialize PineconeStore
    console.log('Initializing PineconeStore...');
    const store = new PineconeStore(embeddings, {
      pineconeIndex,
      namespace: 'pdf-embeddings',
    });

    // Store embeddings in Pinecone
    console.log('Storing embeddings in Pinecone...');
    await store.addDocuments(
      chunks.map((chunk, index) => ({
        pageContent: chunk,
        metadata: { filePath, chunkIndex: index },
      }))
    );

    console.log('PDF processing completed successfully');
    return NextResponse.json({ message: 'PDF processed and embeddings stored' });

  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'PDF processing API is running',
    usage: 'Send a POST request with { "filePath": "your-file.pdf" }'
  });
}