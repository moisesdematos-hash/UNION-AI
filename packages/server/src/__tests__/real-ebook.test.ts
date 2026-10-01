import { afterEach, expect, it, vi } from 'vitest';
import { executeBilledAi } from '../services/ai/billed-ai.js';
import { generateRealThematicEbook } from '../services/ai/real-ebook-engine.js';
vi.mock('../services/ai/billed-ai.js', () => ({ executeBilledAi: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const response = (content: string) => ({ content, executionMode: 'REAL_AI', tokens: { totalTokens: 125 }, creditsCost: 0.001, modelUsed: 'actual-model' } as Awaited<ReturnType<typeof executeBilledAi>>);
it('counts actual chapter words and provider usage without invented images or page totals', async () => {
  const plan = JSON.stringify({ title: 'Title', subtitle: 'Subtitle', chapters: ['One', 'Two', 'Three', 'Four'] });
  vi.mocked(executeBilledAi).mockResolvedValueOnce(response(plan));
  for (let i = 0; i < 4; i++) vi.mocked(executeBilledAi).mockResolvedValueOnce(response(Array.from({ length: 1100 }, (_, word) => `chapter${i}-word${word}`).join(' ')));
  const generated = await generateRealThematicEbook('user', { prompt: 'Practical original topic', pageCount: 10 });
  expect(generated.result.totalWordCount).toBe(4400);
  expect(generated.result.chapters.every(chapter => chapter.wordCount === 1100)).toBe(true);
  expect(generated.result.pageCount).toBe(generated.result.pages.length);
  expect(generated.result.pages.every(page => !page.image)).toBe(true);
  expect(generated).toMatchObject({ tokens: 625, credits: 0.005, model: 'actual-model' });
});
it('fails instead of padding a provider response that stays below the minimum', async () => {
  vi.mocked(executeBilledAi).mockResolvedValueOnce(response(JSON.stringify({ title: 'Title', subtitle: 'Subtitle', chapters: ['One', 'Two', 'Three', 'Four'] })));
  vi.mocked(executeBilledAi).mockResolvedValue(response('Short response'));
  await expect(generateRealThematicEbook('user', { prompt: 'Topic', pageCount: 10 })).rejects.toThrow('EBOOK_MINIMUM_WORD_COUNT_NOT_MET');
  expect(executeBilledAi).toHaveBeenCalledTimes(3);
});
