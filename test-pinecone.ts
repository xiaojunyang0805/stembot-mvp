import { Pinecone } from '@pinecone-database/pinecone';
import { pineconeIndex } from '@/lib/pinecone';

// Initialize Pinecone client for metadata operations
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

async function testPinecone() {
  try {
    // Option 1: List all indexes to confirm stembot-vectors exists
    const indexes = await pc.listIndexes();
    console.log('Available Indexes:', indexes);

    // Option 2: Describe the stembot-vectors index
    const indexDescription = await pc.describeIndex('stembot-vectors');
    console.log('Index Description for stembot-vectors:', indexDescription);

    // Optional: Confirm pineconeIndex is usable (e.g., check namespace existence)
    const namespaces = await pineconeIndex.listNamespaces();
    console.log('Namespaces in stembot-vectors:', namespaces);
  } catch (error) {
    console.error('Error connecting to Pinecone:', error);
  }
}

testPinecone();