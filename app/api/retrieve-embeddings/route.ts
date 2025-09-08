import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { createClient } from '@supabase/supabase-js';

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Constants
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'stembot-vectors-hf';
const EMBEDDING_MODEL = 'sentence-transformers/all-mpnet-base-v2';
const DEFAULT_TOP_K = 5;

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

interface RequestBody {
  query: string;
  botId: string;
  topK?: number;
  scoreThreshold?: number;
}

export async function POST(request: Request) {
  try {
    const { query, botId, topK = DEFAULT_TOP_K, scoreThreshold }: RequestBody = await request.json();

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

    // Fetch bot metadata from Supabase to get the namespace
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('pinecone_namespace')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      console.error('Supabase fetch error:', botError);
      return NextResponse.json(
        { error: 'Bot not found or error fetching bot metadata' },
        { status: 404 }
      );
    }

    if (!bot.pinecone_namespace) {
      return NextResponse.json(
        { error: 'No embeddings found for this bot. Please process the PDF first.' },
        { status: 404 }
      );
    }

    const pineconeIndex = pinecone.index(PINECONE_INDEX_NAME);
    const store = new PineconeStore(getEmbeddingsModel(), { pineconeIndex, namespace: bot.pinecone_namespace });

    const validatedTopK = Math.min(Math.max(topK, 1), 10); // Clamp between 1 and 10
    const results = await store.similaritySearch(query, validatedTopK);

    const formattedResults = results.map((result) => {
      const score = result.metadata?.score;
      return {
        pageContent: result.pageContent,
        metadata: result.metadata,
        score: score,
        confidence: score ? getConfidenceLevel(score) : 'unknown'
      };
    }).filter(result => {
      if (scoreThreshold !== undefined && result.score !== undefined) {
        return result.score >= scoreThreshold;
      }
      return true;
    }).sort((a, b) => {
      if (a.score === undefined) return 1;
      if (b.score === undefined) return -1;
      return b.score - a.score;
    });

    const scores = formattedResults.filter(r => r.score !== undefined).map(r => r.score as number);
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : undefined;

    const responseData = {
      success: true,
      query: query.trim(),
      botId,
      namespace: bot.pinecone_namespace,
      topK: validatedTopK,
      scoreThreshold: scoreThreshold || 'not applied',
      resultsCount: formattedResults.length,
      totalAvailable: results.length,
      averageScore: averageScore,
      results: formattedResults,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(responseData);

  } catch (error: unknown) {
    console.error('Retrieval error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage, timestamp: new Date().toISOString() },
      { status: 500 }
    );
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