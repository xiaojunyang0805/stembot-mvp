import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

// Target the stembot-vectors index
const pineconeIndex = pc.index('stembot-vectors');

export { pineconeIndex };