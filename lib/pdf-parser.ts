export async function parsePDF(file: ArrayBuffer): Promise<string> {
  try {
    console.log('Parsing PDF, buffer size:', file.byteLength);
    
    // Dynamic import with proper typing
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
      
      // Define explicit types for the callback parameters
      const pageText = content.items
        .filter((item: unknown) => {
          // Type guard to check if item has 'str' property
          const hasStr = typeof item === 'object' && item !== null && 'str' in item;
          return hasStr && typeof (item as { str: unknown }).str === 'string';
        })
        .map((item: unknown) => {
          // Explicitly type the item and return the string
          const textItem = item as { str: string };
          return textItem.str.trim();
        })
        .filter((str: string) => str.length > 0)
        .join(' ');
      
      text += pageText + '\n';
    }

    console.log('PDF parsed successfully, text length:', text.length);
    return text.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`PDF parsing error: ${String(error)}`);
  }
}