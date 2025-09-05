import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parsePDF } from '@/lib/pdf-parser';
import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { pineconeIndex } from '@/lib/pinecone';

export async function POST(request: Request) {
  try {
    // Get PDF file path from request (e.g., "pdfs/sample.pdf")
    const { filePath } = await request.json();
    if (!filePath) {
      return NextResponse.json({ error: 'Missing filePath' }, { status: 400 });
    }

    // Fetch PDF from Supabase
    const { data, error } = await supabase.storage
      .from('pdfs')
      .download(filePath);
    if (error || !data) {
      return NextResponse.json({ error: 'Failed to download PDF' }, { status: 500 });
    }

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await data.arrayBuffer();

    // Parse PDF to text
    const text = await parsePDF(arrayBuffer);

    // Split text into chunks (e.g., by paragraph)
    const chunks = text.split('\n').filter(chunk => chunk.trim().length > 0);

    // Generate embeddings
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'text-embedding-ada-002',
    });

    // Initialize PineconeStore
    const store = new PineconeStore(embeddings, {
      pineconeIndex,
      namespace: 'pdf-embeddings',
    });

    // Store embeddings in Pinecone
    await store.addDocuments(
      chunks.map((chunk, index) => ({
        pageContent: chunk,
        metadata: { filePath, chunkIndex: index },
      }))
    );

    return NextResponse.json({ message: 'PDF processed and embeddings stored' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}