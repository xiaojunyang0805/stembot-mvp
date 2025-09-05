import { getDocument } from 'pdfjs-dist';

export async function parsePDF(file: ArrayBuffer): Promise<string> {
  try {
    const pdf = await getDocument({ data: file }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter(item => 'str' in item)
        .map(item => (item as any).str)
        .join(' ');
      text += pageText + '\n';
    }

    return text.trim();
  } catch (error) {
    throw new Error(`PDF parsing error: ${String(error)}`);
  }
}