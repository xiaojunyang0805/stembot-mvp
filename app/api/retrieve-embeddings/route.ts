// app/api/retrieve-embeddings/route.ts
import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Constants
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'stembot-vectors-hf';
const EMBEDDING_MODEL = 'sentence-transformers/all-mpnet-base-v2';
const DEFAULT_TOP_K = 5;
const MIN_SCORE_THRESHOLD = 0.5;

// Cache for embeddings model (improves performance)
let embeddings: HuggingFaceInferenceEmbeddings | null = null;

function getEmbeddingsModel(): HuggingFaceInferenceEmbeddings {
  if (!embeddings) {
    embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: EMBEDDING_MODEL,
    });
  }
  return embeddings;
}

// Interface for Pinecone result with score
interface PineconeResultWithScore {
  pageContent: string;
  metadata: {
    score?: number;
    [key: string]: any;
  };
}

export async function POST(request: Request) {
  try {
    const { query, botId, topK = DEFAULT_TOP_K, scoreThreshold } = await request.json();
    
    // Validate required parameters
    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Missing or empty query parameter' }, 
        { status: 400 }
      );
    }

    if (!botId) {
      return NextResponse.json(
        { error: 'Missing botId parameter' }, 
        { status: 400 }
      );
    }

    // Validate topK parameter
    const validatedTopK = Math.min(Math.max(Number(topK), 1), 20);

    // Get embeddings model (with caching)
    const embeddingsModel = getEmbeddingsModel();

    // Get the Pinecone index
    const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);
    
    // Initialize the vector store
    let vectorStore: PineconeStore;
    try {
      vectorStore = await PineconeStore.fromExistingIndex(embeddingsModel, {
        pineconeIndex,
        namespace: "pdf-embeddings",
      });
    } catch (initError) {
      console.error('Vector store initialization error:', initError);
      const errorMessage = initError instanceof Error ? initError.message : 'Unknown initialization error';
      
      return NextResponse.json({ 
        error: 'Failed to initialize vector store',
        details: errorMessage
      }, { status: 500 });
    }

    // Perform similarity search
    let results: PineconeResultWithScore[];
    try {
      // Use type assertion to handle the score in metadata
      results = await vectorStore.similaritySearch(query, validatedTopK) as PineconeResultWithScore[];
    } catch (searchError) {
      console.error('Similarity search error:', searchError);
      
      let errorMessage = 'Unknown search error';
      let errorStatus = 500;
      
      if (searchError instanceof Error) {
        errorMessage = searchError.message;
        
        if (searchError.message.includes('namespace')) {
          errorMessage = `Namespace 'pdf-embeddings' does not exist or is empty`;
          errorStatus = 404;
        } else if (searchError.message.includes('index')) {
          errorMessage = `Pinecone index '${PINECONE_INDEX_NAME}' not found`;
          errorStatus = 404;
        }
      }
      
      return NextResponse.json({ 
        error: 'Similarity search failed',
        details: errorMessage
      }, { status: errorStatus });
    }

    // Format results with score extraction
    const formattedResults = results
      .map(result => {
        // Extract score from metadata or calculate if not available
        let score: number | undefined;
        
        // Check if score exists in metadata (Pinecone native format)
        if (result.metadata.score !== undefined) {
          score = result.metadata.score;
        } 
        // Check for alternative score field names
        else if (result.metadata._score !== undefined) {
          score = result.metadata._score;
        }
        // Check for LangChain-specific score field
        else if ((result as any).score !== undefined) {
          score = (result as any).score;
        }

        return {
          text: result.pageContent,
          metadata: result.metadata,
          score: score,
          // Add confidence level based on score
          confidence: score ? getConfidenceLevel(score) : 'unknown'
        };
      })
      .filter(result => {
        // Apply score threshold if provided and score is available
        if (scoreThreshold !== undefined && result.score !== undefined) {
          return result.score >= scoreThreshold;
        }
        return true;
      })
      // Sort by score descending (highest first)
      .sort((a, b) => {
        if (a.score === undefined) return 1;
        if (b.score === undefined) return -1;
        return b.score - a.score;
      });

    // Calculate average score for analytics
    const scores = formattedResults.filter(r => r.score !== undefined).map(r => r.score as number);
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : undefined;

    // Add query metadata for debugging and analytics
    const responseData = {
      success: true,
      query: query.trim(),
      botId,
      topK: validatedTopK,
      scoreThreshold: scoreThreshold || 'not applied',
      resultsCount: formattedResults.length,
      totalAvailable: results.length,
      averageScore: averageScore,
      results: formattedResults,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Retrieval error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper function to convert score to confidence level
function getConfidenceLevel(score: number): string {
  if (score >= 0.9) return 'very-high';
  if (score >= 0.7) return 'high';
  if (score >= 0.5) return 'medium';
  if (score >= 0.3) return 'low';
  return 'very-low';
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}