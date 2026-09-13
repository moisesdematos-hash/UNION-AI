import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { generateThematicEbook, countWords } from '../services/ai/thematic-ebook-engine.js';

describe('Union Forge: E-book Word Count & Editorial Depth Engine', () => {
  const app = createApp();

  it('should generate ebooks directly via generateThematicEbook with > 1000 words per chapter', () => {
    const ebook = generateThematicEbook({
      prompt: 'Automação de Marketing com Inteligência Artificial',
      targetNiche: 'Marketing Digital e Negócios Online',
      pageCount: 10,
      wordsPerChapter: 1000,
      tone: 'didactic',
      audienceLevel: 'intermediate'
    });

    expect(ebook.type).toBe('EBOOK');
    expect(ebook.pageCount).toBeGreaterThanOrEqual(10);
    expect(ebook.chapters.length).toBeGreaterThanOrEqual(4);
    expect(ebook.totalWordCount).toBeGreaterThanOrEqual(4000);

    // Audit every single chapter
    ebook.chapters.forEach((chapter) => {
      expect(chapter.wordCount).toBeGreaterThanOrEqual(1000);
      expect(chapter.content.length).toBeGreaterThan(3000);
      expect(countWords(chapter.content)).toBe(chapter.wordCount);
    });
  });

  it('should generate ebooks with > 1000 words per chapter via HTTP POST /api/chat/forge/create', async () => {
    const res = await request(app)
      .post('/api/chat/forge/create')
      .send({
        type: 'EBOOK',
        prompt: 'Panificação Artesanal e Fermentação Natural de Elite',
        targetNiche: 'Gastronomia e Culinária Profissional',
        pageCount: 10,
        wordsPerChapter: 1000,
        tone: 'storytelling',
        audienceLevel: 'beginner'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const ebook = res.body.data;

    expect(ebook.title).toBeDefined();
    expect(ebook.pageCount).toBeGreaterThanOrEqual(10);
    expect(ebook.chapters).toBeInstanceOf(Array);
    expect(ebook.chapters.length).toBeGreaterThanOrEqual(4);

    ebook.chapters.forEach((chapter: any) => {
      expect(chapter.wordCount).toBeGreaterThanOrEqual(1000);
    });

    expect(ebook.totalWordCount).toBeGreaterThanOrEqual(4000);
  });
});
