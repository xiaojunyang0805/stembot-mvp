// lib/pdf-parser.ts - Fixed implementation
import { TextItem } from 'pdfjs-dist/types/src/display/api';

// Alternative using local interface
interface PDFTextItem {
  str?: string;
  // Add other properties you might need
}

export async function parsePDF(file: ArrayBuffer): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    const pdfjsWorkerModule = await import('pdfjs-dist/build/pdf.worker.entry');
    const workerSrc = pdfjsWorkerModule.default;
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    const pdf = await pdfjsLib.getDocument({ 
      data: file,
      useSystemFonts: true,
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
    }).promise;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item: PDFTextItem): item is TextItem => 'str' in item && (item as TextItem).str?.trim() !== '')
        .map((item: PDFTextItem) => (item as TextItem).str)
        .join(' ');
      text += pageText + '\n';
    }
    return text.trim();
  } catch (error) {
    throw new Error(`PDF parsing error: ${String(error)}`);
  }
}