// ./lib/tutoringChain.ts
import { Ollama } from "@langchain/community/llms/ollama";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { BufferMemory } from "langchain/memory";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PromptTemplate } from "@langchain/core/prompts";

const initializeTutoringChain = async () => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
  const pineconeIndex = pinecone.Index("stembot-vectors-hf");
  
  // Use Ollama with a local model
  const model = new Ollama({
    baseUrl: "http://localhost:11434", // Default Ollama URL
    model: "llama2", // Use the model you downloaded
  });

  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY!,
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });

  const vectorStore = new PineconeStore(embeddings, {
    pineconeIndex,
    namespace: "tutoring-context",
  });

  const memory = new BufferMemory({
    memoryKey: "chat_history",
    inputKey: "input",
    outputKey: "response",
  });

  const prompt = new PromptTemplate({
  template: `You are a helpful STEM tutor. Provide clear, step-by-step explanations to solve problems. 
  First explain the concept, then show the steps to solve the specific problem.

Student: {input}
Tutor: `,
  inputVariables: ["input"],
});

  const chain = {
    call: async (params: { input: string }) => {
      const formattedPrompt = await prompt.format({
        chat_history: "",
        input: params.input,
      });
      
      const response = await model.call(formattedPrompt);
      return { response };
    }
  };

  return { chain, vectorStore };
};

export default initializeTutoringChain;