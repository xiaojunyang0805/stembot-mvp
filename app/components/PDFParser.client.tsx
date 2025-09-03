'use client';

import { useEffect, useState } from 'react';

export const usePDFParser = () => {
  const [pdfjs, setPdfjs] = useState<any>(null);

  useEffect(() => {
    // Dynamically import pdfjs-dist only on client side
    const loadPDFJS = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        setPdfjs(pdfjsLib);
      } catch (error) {
        console.error('Failed to load PDF.js:', error);
      }
    };

    loadPDFJS();
  }, []);

  const parsePDF = async (file: File) => {
    if (!pdfjs) {
      throw new Error('PDF.js not loaded yet');
    }

    const fileUrl = URL.createObjectURL(file);
    try {
      const pdf = await pdfjs.getDocument(fileUrl).promise;
      const pageCount = pdf.numPages;
      
      let firstPageText = '';
      try {
        const firstPage = await pdf.getPage(1);
        const textContent = await firstPage.getTextContent();
        firstPageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .substring(0, 500);
      } catch (textError) {
        console.warn('Text extraction failed:', textError);
        firstPageText = 'Text extraction unavailable';
      }

      return { pageCount, firstPageText };
    } finally {
      URL.revokeObjectURL(fileUrl);
    }
  };

  return { parsePDF, isLoaded: !!pdfjs };
};