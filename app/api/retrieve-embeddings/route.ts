// app/api/retrieve-embeddings/route.ts
import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Define the index name directly as a fallback
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'stembot-vectors-hf';

export async function POST(request: Request) {
  try {
    const { query, botId } = await request.json();
    
    if (!query || !botId) {
      return NextResponse.json({ error: 'Missing query or botId' }, { status: 400 });
    }

    // Initialize Hugging Face embeddings
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: "sentence-transformers/all-mpnet-base-v2",
    });

    // Get the Pinecone index
    const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);
    
    // Initialize the vector store with Hugging Face embeddings
    // Use the correct namespace "pdf-embeddings" instead of bot-${botId}
    let vectorStore;
    try {
      vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        namespace: "pdf-embeddings", // Fixed namespace
      });
    } catch (initError) {
      console.error('Vector store initialization error:', initError);
      const errorMessage = initError instanceof Error ? initError.message : 'Unknown initialization error';
      return NextResponse.json({ 
        error: 'Failed to initialize vector store',
        details: errorMessage
      }, { status: 500 });
    }

    // Perform similarity search with additional error handling
    let results;
    try {
      results = await vectorStore.similaritySearch(query, 5);
    } catch (searchError) {
      console.error('Similarity search error:', searchError);
      
      let errorMessage = 'Unknown search error';
      let errorStatus = 500;
      
      if (searchError instanceof Error) {
        errorMessage = searchError.message;
        
        // Check if it's a namespace issue
        if (searchError.message.includes('namespace')) {
          errorMessage = `Namespace 'pdf-embeddings' does not exist or is empty`;
          errorStatus = 404;
        }
      }
      
      return NextResponse.json({ 
        error: 'Similarity search failed',
        details: errorMessage
      }, { status: errorStatus });
    }

    return NextResponse.json({ 
      success: true,
      results: results.map(r => ({
        text: r.pageContent,
        metadata: r.metadata,
      }))
    });
    
  } catch (error) {
    console.error('Retrieval error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 });
  }
}