// app/api/process-pdf/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parsePDF } from '@/lib/pdf-parser';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

// Initialize Pinecone client with debug logging
const apiKey = process.env.PINECONE_API_KEY;
if (!apiKey) {
  console.error('Pinecone API key is missing in environment variables');
  throw new Error('Missing PINECONE_API_KEY environment variable');
}
console.log('Pinecone API key loaded:', apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4));
const pinecone = new Pinecone({
  apiKey: apiKey,
});
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME || 'stembot-vectors-hf');

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
      }, { status: 400 });
    }

    // Split text into chunks
    console.log('Splitting text into chunks...');
    const chunkSize = 1000;
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    console.log('Number of chunks:', chunks.length);

    // Initialize embeddings model
    console.log('Initializing HuggingFace embeddings...');
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: 'sentence-transformers/all-mpnet-base-v2',
    });

    // Initialize Pinecone store
    console.log('Initializing Pinecone store with namespace:', `bot-${botId}`);
    const namespace = `bot-${botId}`;
    const store = new PineconeStore(embeddings, { pineconeIndex, namespace });

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