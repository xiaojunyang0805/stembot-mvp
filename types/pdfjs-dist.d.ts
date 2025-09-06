declare module 'pdfjs-dist/build/pdf.mjs';
declare module 'pdfjs-dist/build/pdf.worker.min.mjs';
declare module 'pdfjs-dist/build/pdf.worker.entry' {
  const workerSrc: string;
  export default workerSrc;
}

// types/pdfjs-dist.d.ts
declare module 'pdfjs-dist' {
  export interface TextItem {
    str: string;
    // Add other properties as needed
  }
  
  export interface TextMarkedContent {
    // Define properties if needed
  }
  
  // Export other necessary types and functions
  export function getDocument(params: any): any;
  export let GlobalWorkerOptions: {
    workerSrc: string;
  };
  // Add other exports as needed
}