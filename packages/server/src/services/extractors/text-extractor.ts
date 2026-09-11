export interface TextExtractionResult {
  cleanText: string;
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
  estimatedTokens: number;
}

export class TextExtractor {
  /**
   * Normalizes raw briefing text and calculates lexical metrics.
   */
  public static extract(rawText: string): TextExtractionResult {
    const cleanText = (rawText || '').trim();
    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const characterCount = cleanText.length;

    // Average reading speed: 200 words per minute
    const readingTimeMinutes = Math.max(0.1, Number((wordCount / 200).toFixed(1)));

    // Approximation: 1 token ~= 4 chars or 0.75 words
    const estimatedTokens = Math.ceil(wordCount * 1.33);

    return {
      cleanText,
      wordCount,
      characterCount,
      readingTimeMinutes,
      estimatedTokens
    };
  }
}
