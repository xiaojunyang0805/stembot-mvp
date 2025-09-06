// types/pdf2json.d.ts
declare module 'pdf2json' {
  interface PDFParser {
    new (): PDFParser;
    on(event: 'pdfParser_dataError', callback: (error: any) => void): void;
    on(event: 'pdfParser_dataReady', callback: (pdfData: any) => void): void;
    on(event: string, callback: (...args: any[]) => void): void;
    parseBuffer(buffer: Buffer): void;
    getRawTextContent(): string;
  }

  const PDFParser: PDFParser;
  export default PDFParser;
}