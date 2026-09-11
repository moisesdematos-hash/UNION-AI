export interface DocumentParseResult {
  fileName: string;
  title: string;
  cleanText: string;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  tables?: Array<Record<string, unknown>>;
}

export class DocumentParser {
  /**
   * Parses raw or base64 text/document content into structured text and metrics.
   */
  public static parse(
    content: string,
    fileName = 'document.pdf',
    pageRange = 'all'
  ): DocumentParseResult {
    let decodedText = content;

    // Check if base64 encoded
    if (content.startsWith('data:') || /^[A-Za-z0-9+/=]{100,}$/.test(content.trim())) {
      try {
        const base64Data = content.includes(',') ? content.split(',')[1] : content;
        decodedText = Buffer.from(base64Data, 'base64').toString('utf-8');
      } catch {
        decodedText = content;
      }
    }

    // Clean whitespace and structure paragraphs
    const cleanText = decodedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n\n');

    const words = cleanText.split(/\s+/).filter(Boolean);
    const charCount = cleanText.length;

    // Estimate page count (~300 words or 2000 chars per page if raw text)
    const pageCount = Math.max(1, Math.ceil(words.length / 300));

    // Optional table detection: lines with pipes | or commas
    const tables: Array<Record<string, unknown>> = [];
    const pipeLines = cleanText.split('\n').filter((l) => l.includes('|'));
    if (pipeLines.length >= 2) {
      const headers = pipeLines[0].split('|').map((h) => h.trim()).filter(Boolean);
      for (let i = 1; i < pipeLines.length; i++) {
        const cells = pipeLines[i].split('|').map((c) => c.trim()).filter(Boolean);
        // Skip markdown separator row like | --- | --- |
        if (cells.every((c) => /^[-:]+$/.test(c))) {
          continue;
        }
        if (cells.length === headers.length) {
          const rowObj: Record<string, unknown> = {};
          headers.forEach((header, idx) => {
            rowObj[header] = cells[idx];
          });
          tables.push(rowObj);
        }
      }
    }

    const title = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    return {
      fileName,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      cleanText,
      pageCount,
      wordCount: words.length,
      characterCount: charCount,
      tables: tables.length > 0 ? tables : undefined
    };
  }
}
