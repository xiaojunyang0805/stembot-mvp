export async function parsePDF(file: ArrayBuffer): Promise<string> {
  try {
    console.log('Parsing PDF, buffer size:', file.byteLength);
    
    // Dynamic import
    const pdfjsLib = await import('pdfjs-dist');
    
    // For server-side environments, use the worker entry point correctly
    // Note: pdfjs-dist/build/pdf.worker.entry exports a string path
    const pdfjsWorkerModule = await import('pdfjs-dist/build/pdf.worker.entry');
    // Extract the default export which should be the string path
    const workerSrc = pdfjsWorkerModule.default;
    
    // Set the worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    const pdf = await pdfjsLib.getDocument({ 
      data: file,
      useSystemFonts: true,
      useWorkerFetch: false,    // Disable HTTP worker fetching
      isEvalSupported: false,
      disableFontFace: true,    // Reduces potential canvas dependency
    }).promise;

    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      const pageText = content.items
        .filter((item: any) => 'str' in item && item.str?.trim())
        .map((item: any) => item.str)
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